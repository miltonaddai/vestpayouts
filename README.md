# VestPayouts

Independent tracker of [Vest](https://www.vestmarkets.com/) payouts. Every USDC transfer Vest's payout contracts send on Base and Arbitrum is listed with its transaction, plus totals, a leaderboard and guides. The site exists to rank for "Vest payouts", "Vest payout proof" and "Vest review", and to send traders to Vest through one referral link.

VestPayouts is independent. It is not affiliated with or endorsed by Vest. See [BRAND.md](BRAND.md) for the name, mark, colors and the disclaimers. The public site is [https://vestpayouts.com](https://vestpayouts.com).

## Stack

Next.js (App Router) and TypeScript, Tailwind, shadcn/ui. Payouts live in Supabase (Postgres). Pages that show numbers are statically generated and revalidated about once an hour.

## Run it locally

Requires Node 20.9+ and Yarn. Docker is only needed if you want a local database; you can point the app at a hosted Supabase project instead.

```bash
yarn install
cp .env.example .env.local
yarn dev
```

The app listens on [http://127.0.0.1:4317](http://127.0.0.1:4317).

With no Supabase keys, the site still builds and renders. Every figure is then an in-memory **sample** and the amber banner says so. Connect a database to replace them.

### Local Supabase

```bash
yarn db:start          # first run downloads images; needs Docker
yarn db:reset          # reapply migrations and the sample seed
```

`supabase/config.toml` turns off auth, storage, realtime and studio. The stack you need is Postgres, PostgREST and Kong.

CLI 3's `supabase status` does not print API keys. Local development uses the standard Supabase demo JWTs, already filled in `.env.example`:

| Env | Local demo value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `http://127.0.0.1:54321` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | the anon JWT in `.env.example` |
| `SUPABASE_SERVICE_ROLE_KEY` | the service_role JWT in `.env.example` |

Those demo keys are public and only work against a local stack. On a hosted project, copy the anon and service_role keys from **Project Settings → API**.

### Hosted Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Run the migration in `supabase/migrations/` (SQL editor, or `supabase link` then `supabase db push`).
3. Optionally run `supabase/seed.sql`. Every seed row is `source = 'sample'` and is hidden automatically once a real payout exists.
4. Put the project URL and keys in `.env.local` (and in Vercel, below).

## Environment variables

| Variable | Required | What it does |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Production | Canonical URLs, sitemap, Open Graph. No trailing slash. Defaults to `https://vestpayouts.com` when unset. Locally, set `http://127.0.0.1:4317`. |
| `NEXT_PUBLIC_SUPABASE_URL` | To show real data | Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | To show real data | Public key. Reads published payouts only (RLS). |
| `SUPABASE_SERVICE_ROLE_KEY` | To write data | Bypasses RLS. Ingest, admin, referral-click log. Never expose it to the browser. |
| `NEXT_PUBLIC_VEST_REFERRAL_URL` | When you have it | Full referral link from your Vest dashboard. Preferred. |
| `NEXT_PUBLIC_VEST_REFERRAL_CODE` | Alternative | Appended as `?ref=<code>` when no full URL is set, and shown next to buttons. |
| `NEXT_PUBLIC_VEST_REFERRAL_PARAM` | No | Query param used with the code. Default `ref`. |
| `NEXT_PUBLIC_REFERRAL_APPEND_UTM` | No | Set to `false` to stop adding `utm_*` params. |
| `REVALIDATE_SECRET` | Recommended | Bearer token for `POST /api/revalidate`, which refreshes cached pages after new data lands. |
| `ADMIN_PASSWORD` | To use /admin | Unset, and `/admin` only explains how to turn itself on. |
| `BASE_RPC_URL`, `ARBITRUM_RPC_URL` | For a full backfill | Archive RPC endpoints. Free public RPCs cannot read old Base history. |
| `REFERRAL_WEBHOOK_URL` | No | Also POSTs each referral click as JSON. |
| `NEXT_PUBLIC_CONTACT_EMAIL` | No | Shown on about, privacy and terms. |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | No | Google Search Console token. |

Every Vest button goes to `/go?p=<placement>&from=<path>`, which logs the click (server log, `referral_clicks`, optional webhook) and 302s to the referral URL with `utm_source=vestpayouts`, `utm_medium=referral` and `utm_campaign=<placement>`.

## Add payouts

Three ways, all idempotent where they can be.

### 1. Ingest from the chain

Vest sends withdrawals as USDC from a payout contract on Base (`0x55133c825603e6a5b9e911abab23e75dc3bb07af`) and Arbitrum One (`0xb2f86eae1197032fa85389cc6c0f3b06b58dd1ea`). `yarn ingest` reads those events, upserts on `(chain, tx hash, log index)`, and stores its cursor in `ingest_state`.

```bash
yarn ingest                          # both chains, from the cursor (or 2026-10-01 on first run)
yarn ingest --chain base
yarn ingest --since 2026-07-01       # backfill further back; needs an archive RPC on Base
```

Run it hourly. `.github/workflows/ingest.yml` does that when the repository secrets are set. After a run it calls `/api/revalidate` if `REVALIDATE_SECRET` and `NEXT_PUBLIC_SITE_URL` are set.

A row proves Vest's contract sent that much USDC to that wallet. It does not, by itself, prove the money was funded-account profit, because ordinary exchange withdrawals leave through the same contract. That limit is written up at `/methodology`.

### 2. Admin

Set `ADMIN_PASSWORD` and open `/admin`. You can add one payout, import a CSV, attach a display name to a wallet, and delete sample rows. The page is `noindex` and the password is checked against an httpOnly cookie.

### 3. CSV

```bash
yarn payouts:import data/payouts.example.csv --dry-run
yarn payouts:import data/payouts.example.csv
```

Columns: `paid_at,amount_usd,chain,tx_hash,wallet,trader,proof_url,note`. Only `paid_at` and `amount_usd` are required. A row whose `tx_hash` matches an ingested payout adds the trader name and proof link to that payout instead of inserting a duplicate.

## How the database is locked down

`supabase/migrations/20261106000000_init_payouts.sql`:

- `payouts`, `wallets` (display names), `ingest_state`, `referral_clicks`.
- RLS is on for every table. `anon` may select published payouts, wallet names and ingest status. There are no write policies.
- `anon` and `authenticated` are also `REVOKE`d from insert, update and delete. Writes go through the service role.
- `referral_clicks` has no policies at all, so only the service role can read or write it.
- The `visible_payouts` view hides `source = 'sample'` rows as soon as any real published payout exists. Sample rows are labelled in the UI either way.

Aggregates (`payout_summary`, `payout_daily`, `payout_leaderboard`, `payout_search_totals`) run in Postgres so pages don't pull the whole table.

Regenerate `supabase/seed.sql` after editing `src/lib/payouts/sample-data.ts`:

```bash
yarn db:seed-sql
```

Regenerate TypeScript types after a migration, against a running local stack:

```bash
yarn db:types
```

## Deploy to Vercel

1. Push the repository and import it in Vercel. Framework preset is Next.js. Install command `yarn install`, build `yarn build`.
2. Add the environment variables from the table above. `NEXT_PUBLIC_SITE_URL` must be the production origin, for example `https://vestpayouts.com`.
3. Deploy. The build prerenders pages and, when the Supabase env vars are present, the largest on-chain payout pages.
4. Point a daily or hourly job at `yarn ingest` (the GitHub Action, a VPS cron, or similar). Vercel's serverless functions are a poor place to scan millions of blocks.
5. In Search Console, submit `https://<your domain>/sitemap.xml`.

`POST /api/revalidate` with `Authorization: Bearer $REVALIDATE_SECRET` expires the data cache immediately. Pages also revalidate on their own: payout lists about hourly, individual payout pages about daily.

## Scripts

| Command | |
| --- | --- |
| `yarn dev` | Dev server on port 4317 |
| `yarn build` / `yarn start` | Production build and server |
| `yarn lint` / `yarn typecheck` | ESLint and `tsc --noEmit` |
| `yarn ingest` | Pull new on-chain payouts into Supabase |
| `yarn payouts:import <file.csv>` | Import manual payouts (`--dry-run` to validate only) |
| `yarn db:start` / `yarn db:reset` | Local Supabase |
| `yarn db:seed-sql` | Rewrite `supabase/seed.sql` from the sample list |
| `yarn db:types` | Regenerate `src/lib/supabase/database.types.ts` |

## Pages

`/` live feed and totals, `/payouts` filterable list, `/payouts/[chain]/[tx]` proof pages, `/leaderboard` (and `/24h`, `/7d`, `/30d`), `/wallets/[address]`, `/how-vest-payouts-work`, `/vest-review`, `/faq`, `/blog` plus four guides, `/methodology`, `/about`, `/disclosure`, `/privacy`, `/terms`, `/admin`.

`/sitemap.xml` and `/robots.txt` are generated. `/robots.txt` disallows `/admin`, `/go` and `/api/`.
