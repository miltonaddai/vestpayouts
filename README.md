# VestPayouts

Independent tracker of [Vest](https://www.vestmarkets.com/) payouts. Every USDC transfer Vest's payout contracts send on Base and Arbitrum is listed with its transaction, plus totals, a leaderboard and guides. The site exists to rank for "Vest payouts", "Vest payout proof" and "Vest review", and to send traders to Vest through one referral link.

VestPayouts is independent. It is not affiliated with or endorsed by Vest. See [BRAND.md](BRAND.md) for the name, mark, colors and the disclaimers. The public site is [https://vestpayouts.com](https://vestpayouts.com).

## Architecture

Yarn workspaces. The website never holds the Supabase secret key.

```
apps/web            Next.js. Pages, UI, SEO, public reads (publishable key + RLS).
apps/api            Hono service. Ingest, CSV import, admin writes, click log, cron.
packages/shared     Chain constants, payout types, CSV schema, Supabase types, sample rows.
supabase/           Migrations and the sample seed. Used by both apps.
```

Public pages read Postgres through the publishable key (or the legacy anon key). Row level security allows that read and refuses every write. The API uses the secret key (or the legacy service-role key) for inserts and updates, then calls `POST /api/revalidate` on the website so cached pages refresh.

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

`yarn dev:web` and `yarn dev:api` start one of them. With no Supabase keys on the website, pages read real on-chain rows from `data/onchain-store.json` after you run `yarn ingest`. If that file is missing, every figure is an in-memory **sample**. The website never calls Alchemy; ingest runs only in `apps/api`.

`CLICK_LOG_SECRET` and `REVALIDATE_SECRET` must match in the two env files. Recommended ingest cadence is every 10 minutes (`INGEST_CRON=*/10 * * * *`). Leave `INGEST_CRON` empty if you do not want `yarn dev` to scan the chains on its own.

### Local Supabase

```bash
yarn db:start
yarn db:reset
```

`supabase/config.toml` turns off auth, storage, realtime and studio. You need Postgres, PostgREST and Kong.

CLI 3's `supabase status` does not print API keys. The local demo JWTs in the env examples still work against that stack as `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`. On a hosted project, copy the publishable key (`sb_publishable_...`) into `apps/web` and the secret key (`sb_secret_...`) into `apps/api` from **Project Settings → API Keys**. The legacy anon and service-role names are accepted as fallbacks.

### Hosted Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Run `supabase/migrations/` (SQL editor, or `supabase link` then `supabase db push`).
3. Optionally run `supabase/seed.sql`. Every seed row is `source = 'sample'` and is hidden once a real payout exists.
4. If public pages time out after importing a large local store, run `supabase/migrations/20261107203851_precomputed_payout_stats.sql` in the SQL Editor (idempotent; safe to re-run). Ingest and import then refresh cached totals.
5. Put the project URL and publishable key in `apps/web/.env.local` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`), and the URL plus secret key in `apps/api/.env.local` (`SUPABASE_URL`, `SUPABASE_SECRET_KEY`). `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` still work if you already use them.

## Environment

Website (`apps/web/.env.example`): `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (legacy fallback: `NEXT_PUBLIC_SUPABASE_ANON_KEY`), `BACKEND_URL`, `CLICK_LOG_SECRET`, `REVALIDATE_SECRET`, the referral vars, contact email.

API (`apps/api/.env.example`): `PORT`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY` (legacy fallback: `SUPABASE_SERVICE_ROLE_KEY`), `ADMIN_PASSWORD`, `CLICK_LOG_SECRET`, `REVALIDATE_URL`, `REVALIDATE_SECRET`, `INGEST_CRON`, `CRON_SECRET`, `REFERRAL_WEBHOOK_URL`, `ALCHEMY_API_KEY`, `BASE_RPC_URL`, `ARBITRUM_RPC_URL`, `INGEST_METHOD`, `INGEST_MAX_REQUESTS`, `INGEST_STORE`. Never put `ALCHEMY_API_KEY` or `SUPABASE_SECRET_KEY` on the website or prefix them with `NEXT_PUBLIC_`.

`NEXT_PUBLIC_SITE_URL` defaults to `https://vestpayouts.com` when unset. No trailing slash.

## Add payouts

### 1. Ingest from the chain

Vest sends withdrawals as USDC from a payout contract on Base (`0x55133c825603e6a5b9e911abab23e75dc3bb07af`) and Arbitrum One (`0xb2f86eae1197032fa85389cc6c0f3b06b58dd1ea`). The API reads those transfers, upserts on `(chain, tx hash, log index)`, and stores a per-chain cursor (`ingest_state` in Supabase, or inside `data/onchain-store.json` when `INGEST_STORE=local`).

Set `ALCHEMY_API_KEY` on the API (never on the website). Ingest then uses `https://base-mainnet.g.alchemy.com/v2/<key>` and `https://arb-mainnet.g.alchemy.com/v2/<key>`, unless `BASE_RPC_URL` / `ARBITRUM_RPC_URL` override them.

On Alchemy's free tier, `eth_getLogs` is limited to a 10-block range on Base and Arbitrum, so a getLogs backfill would cost tens of millions of compute units. The default method is therefore `alchemy_getAssetTransfers` (120 CU per page, up to 1000 USDC transfers plus timestamps). `eth_getLogs` remains available as `--method logs` with a 10-block starting chunk, adaptive halving, 429 retries, and a hard per-run request cap (`INGEST_MAX_REQUESTS`, default 300). Each run logs request counts and estimated CU. After the first sync, later runs only request blocks newer than the cursor.

The transfers path records `requested_at` as null (that field lives on Vest's custom withdrawal event, which would take extra receipts or a getLogs scan to decode). Amounts and recipients come from the USDC transfer itself.

```bash
yarn ingest
yarn ingest -- --chain base
yarn ingest -- --since 2026-07-01
yarn ingest -- --max-blocks 4000
yarn ingest -- --method logs
```

The extra `--` lets Yarn forward the flags. On a long-running API, set `INGEST_CRON` to `*/10 * * * *` (every 10 minutes, UTC) or call `POST /internal/ingest` with `Authorization: Bearer $CRON_SECRET`. `.github/workflows/ingest.yml` runs the CLI hourly when the repository secrets are set. Incremental Alchemy runs are typically one request per chain.

A row proves Vest's contract sent that much USDC to that wallet. It does not, by itself, prove the money was funded-account profit, because ordinary exchange withdrawals leave through the same contract. That limit is written up at `/methodology`.

Without Supabase, `yarn ingest` writes `data/onchain-store.json` (gitignored) and the website reads that file. With Supabase keys, ingest writes to Postgres as before.

### 2. Admin

Set `ADMIN_PASSWORD` on the API and open `/admin` on the website. You can add one payout, import a CSV, attach a display name to a wallet, and delete sample rows. The page is `noindex`.

### 3. CSV

```bash
yarn payouts:import -- data/payouts.example.csv --dry-run
yarn payouts:import -- data/payouts.example.csv
```

Columns: `paid_at,amount_usd,chain,tx_hash,wallet,trader,proof_url,note`. Only `paid_at` and `amount_usd` are required. A row whose `tx_hash` matches an ingested payout adds the trader name and proof link to that payout instead of inserting a duplicate.

### 4. Import the local JSON store into Supabase

If payouts were ingested into `data/onchain-store.json` before Supabase was connected:

```bash
yarn payouts:import-local
```

The command upserts payouts on `(chain, tx_hash, log_index)`, writes `ingest_state` cursors, and copies any wallet aliases into `wallets`. It does not call Alchemy. After it finishes, `yarn ingest` resumes from `last_block + 1`. Leave `INGEST_STORE` unset (or set it to `supabase`) so later ingest writes go to Postgres instead of the JSON file.

## How the database is locked down

`supabase/migrations/20261106000000_init_payouts.sql`:

- `payouts`, `wallets` (display names), `ingest_state`, `referral_clicks`.
- RLS is on for every table. `anon` may select published payouts, wallet names and ingest status. There are no write policies.
- `anon` and `authenticated` are also revoked from insert, update and delete. Writes go through the API's secret key (`service_role` role).
- `referral_clicks` has no policies at all, so only the secret key (`service_role`) can read or write it.
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

## Deploy the website (Netlify)

`apps/web/netlify.toml` holds the build settings: command `yarn workspace @vestpayouts/web build`, publish `apps/web/.next` (Netlify resolves both from the repository root), Node 22. Netlify applies its Next.js runtime automatically, and Yarn installs the whole workspace from the repository root, which is what `@vestpayouts/shared` needs. Commits that touch only the API or migrations skip the build.

1. **Add new project → Import an existing project** and pick this repository. Under **Project to deploy** choose `apps/web` and leave the base directory at the repository root. The build command and publish directory come from `netlify.toml`, which overrides the UI.
2. Under **Site configuration → Environment variables**, add the website variables from `apps/web/.env.example`:
   - `NEXT_PUBLIC_SITE_URL`: the production origin, e.g. `https://vestpayouts.com` (no trailing slash).
   - `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: the hosted Supabase project. Without them the site shows sample data.
   - `BACKEND_URL`: the Railway API's public origin, e.g. `https://vestpayouts-api.up.railway.app`.
   - `CLICK_LOG_SECRET` and `REVALIDATE_SECRET`: the same values as on the API.
   - Optional: the `NEXT_PUBLIC_VEST_REFERRAL_*`, `NEXT_PUBLIC_CONTACT_EMAIL`, `NEXT_PUBLIC_TWITTER_HANDLE` and `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` values.

   Do not add `SUPABASE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD` or `ALCHEMY_API_KEY`. `NEXT_PUBLIC_*` values are inlined at build time, so trigger a new deploy after changing them.
3. Deploy, then add the custom domain under **Domain management**.
4. On the Railway API, set `REVALIDATE_URL` to the Netlify site origin so ingest can expire cached pages.

Lists revalidate about hourly. Individual payout pages revalidate about daily. `POST /api/revalidate` with `Authorization: Bearer $REVALIDATE_SECRET` expires the cache immediately. In Search Console, submit `https://vestpayouts.com/sitemap.xml`.

## Deploy the API (Railway, Fly, Render)

The root `Dockerfile` is the API image. Build it from the repository root:

```bash
docker build -t vestpayouts-api .
docker run --env-file apps/api/.env.local -p 4318:4318 vestpayouts-api
```

- **Railway.** New service from this repo, builder Dockerfile, Dockerfile path `Dockerfile`. Set the API env vars, with `REVALIDATE_URL` pointing at the Netlify site. Health check path `/health`. Either set `INGEST_CRON` or add a cron service that POSTs `/internal/ingest`.
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
