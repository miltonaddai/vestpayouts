-- VestPayouts: precomputed payout stats for fast anonymous reads.
--
-- Idempotent and safe to re-run in the Supabase SQL Editor, whether or not
-- 20261107190726_faster_payout_summary.sql was applied. This replaces that
-- approach: instead of recomputing aggregates on every anonymous RPC, ingest
-- and import refresh small cache tables with the secret key (or this script,
-- which refreshes once at the end).
--
-- Creates:
--   public.payout_stats              one row, cached payout_summary jsonb
--   public.payout_daily_stats        one row per UTC day
--   public.payout_leaderboard_stats  top 500 wallets per period
--   public.refresh_payout_stats()    service-role / postgres only
--
-- Recreates payout_summary, payout_daily and payout_leaderboard to read those
-- tables, and rewrites payout_search_totals / payout_percentile to scan
-- payouts directly (no visible_payouts inlining) with extra indexes.

-- Cache tables ---------------------------------------------------------------

create table if not exists public.payout_stats (
  id smallint primary key default 1 check (id = 1),
  summary jsonb not null default '{}'::jsonb,
  refreshed_at timestamptz not null default now()
);

insert into public.payout_stats (id, summary)
values (1, '{}'::jsonb)
on conflict (id) do nothing;

create table if not exists public.payout_daily_stats (
  day date primary key,
  amount numeric not null default 0,
  payouts bigint not null default 0
);

create table if not exists public.payout_leaderboard_stats (
  period text not null check (period in ('24h', '7d', '30d', 'all')),
  wallet text,
  label text,
  total numeric not null,
  payouts bigint not null,
  largest numeric not null,
  last_paid_at timestamptz not null,
  rank integer not null check (rank > 0),
  primary key (period, rank)
);

create index if not exists payout_leaderboard_stats_period_idx
  on public.payout_leaderboard_stats (period, rank);

create index if not exists payouts_visible_paid_at_idx
  on public.payouts (paid_at desc)
  where published and source <> 'sample';

create index if not exists payouts_visible_amount_idx
  on public.payouts (amount_usd desc)
  where published and source <> 'sample';

create index if not exists payouts_visible_chain_paid_at_idx
  on public.payouts (chain, paid_at desc)
  where published and source <> 'sample';

-- RLS: public reads, no public writes ---------------------------------------

alter table public.payout_stats enable row level security;
alter table public.payout_daily_stats enable row level security;
alter table public.payout_leaderboard_stats enable row level security;

drop policy if exists "Payout stats are public" on public.payout_stats;
create policy "Payout stats are public"
  on public.payout_stats for select to anon, authenticated
  using (true);

drop policy if exists "Daily payout stats are public" on public.payout_daily_stats;
create policy "Daily payout stats are public"
  on public.payout_daily_stats for select to anon, authenticated
  using (true);

drop policy if exists "Leaderboard stats are public" on public.payout_leaderboard_stats;
create policy "Leaderboard stats are public"
  on public.payout_leaderboard_stats for select to anon, authenticated
  using (true);

revoke insert, update, delete, truncate
  on public.payout_stats, public.payout_daily_stats, public.payout_leaderboard_stats
  from anon, authenticated;

grant select
  on public.payout_stats, public.payout_daily_stats, public.payout_leaderboard_stats
  to anon, authenticated;

-- Refresh (service role / SQL editor) ---------------------------------------

create or replace function public.refresh_payout_stats()
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  has_real boolean;
  result jsonb;
