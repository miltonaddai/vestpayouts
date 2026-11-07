# VestPayouts

Independent tracker of [Vest](https://www.vestmarkets.com/) payouts. Every USDC transfer Vest's payout contracts send on Base and Arbitrum is listed with its transaction, plus totals, a leaderboard and guides. The site exists to rank for "Vest payouts", "Vest payout proof" and "Vest review", and to send traders to Vest through one referral link.

VestPayouts is independent. It is not affiliated with or endorsed by Vest. See [BRAND.md](BRAND.md) for the name, mark, colors and the disclaimers. The public site is [https://vestpayouts.com](https://vestpayouts.com).

## Architecture

Yarn workspaces. The website never holds the Supabase service-role key.

```
apps/web            Next.js. Pages, UI, SEO, public reads (anon key + RLS).
apps/api            Hono service. Ingest, CSV import, admin writes, click log, cron.
packages/shared     Chain constants, payout types, CSV schema, Supabase types, sample rows.
supabase/           Migrations and the sample seed. Used by both apps.
```

Public pages read Postgres through the anon key. Row level security allows that read and refuses every write. The API uses the service role for inserts and updates, then calls `POST /api/revalidate` on the website so cached pages refresh.

`/go` stays on the website. A referral link should be a same-origin 302, so the route builds the Vest URL and redirects immediately. After the response, it POSTs the click to the API with `CLICK_LOG_SECRET`. That secret can only insert a click. It is not the database key.

Admin forms live in the website. Sign-in posts the password to the API, which returns a token. The website stores that token in an httpOnly cookie and forwards it on later writes. `ADMIN_PASSWORD` is set only on the API.

## Run it locally

Node 20.9+ and Yarn. Docker is only needed for a local database.

### Windows PowerShell

```powershell
yarn install
Copy-Item apps\web\.env.example apps\web\.env.local
Copy-Item apps\api\.env.example apps\api\.env.local
# Edit both files. For this PC set NEXT_PUBLIC_SITE_URL and REVALIDATE_URL to http://127.0.0.1:4317
yarn db:start
yarn db:reset
yarn dev
```

### macOS and Linux

```bash
yarn install
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env.local
yarn db:start
yarn db:reset
yarn dev
```

`yarn dev` starts both processes:

- Website: [http://127.0.0.1:4317](http://127.0.0.1:4317)
- API health: [http://127.0.0.1:4318/health](http://127.0.0.1:4318/health)

`yarn dev:web` and `yarn dev:api` start one of them. With no Supabase keys on the website, pages still render and every figure is an in-memory **sample**.

`CLICK_LOG_SECRET` and `REVALIDATE_SECRET` must match in the two env files. Leave `INGEST_CRON` empty locally so the API does not scan the chains on boot.

### Local Supabase

```bash
yarn db:start
yarn db:reset
```

`supabase/config.toml` turns off auth, storage, realtime and studio. You need Postgres, PostgREST and Kong.

CLI 3's `supabase status` does not print API keys. The local demo JWTs in the env examples work against that stack. On a hosted project, copy the anon key into `apps/web` and the service-role key into `apps/api` from **Project Settings → API**.

### Hosted Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Run `supabase/migrations/` (SQL editor, or `supabase link` then `supabase db push`).
3. Optionally run `supabase/seed.sql`. Every seed row is `source = 'sample'` and is hidden once a real payout exists.
4. Put the project URL and anon key in `apps/web/.env.local`, and the URL plus service-role key in `apps/api/.env.local`.

## Environment

Website (`apps/web/.env.example`): `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `BACKEND_URL`, `CLICK_LOG_SECRET`, `REVALIDATE_SECRET`, the referral vars, contact email.

API (`apps/api/.env.example`): `PORT`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD`, `CLICK_LOG_SECRET`, `REVALIDATE_URL`, `REVALIDATE_SECRET`, `INGEST_CRON`, `CRON_SECRET`, `REFERRAL_WEBHOOK_URL`, `BASE_RPC_URL`, `ARBITRUM_RPC_URL`.

`NEXT_PUBLIC_SITE_URL` defaults to `https://vestpayouts.com` when unset. No trailing slash.

## Add payouts

### 1. Ingest from the chain

Vest sends withdrawals as USDC from a payout contract on Base (`0x55133c825603e6a5b9e911abab23e75dc3bb07af`) and Arbitrum One (`0xb2f86eae1197032fa85389cc6c0f3b06b58dd1ea`). The API reads those events, upserts on `(chain, tx hash, log index)`, and stores its cursor in `ingest_state`.

```bash
yarn ingest
yarn ingest -- --chain base
yarn ingest -- --since 2026-07-01
```

The extra `--` lets Yarn forward the flags. On a long-running API, set `INGEST_CRON` (for example `17 * * * *`) or call `POST /internal/ingest` with `Authorization: Bearer $CRON_SECRET`. `.github/workflows/ingest.yml` runs the CLI hourly when the repository secrets are set.

A row proves Vest's contract sent that much USDC to that wallet. It does not, by itself, prove the money was funded-account profit, because ordinary exchange withdrawals leave through the same contract. That limit is written up at `/methodology`.

Free Base RPCs refuse archive history. A full backfill needs `BASE_RPC_URL`.

### 2. Admin

Set `ADMIN_PASSWORD` on the API and open `/admin` on the website. You can add one payout, import a CSV, attach a display name to a wallet, and delete sample rows. The page is `noindex`.

### 3. CSV

```bash
yarn payouts:import -- data/payouts.example.csv --dry-run
yarn payouts:import -- data/payouts.example.csv
```

Columns: `paid_at,amount_usd,chain,tx_hash,wallet,trader,proof_url,note`. Only `paid_at` and `amount_usd` are required. A row whose `tx_hash` matches an ingested payout adds the trader name and proof link to that payout instead of inserting a duplicate.

## How the database is locked down

`supabase/migrations/20261106000000_init_payouts.sql`:

- `payouts`, `wallets` (display names), `ingest_state`, `referral_clicks`.
- RLS is on for every table. `anon` may select published payouts, wallet names and ingest status. There are no write policies.
- `anon` and `authenticated` are also revoked from insert, update and delete. Writes go through the API's service role.
- `referral_clicks` has no policies at all, so only the service role can read or write it.
- The `visible_payouts` view hides `source = 'sample'` rows as soon as any real published payout exists. Sample rows are labelled in the UI either way.

Aggregates (`payout_summary`, `payout_daily`, `payout_leaderboard`, `payout_search_totals`) run in Postgres so pages don't pull the whole table.

Regenerate `supabase/seed.sql` after editing `packages/shared/src/sample-data.ts`:

```bash
yarn db:seed-sql
```

Regenerate TypeScript types after a migration, against a running local stack:

```bash
yarn db:types
```

## Deploy the website (Vercel)

1. Import the repository. Framework preset is Next.js. Set the root directory to `apps/web`. Vercel installs the Yarn workspace from the repository root, which is what `@vestpayouts/shared` needs.
2. Add the website env vars. `NEXT_PUBLIC_SITE_URL` is `https://vestpayouts.com`. `BACKEND_URL` is the public API origin. Do not add `SUPABASE_SERVICE_ROLE_KEY` or `ADMIN_PASSWORD`.
3. Deploy. Lists revalidate about hourly. Individual payout pages revalidate about daily. `POST /api/revalidate` with `Authorization: Bearer $REVALIDATE_SECRET` expires the cache immediately.
4. In Search Console, submit `https://vestpayouts.com/sitemap.xml`.

## Deploy the API (Railway, Fly, Render)

The root `Dockerfile` is the API image. Build it from the repository root:

```bash
docker build -t vestpayouts-api .
docker run --env-file apps/api/.env.local -p 4318:4318 vestpayouts-api
```

- **Railway.** New service from this repo, builder Dockerfile, Dockerfile path `Dockerfile`. Set the API env vars. Health check path `/health`. Either set `INGEST_CRON` or add a cron service that POSTs `/internal/ingest`.
- **Fly.** `fly launch` with the root Dockerfile, internal port 4318, HTTP health check `GET /health`. Set the same secrets with `fly secrets set`.
- **Render.** Web service, environment Docker, Dockerfile `./Dockerfile`. Health check path `/health`. A Render cron job can `curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://<api>/internal/ingest` instead of `INGEST_CRON`.

The API listens on `PORT` (default 4318) and `0.0.0.0`.

## Scripts

| Command | |
| --- | --- |
| `yarn dev` | Website on 4317 and API on 4318 |
| `yarn dev:web` / `yarn dev:api` | One of the two |
| `yarn build` | Typecheck the API and build the website |
| `yarn start` | Production website and API |
| `yarn lint` / `yarn typecheck` | ESLint (web) and `tsc` (both) |
| `yarn ingest` | Pull new on-chain payouts |
| `yarn payouts:import -- <file.csv>` | Import manual payouts |
| `yarn db:start` / `yarn db:reset` | Local Supabase |
| `yarn db:seed-sql` | Rewrite `supabase/seed.sql` |
| `yarn db:types` | Regenerate `packages/shared/src/database.types.ts` |

## Pages

`/` live feed and totals, `/payouts` filterable list, `/payouts/[chain]/[tx]` proof pages, `/leaderboard` (and `/24h`, `/7d`, `/30d`), `/wallets/[address]`, `/how-vest-payouts-work`, `/vest-review`, `/faq`, `/blog` plus four guides, `/methodology`, `/about`, `/disclosure`, `/privacy`, `/terms`, `/admin`.

`/sitemap.xml` and `/robots.txt` are generated. `/robots.txt` disallows `/admin`, `/go` and `/api/`.
