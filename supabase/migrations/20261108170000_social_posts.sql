-- Log of automated social posts (X roundups and big-payout alerts).
-- `ref` identifies what a post is about, e.g. 'roundup:2026-11-08T14:00:00.000Z' or
-- 'big:12345' (payout id). The unique (network, ref) pair is how the poster
-- claims an item before posting, so the same thing is never posted twice.

create table if not exists public.social_posts (
  id          bigint generated always as identity primary key,
  network     text not null default 'x',
  kind        text not null check (kind in ('roundup', 'big')),
  ref         text not null,
  status      text not null check (status in ('pending', 'posted', 'skipped', 'failed', 'dry_run')),
  post_id     text,
  body        text not null default '',
  error       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint social_posts_ref_unique unique (network, ref)
);

create index if not exists social_posts_created_idx on public.social_posts (network, created_at desc);

-- Server-only: the API uses the service role. No public policies.
alter table public.social_posts enable row level security;
revoke all on table public.social_posts from anon, authenticated;