begin
  select exists (
    select 1 from public.payouts p
    where p.published and p.source <> 'sample'
  ) into has_real;

  drop table if exists pg_temp.payout_refresh_visible;
  create temporary table pg_temp.payout_refresh_visible on commit drop as
  select
    p.id, p.source, p.chain, p.tx_hash, p.log_index, p.block_number,
    p.wallet, p.amount_usd, p.paid_at, p.requested_at,
    p.trader_name, p.proof_url, p.note,
    w.display_name as wallet_label
  from public.payouts p
  left join public.wallets w on w.address = p.wallet
  where p.published
    and (not has_real or p.source <> 'sample');

  create index on pg_temp.payout_refresh_visible (paid_at);
  create index on pg_temp.payout_refresh_visible (amount_usd desc);

  with windows_raw as (
    select * from (values
      ('24h', now() - interval '1 day'),
      ('7d',  now() - interval '7 days'),
      ('30d', now() - interval '30 days'),
      ('all', '-infinity'::timestamptz)
    ) as w(period, start_at)
  ),
  window_stats as (
    select
      w.period,
      jsonb_build_object(
        'amount',  coalesce(sum(v.amount_usd), 0),
        'count',   count(v.id),
        'wallets', count(distinct coalesce(v.wallet, v.trader_name, v.id::text)),
        'largest', (
          select to_jsonb(l)
          from (
            select
              v2.id, v2.source, v2.chain, v2.tx_hash, v2.log_index, v2.block_number,
              v2.wallet, v2.amount_usd, v2.paid_at, v2.requested_at,
              v2.trader_name, v2.proof_url, v2.note, v2.wallet_label
            from pg_temp.payout_refresh_visible v2
            where v2.paid_at >= w.start_at
            order by v2.amount_usd desc, v2.id desc
            limit 1
          ) l
        )
      ) as stats
    from windows_raw w
    left join pg_temp.payout_refresh_visible v on v.paid_at >= w.start_at
    group by w.period, w.start_at
  )
  select jsonb_build_object(
    'windows', (select jsonb_object_agg(period, stats) from window_stats),
    'median_amount_30d', (
      select percentile_cont(0.5) within group (order by amount_usd)
      from pg_temp.payout_refresh_visible
      where paid_at >= now() - interval '30 days'
    ),
    'median_processing_hours_30d', (
      select percentile_cont(0.5) within group (order by extract(epoch from paid_at - requested_at) / 3600)
      from pg_temp.payout_refresh_visible
      where paid_at >= now() - interval '30 days'
        and requested_at is not null
        and requested_at <= paid_at
    ),
    'by_chain', coalesce((
      select jsonb_agg(jsonb_build_object('chain', chain, 'amount', amount, 'count', cnt) order by amount desc)
      from (
        select chain, sum(amount_usd) amount, count(*) cnt
        from pg_temp.payout_refresh_visible
        where chain is not null
        group by chain
      ) c
    ), '[]'::jsonb),
    'first_paid_at', (select min(paid_at) from pg_temp.payout_refresh_visible),
    'synced_at', (select min(updated_at) from public.ingest_state),
    'is_sample', (
      exists (select 1 from pg_temp.payout_refresh_visible)
      and not exists (select 1 from pg_temp.payout_refresh_visible where source <> 'sample')
    )
  )
  into result;

  insert into public.payout_stats (id, summary, refreshed_at)
  values (1, result, now())
  on conflict (id) do update
    set summary = excluded.summary,
        refreshed_at = excluded.refreshed_at;

  delete from public.payout_daily_stats;
  insert into public.payout_daily_stats (day, amount, payouts)
  select (v.paid_at at time zone 'utc')::date, coalesce(sum(v.amount_usd), 0), count(*)
  from pg_temp.payout_refresh_visible v
  group by 1;

  delete from public.payout_leaderboard_stats;
  insert into public.payout_leaderboard_stats (
    period, wallet, label, total, payouts, largest, last_paid_at, rank
  )
  select period, wallet, label, total, payouts, largest, last_paid_at, rank
  from (
    select
      w.period,
      min(v.wallet) as wallet,
      coalesce(max(v.wallet_label), max(v.trader_name)) as label,
      sum(v.amount_usd) as total,
      count(*) as payouts,
      max(v.amount_usd) as largest,
      max(v.paid_at) as last_paid_at,
      row_number() over (partition by w.period order by sum(v.amount_usd) desc) as rank
    from (values ('24h'), ('7d'), ('30d'), ('all')) w(period)
    join pg_temp.payout_refresh_visible v on v.paid_at >= public.period_start(w.period)
    group by w.period, coalesce(v.wallet, v.trader_name, v.id::text)
  ) ranked
  where rank <= 500;

  return result;
