-- All-time rank for any wallet, for the "See your rank" page.
-- The precomputed leaderboard only keeps the top 500, so this ranks on demand.
-- Grouping matches refresh_payout_stats (wallet, else trader name, else row id),
-- so ranks agree with /leaderboard.

create or replace function public.wallet_rank(addr text)
returns jsonb
language sql
stable
set search_path = public
as $$
  with totals as (
    select coalesce(v.wallet, v.trader_name, v.id::text) as k, sum(v.amount_usd) as total
    from public.visible_payouts v
    group by 1
  ),
  me as (
    select total from totals where k = lower(wallet_rank.addr)
  )
  select case
    when not exists (select 1 from me) then null
    else jsonb_build_object(
      'rank', 1 + (select count(*) from totals t where t.total > (select total from me)),
      'wallets', (select count(*) from totals)
    )
  end;
$$;

revoke all on function public.wallet_rank(text) from public;
grant execute on function public.wallet_rank(text) to anon, authenticated;
