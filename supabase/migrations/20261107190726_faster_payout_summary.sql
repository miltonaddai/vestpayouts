-- payout_summary used to inline visible_payouts many times (four windows,
-- a largest-row subquery per window, two medians, by_chain, first_paid_at).
-- After importing tens of thousands of published rows, that exceeds the
-- anon/authenticated statement timeout (~3s) while the secret-key path
-- still finishes in about 4s. Materialize the visible set once, then
-- aggregate. SECURITY INVOKER and the public grant are unchanged.

create or replace function public.payout_summary()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with v as materialized (
    select * from public.visible_payouts
  ),
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