end;
$$;

revoke all on function public.refresh_payout_stats() from public;
revoke all on function public.refresh_payout_stats() from anon, authenticated;
grant execute on function public.refresh_payout_stats() to postgres, service_role;

-- Public RPCs read the cache (or a cheap indexed scan) ----------------------

create or replace function public.payout_summary()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(
    (
      select s.summary
      from public.payout_stats s
      where s.id = 1 and s.summary ? 'windows'
    ),
    '{
      "windows": {
        "24h": {"amount": 0, "count": 0, "wallets": 0, "largest": null},
        "7d":  {"amount": 0, "count": 0, "wallets": 0, "largest": null},
        "30d": {"amount": 0, "count": 0, "wallets": 0, "largest": null},
        "all": {"amount": 0, "count": 0, "wallets": 0, "largest": null}
      },
      "median_amount_30d": null,
      "median_processing_hours_30d": null,
      "by_chain": [],
      "first_paid_at": null,
      "synced_at": null,
      "is_sample": false
    }'::jsonb
  );
$$;

create or replace function public.payout_daily(days integer default 30)
returns table (day date, amount numeric, payouts bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select d::date, coalesce(s.amount, 0), coalesce(s.payouts, 0)
  from generate_series(
    date_trunc('day', now() at time zone 'utc') - make_interval(days => greatest(days, 1) - 1),
    date_trunc('day', now() at time zone 'utc'),
    interval '1 day'
  ) d
  left join public.payout_daily_stats s on s.day = d::date
  order by d;
$$;

create or replace function public.payout_leaderboard(period text default 'all', max_rows integer default 50)
returns table (
  wallet text, label text, total numeric, payouts bigint, largest numeric, last_paid_at timestamptz
)
language sql
stable
security invoker
set search_path = ''
as $$
  select l.wallet, l.label, l.total, l.payouts, l.largest, l.last_paid_at
  from public.payout_leaderboard_stats l
  where l.period = period
  order by l.rank
  limit least(greatest(max_rows, 1), 500);
$$;

create or replace function public.payout_search_totals(
  p_chain text default null, p_min numeric default null, p_period text default 'all', p_q text default null
)
returns table (payouts bigint, amount numeric)
language sql
stable
security invoker
set search_path = ''
as $$
  select count(*), coalesce(sum(p.amount_usd), 0)
  from public.payouts p
  left join public.wallets w on w.address = p.wallet
  where p.published
    and (
      p.source <> 'sample'
      or not exists (select 1 from public.payouts r where r.published and r.source <> 'sample')
    )
    and (p_chain is null or p.chain::text = p_chain)
    and (p_min is null or p.amount_usd >= p_min)
    and p.paid_at >= public.period_start(p_period)
    and (
      p_q is null
      or p.wallet ilike '%' || p_q || '%'
      or p.tx_hash ilike '%' || p_q || '%'
      or p.trader_name ilike '%' || p_q || '%'
      or w.display_name ilike '%' || p_q || '%'
    );
$$;

create or replace function public.payout_percentile(amount numeric)
returns double precision
language sql
stable
security invoker
set search_path = ''
as $$
  select case when count(*) = 0 then 0
    else 100.0 * count(*) filter (where p.amount_usd < amount) / count(*) end
  from public.payouts p
  where p.published
    and (
      p.source <> 'sample'
      or not exists (select 1 from public.payouts r where r.published and r.source <> 'sample')
    );
$$;

grant execute on function
  public.payout_summary(),
  public.payout_daily(integer),
  public.payout_leaderboard(text, integer),
  public.payout_search_totals(text, numeric, text, text),
  public.payout_percentile(numeric)
to anon, authenticated;

-- Populate caches now (SQL Editor runs as postgres). Safe to repeat.
select public.refresh_payout_stats();
