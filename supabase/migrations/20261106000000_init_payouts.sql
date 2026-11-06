-- VestPayouts core schema: payouts, wallet aliases, ingestion cursors, referral clicks.
-- Reads: anon/authenticated may SELECT published payouts and public metadata (RLS).
-- Writes: no INSERT/UPDATE/DELETE policies exist, so only the service role (which
-- bypasses RLS) can write — used by the ingester, the import script and /admin.

create type public.payout_source as enum ('onchain', 'manual', 'sample');
create type public.payout_chain as enum ('base', 'arbitrum');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Wallet aliases ("traders"): optional display names for recipient wallets.
create table public.wallets (
  address      text primary key check (address ~ '^0x[0-9a-f]{40}$'),
  display_name text not null check (char_length(display_name) between 1 and 60),
  x_handle     text check (x_handle is null or x_handle ~ '^@?[A-Za-z0-9_]{1,15}$'),
  url          text check (url is null or url ~ '^https?://'),
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger wallets_updated_at before update on public.wallets
  for each row execute function public.set_updated_at();

create table public.payouts (
  id            bigint generated always as identity primary key,
  source        public.payout_source not null,
  chain         public.payout_chain,
  tx_hash       text check (tx_hash is null or tx_hash ~ '^0x[0-9a-f]{64}$'),
  log_index     integer check (log_index is null or log_index >= 0),
  block_number  bigint,
  wallet        text check (wallet is null or wallet ~ '^0x[0-9a-f]{40}$'),
  amount_usd    numeric(20, 6) not null check (amount_usd > 0),
  paid_at       timestamptz not null,
  requested_at  timestamptz,
  trader_name   text check (trader_name is null or char_length(trader_name) <= 80),
  proof_url     text check (proof_url is null or proof_url ~ '^https?://'),
  note          text check (note is null or char_length(note) <= 500),
  published     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint payouts_onchain_unique unique (chain, tx_hash, log_index),
  constraint payouts_onchain_complete check (
    source <> 'onchain' or (chain is not null and tx_hash is not null and log_index is not null and wallet is not null)
  ),
  constraint payouts_tx_needs_chain check (tx_hash is null or chain is not null)
);

comment on table public.payouts is
  'One row per payout. source=onchain rows come from Vest payout contracts; manual rows are reported payouts; sample rows are placeholders shown only while no real rows exist.';

create index payouts_paid_at_idx on public.payouts (paid_at desc) where published;
create index payouts_amount_idx on public.payouts (amount_usd desc) where published;
create index payouts_wallet_idx on public.payouts (wallet, paid_at desc) where published;
create index payouts_chain_paid_at_idx on public.payouts (chain, paid_at desc) where published;
create index payouts_tx_idx on public.payouts (tx_hash);

create trigger payouts_updated_at before update on public.payouts
  for each row execute function public.set_updated_at();

-- Ingestion cursor per chain (written by scripts/ingest-onchain.ts).
create table public.ingest_state (
  chain       public.payout_chain primary key,
  contract    text not null,
  from_block  bigint not null,
  last_block  bigint not null,
  updated_at  timestamptz not null default now()
);

-- Referral click log (written by the /go redirect with the service role).
create table public.referral_clicks (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  placement   text not null,
  from_path   text,
  referer     text,
  user_agent  text,
  country     text
);

create index referral_clicks_created_idx on public.referral_clicks (created_at desc);
create index referral_clicks_placement_idx on public.referral_clicks (placement, created_at desc);

-- Row-level security ---------------------------------------------------------
alter table public.payouts enable row level security;
alter table public.wallets enable row level security;
alter table public.ingest_state enable row level security;
alter table public.referral_clicks enable row level security;

create policy "Published payouts are public"
  on public.payouts for select to anon, authenticated
  using (published);

create policy "Wallet aliases are public"
  on public.wallets for select to anon, authenticated
  using (true);

create policy "Ingestion status is public"
  on public.ingest_state for select to anon, authenticated
  using (true);
-- referral_clicks: intentionally no policies (service role only).

-- Defense in depth on top of RLS: public roles can never write.
revoke insert, update, delete, truncate on public.payouts, public.wallets, public.ingest_state
  from anon, authenticated;
revoke all on public.referral_clicks from anon, authenticated;

-- Read model -----------------------------------------------------------------
-- Sample rows disappear automatically once any real published payout exists.
create view public.visible_payouts
with (security_invoker = true)
as
select
  p.id, p.source, p.chain, p.tx_hash, p.log_index, p.block_number, p.wallet,
  p.amount_usd, p.paid_at, p.requested_at, p.trader_name, p.proof_url, p.note,
  w.display_name as wallet_label
from public.payouts p
left join public.wallets w on w.address = p.wallet
where p.published
  and (
    p.source <> 'sample'
    or not exists (select 1 from public.payouts r where r.published and r.source <> 'sample')
  );

grant select on public.visible_payouts to anon, authenticated;

create or replace function public.period_start(period text)
returns timestamptz
language sql
stable
set search_path = ''
as $$
  select case period
    when '24h' then now() - interval '1 day'
    when '7d'  then now() - interval '7 days'
    when '30d' then now() - interval '30 days'
    else '-infinity'::timestamptz
  end;
$$;

-- One round trip for every headline number on the site.
create or replace function public.payout_summary()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with v as (select * from public.visible_payouts),
  windows as (
    select w.period,
      jsonb_build_object(
        'amount',  coalesce(sum(v.amount_usd), 0),
        'count',   count(v.id),
        'wallets', count(distinct coalesce(v.wallet, v.trader_name, v.id::text)),
        'largest', (
          select to_jsonb(l) from v l
          where l.paid_at >= public.period_start(w.period)
          order by l.amount_usd desc limit 1
        )
      ) as stats
    from (values ('24h'), ('7d'), ('30d'), ('all')) w(period)
    left join v on v.paid_at >= public.period_start(w.period)
    group by w.period
  )
  select jsonb_build_object(
    'windows', (select jsonb_object_agg(period, stats) from windows),
    'median_amount_30d', (
      select percentile_cont(0.5) within group (order by amount_usd)
      from v where paid_at >= now() - interval '30 days'
    ),
    'median_processing_hours_30d', (
      select percentile_cont(0.5) within group (order by extract(epoch from paid_at - requested_at) / 3600)
      from v where paid_at >= now() - interval '30 days' and requested_at is not null and requested_at <= paid_at
    ),
    'by_chain', coalesce((
      select jsonb_agg(jsonb_build_object('chain', chain, 'amount', amount, 'count', cnt) order by amount desc)
      from (select chain, sum(amount_usd) amount, count(*) cnt from v where chain is not null group by chain) c
    ), '[]'::jsonb),
    'first_paid_at', (select min(paid_at) from v),
    'synced_at', (select min(updated_at) from public.ingest_state),
    'is_sample', (exists (select 1 from v) and not exists (select 1 from v where source <> 'sample'))
  );
$$;

create or replace function public.payout_daily(days integer default 30)
returns table (day date, amount numeric, payouts bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select d::date, coalesce(sum(v.amount_usd), 0), count(v.id)
  from generate_series(
    date_trunc('day', now() at time zone 'utc') - make_interval(days => greatest(days, 1) - 1),
    date_trunc('day', now() at time zone 'utc'),
    interval '1 day'
  ) d
  left join public.visible_payouts v
    on (v.paid_at at time zone 'utc') >= d and (v.paid_at at time zone 'utc') < d + interval '1 day'
  group by d
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
  select
    min(v.wallet),
    coalesce(max(v.wallet_label), max(v.trader_name)),
    sum(v.amount_usd),
    count(*),
    max(v.amount_usd),
    max(v.paid_at)
  from public.visible_payouts v
  where v.paid_at >= public.period_start(period)
  group by coalesce(v.wallet, v.trader_name, v.id::text)
  order by sum(v.amount_usd) desc
  limit least(greatest(max_rows, 1), 500);
$$;

-- Filtered totals for the /payouts list (rows come from a normal paged select).
create or replace function public.payout_search_totals(
  p_chain text default null, p_min numeric default null, p_period text default 'all', p_q text default null
)
returns table (payouts bigint, amount numeric)
language sql
stable
security invoker
set search_path = ''
as $$
  select count(*), coalesce(sum(amount_usd), 0)
  from public.visible_payouts v
  where (p_chain is null or v.chain::text = p_chain)
    and (p_min is null or v.amount_usd >= p_min)
    and v.paid_at >= public.period_start(p_period)
    and (
      p_q is null
      or v.wallet ilike '%' || p_q || '%'
      or v.tx_hash ilike '%' || p_q || '%'
      or v.trader_name ilike '%' || p_q || '%'
      or v.wallet_label ilike '%' || p_q || '%'
    );
$$;

-- Share of visible payouts smaller than an amount (0–100), for "bigger than X% of payouts".
create or replace function public.payout_percentile(amount numeric)
returns double precision
language sql
stable
security invoker
set search_path = ''
as $$
  select case when count(*) = 0 then 0
    else 100.0 * count(*) filter (where v.amount_usd < amount) / count(*) end
  from public.visible_payouts v;
$$;

grant execute on function
  public.payout_summary(),
  public.payout_daily(integer),
  public.payout_leaderboard(text, integer),
  public.payout_search_totals(text, numeric, text, text),
  public.payout_percentile(numeric),
  public.period_start(text)
to anon, authenticated;
