-- VestPayouts: let refresh_payout_stats() run through the Supabase API.
--
-- Supabase enables pg_safeupdate for requests that come through its REST API,
-- which rejects any DELETE without a WHERE clause. The refresh function cleared
-- its cache tables with a bare DELETE, so every call from the API process failed
-- with "DELETE requires a WHERE clause" and the cached totals, daily series and
-- leaderboard stayed frozen at whatever the SQL Editor last computed.
--
-- Same function as 20261107203851_precomputed_payout_stats.sql; the only change
-- is `where true` on the two deletes.
--
-- Also fixes payout_leaderboard(period, max_rows): its filter `l.period = period`
-- resolved `period` to the column, not the parameter (SQL functions prefer the
-- column), so it compared the column to itself and every tab returned the top
-- rows of all four periods interleaved by rank. The parameter is now qualified.
--
-- Idempotent. Run it in the SQL Editor; the final line refreshes the caches once.

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

  delete from public.payout_daily_stats where true;
  insert into public.payout_daily_stats (day, amount, payouts)
  select (v.paid_at at time zone 'utc')::date, coalesce(sum(v.amount_usd), 0), count(*)
  from pg_temp.payout_refresh_visible v
  group by 1;

  delete from public.payout_leaderboard_stats where true;
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

-- Leaderboard: qualify the parameter so it isn't shadowed by the column. ----

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
  where l.period = payout_leaderboard.period
  order by l.rank
  limit least(greatest(payout_leaderboard.max_rows, 1), 500);
$$;

grant execute on function public.payout_leaderboard(text, integer) to anon, authenticated;


select public.refresh_payout_stats();
