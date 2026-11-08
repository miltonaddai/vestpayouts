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
  let reachable = false;
  try {
    reachable = (await backendFetch("/health")).ok;
  } catch {
    reachable = false;
  }
  if (!reachable) {
    return (
      <div className="mx-auto max-w-xl px-6 py-16 md:px-14">
        <h1 className="text-[36px] leading-[0.96] font-medium tracking-[-0.035em] text-ink">Admin is unavailable</h1>
        <p className="mt-3 text-sub">Try again later.</p>
      </div>
    );
  }
  const token = await getAdminToken();
  if (!token) {
    return (
      <div className="mx-auto max-w-xl px-6 py-16 md:px-14">
        <h1 className="text-[36px] leading-[0.96] font-medium tracking-[-0.035em] text-ink">VestPayouts admin</h1>
        <p className="mt-3 mb-6 text-sub">Sign in to continue.</p>
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
      <div className="mx-auto max-w-xl px-6 py-16 md:px-14">
        <h1 className="text-[36px] leading-[0.96] font-medium tracking-[-0.035em] text-ink">VestPayouts admin</h1>
        <p className="mt-3 mb-6 text-sub">That session expired. Sign in again.</p>
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
    <div className="mx-auto max-w-3xl px-6 py-10 md:px-14">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-[36px] leading-[0.96] font-medium tracking-[-0.035em] text-ink">Payout admin</h1>
        <LogoutButton />
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        {counts.onchain.toLocaleString()} on-chain · {counts.manual.toLocaleString()} manual · {counts.sample.toLocaleString()} sample.
        Sample rows are labelled in the UI and disappear once any real payout is published.
      </p>
      {loadError && <p className="mt-4 text-sm text-coral">{loadError}</p>}

      <section className="mt-8 border border-line bg-background p-5">
        <h2 className="text-lg font-medium text-ink">Add one payout</h2>
        <p className="mt-1 mb-4 text-sm text-muted-foreground">
          If the transaction hash matches a payout already ingested from the chain, the name and proof link are attached to that row instead of creating a duplicate.
        </p>
        <AddPayoutForm />
      </section>

      <section className="mt-6 border border-line bg-background p-5">
        <h2 className="text-lg font-medium text-ink">Import CSV</h2>
        <p className="mt-1 mb-4 text-sm text-muted-foreground">
          Header: <code className="text-green">paid_at,amount_usd,chain,tx_hash,wallet,trader,proof_url,note</code>. Only the first two columns are required. Lines starting with # are ignored.
        </p>
        <ImportForm />
      </section>

      <section className="mt-6 border border-line bg-background p-5">
        <h2 className="text-lg font-medium text-ink">Name a wallet</h2>
        <div className="mt-4">
          <AliasForm />
        </div>
      </section>

      <section className="mt-6">
        <h2 className="mb-3 text-lg font-medium text-ink">Latest rows</h2>
        <div className="overflow-x-auto border border-line">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line text-xs tracking-wide text-muted-foreground uppercase">
              <tr>
                <th className="px-3 py-2 font-medium">Amount</th>
                <th className="px-3 py-2 font-medium">Who</th>
                <th className="px-3 py-2 font-medium">Source</th>
                <th className="px-3 py-2 font-medium">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {recent.map((r) => (
                <tr key={r.id}>
                  <td className="px-3 py-2 font-mono text-green">{formatUsd(Number(r.amount_usd), true)}</td>
                  <td className="px-3 py-2 font-mono text-ink">{r.trader_name || shortAddress(r.wallet)}</td>
                  <td className="px-3 py-2 text-sub">{r.source}</td>
                  <td className="px-3 py-2 text-sub">{formatDate(Date.parse(r.paid_at), true)}</td>
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

      <section className="mt-6 border border-amber/30 bg-amber/5 p-5">
        <h2 className="text-lg font-medium text-ink">Sample data</h2>
        <p className="mt-1 mb-4 text-sm text-muted-foreground">
          Sample rows are placeholders. They hide automatically when a real payout exists, and you can delete them outright.
        </p>
        <DeleteSamplesButton />
      </section>
    </div>
  );
}
