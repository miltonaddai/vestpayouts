-- Payout search totals: add a maximum amount and a custom date range.
-- p_from is inclusive and p_to is exclusive (the app passes the day after the chosen end date).
-- Dropped first so PostgREST doesn't see two overloads with defaults.

drop function if exists public.payout_search_totals(text, numeric, text, text);

create or replace function public.payout_search_totals(
  p_chain text default null,
  p_min numeric default null,
  p_period text default 'all',
  p_q text default null,
  p_max numeric default null,
  p_from timestamptz default null,
  p_to timestamptz default null
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
    and (p_max is null or p.amount_usd <= p_max)
    and p.paid_at >= public.period_start(p_period)
    and (p_from is null or p.paid_at >= p_from)
    and (p_to is null or p.paid_at < p_to)
    and (
      p_q is null
      or p.wallet ilike '%' || p_q || '%'
      or p.tx_hash ilike '%' || p_q || '%'
      or p.trader_name ilike '%' || p_q || '%'
      or w.display_name ilike '%' || p_q || '%'
    );
$$;

grant execute on function public.payout_search_totals(text, numeric, text, text, numeric, timestamptz, timestamptz) to anon, authenticated;
