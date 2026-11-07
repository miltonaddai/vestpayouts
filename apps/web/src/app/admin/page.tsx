import type { Metadata } from "next";
import { getAdminToken } from "@/lib/admin-auth";
import { backendFetch } from "@/lib/backend";
import { formatDate, formatUsd, shortAddress } from "@/lib/format";
import { AddPayoutForm, AliasForm, DeleteSamplesButton, ImportForm, LoginForm, LogoutButton } from "./admin-forms";

interface Overview {
  counts: { onchain: number; manual: number; sample: number };
  recent: { id: number; source: string; amount_usd: number; paid_at: string; wallet: string | null; trader_name: string | null }[];
}

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  let health: { admin?: boolean } | null = null;
  try {
    const res = await backendFetch("/health");
    if (res.ok) health = (await res.json()) as { admin?: boolean };
  } catch {
    health = null;
  }
  if (!health) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <h1 className="text-3xl font-bold text-paper">API is not running</h1>
        <p className="mt-3 text-paper/75">
          Admin writes go through the API. Start it with <code className="text-mint">yarn dev:api</code> (or <code className="text-mint">yarn dev</code> for both) and reload.
        </p>
      </div>
    );
  }
  if (!health.admin) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <h1 className="text-3xl font-bold text-paper">Admin is locked</h1>
        <p className="mt-3 text-paper/75">
          Set <code className="text-mint">ADMIN_PASSWORD</code> on the API (<code className="text-mint">apps/api/.env.local</code>), restart it, and reload. The website does not store that password or the Supabase service-role key.
        </p>
      </div>
    );
  }
  const token = await getAdminToken();
  if (!token) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <h1 className="text-3xl font-bold text-paper">VestPayouts admin</h1>
        <p className="mt-3 mb-6 text-paper/70">Add payouts, import a CSV, or name a wallet. This page is not indexed.</p>
        <LoginForm />
      </div>
    );
  }

  let recent: Overview["recent"] = [];
  let counts = { onchain: 0, manual: 0, sample: 0 };
  let loadError: string | null = null;
  const overview = await backendFetch("/admin/overview", { token });
  if (overview.status === 401) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <h1 className="text-3xl font-bold text-paper">VestPayouts admin</h1>
        <p className="mt-3 mb-6 text-paper/70">That session expired. Sign in again.</p>
        <LoginForm />
      </div>
    );
  }
  if (!overview.ok) loadError = `Could not load rows (HTTP ${overview.status}).`;
  else {
    const body = (await overview.json()) as Overview;
    recent = body.recent;
    counts = body.counts;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-paper">Payout admin</h1>
        <LogoutButton />
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        {counts.onchain.toLocaleString()} on-chain · {counts.manual.toLocaleString()} manual · {counts.sample.toLocaleString()} sample.
        Sample rows are labelled in the UI and disappear once any real payout is published.
      </p>
      {loadError && <p className="mt-4 text-sm text-coral">{loadError}</p>}

      <section className="mt-8 rounded-2xl border border-ink-800 bg-ink-900/60 p-5">
        <h2 className="text-lg font-semibold text-paper">Add one payout</h2>
        <p className="mt-1 mb-4 text-sm text-muted-foreground">
          If the transaction hash matches a payout already ingested from the chain, the name and proof link are attached to that row instead of creating a duplicate.
        </p>
        <AddPayoutForm />
      </section>

      <section className="mt-6 rounded-2xl border border-ink-800 bg-ink-900/60 p-5">
        <h2 className="text-lg font-semibold text-paper">Import CSV</h2>
        <p className="mt-1 mb-4 text-sm text-muted-foreground">
          Header: <code className="text-mint-300">paid_at,amount_usd,chain,tx_hash,wallet,trader,proof_url,note</code>. Only the first two columns are required. Lines starting with # are ignored.
        </p>
        <ImportForm />
      </section>

      <section className="mt-6 rounded-2xl border border-ink-800 bg-ink-900/60 p-5">
        <h2 className="text-lg font-semibold text-paper">Name a wallet</h2>
        <div className="mt-4">
          <AliasForm />
        </div>
      </section>

      <section className="mt-6">
        <h2 className="mb-3 text-lg font-semibold text-paper">Latest rows</h2>
        <div className="overflow-x-auto rounded-2xl border border-ink-800">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink-800 text-xs tracking-wide text-muted-foreground uppercase">
              <tr>
                <th className="px-3 py-2 font-medium">Amount</th>
                <th className="px-3 py-2 font-medium">Who</th>
                <th className="px-3 py-2 font-medium">Source</th>
                <th className="px-3 py-2 font-medium">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-800">
              {recent.map((r) => (
                <tr key={r.id}>
                  <td className="px-3 py-2 font-mono text-mint">{formatUsd(Number(r.amount_usd), true)}</td>
                  <td className="px-3 py-2 font-mono text-paper/80">{r.trader_name || shortAddress(r.wallet)}</td>
                  <td className="px-3 py-2 text-paper/70">{r.source}</td>
                  <td className="px-3 py-2 text-paper/70">{formatDate(Date.parse(r.paid_at), true)}</td>
                </tr>
              ))}
              {recent.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">
                    No rows yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-amber/30 bg-amber/5 p-5">
        <h2 className="text-lg font-semibold text-paper">Sample data</h2>
        <p className="mt-1 mb-4 text-sm text-muted-foreground">
          Sample rows are placeholders. They hide automatically when a real payout exists, and you can delete them outright.
        </p>
        <DeleteSamplesButton />
      </section>
    </div>
  );
}
