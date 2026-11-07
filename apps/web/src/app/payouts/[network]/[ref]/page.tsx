import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, ExternalLink } from "lucide-react";
import { ChainBadge } from "@/components/payouts/chain-badge";
import { PayoutTable } from "@/components/payouts/payout-table";
import { Stat, StatGrid } from "@/components/payouts/stat-grid";
import { ReferralPanel } from "@/components/referral/referral-cta";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { formatDate, formatDuration, formatUsd, shortAddress } from "@/lib/format";
import { addressUrl, CHAINS, txUrl } from "@/lib/payouts/chains";
import {
  getIndexablePayouts,
  getPayoutsAtRoute,
  getPercentile,
  getWallet,
  INDEXABLE_MIN_USD,
} from "@/lib/payouts/repository";
import { payoutRoute } from "@/lib/payouts/routes";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 86400;
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const top = await getIndexablePayouts(200);
    return top
      .filter((p) => p.source === "onchain" && p.chain && p.txHash)
      .map((p) => ({ network: p.chain as string, ref: p.txHash as string }));
  } catch {
    return [];
  }
}

async function load(params: Promise<{ network: string; ref: string }>) {
  const { network, ref } = await params;
  const rows = await getPayoutsAtRoute(network, ref);
  if (!rows) notFound();
  return { network, ref, rows, main: rows.reduce((m, p) => (p.amount > m.amount ? p : m), rows[0]) };
}

function describe(p: Awaited<ReturnType<typeof load>>["main"]) {
  const where = p.chain ? CHAINS[p.chain].name : "Vest";
  const who = p.walletLabel ?? p.trader ?? (p.wallet ? shortAddress(p.wallet) : "a trader");
  return { where, who };
}

export async function generateMetadata({ params }: { params: Promise<{ network: string; ref: string }> }): Promise<Metadata> {
  const { main, rows } = await load(params);
  const { where, who } = describe(main);
  const total = rows.reduce((s, p) => s + p.amount, 0);
  const sample = main.source === "sample";
  return pageMetadata({
    title: `${sample ? "[Sample] " : ""}${formatUsd(total, true)} Vest payout on ${where} — ${formatDate(main.paidAt)}`,
    description: sample
      ? "Sample placeholder payout used before real Vest payout data is loaded. Not a real payout."
      : `Vest paid ${formatUsd(total, true)} in USDC to ${who} on ${formatDate(main.paidAt)}. View the on-chain payout proof, processing time and this wallet's other Vest payouts.`,
    path: payoutRoute(main),
    noindex: sample || total < INDEXABLE_MIN_USD,
  });
}

export default async function PayoutPage({ params }: { params: Promise<{ network: string; ref: string }> }) {
  const { rows, main } = await load(params);
  const total = rows.reduce((s, p) => s + p.amount, 0);
  const { where } = describe(main);
  const [percentile, wallet] = await Promise.all([
    getPercentile(main.amount),
    main.wallet ? getWallet(main.wallet) : Promise.resolve(null),
  ]);
  const processing = main.requestedAt ? (main.paidAt - main.requestedAt) / 3_600_000 : null;
  const others = wallet?.payouts.filter((p) => p.txHash !== main.txHash).slice(0, 10) ?? [];
  const isSample = main.source === "sample";

  return (
    <div className="mx-auto max-w-5xl px-6 pt-8 md:px-14">
      <Breadcrumbs
        items={[
          { name: "Vest payouts", path: "/payouts" },
          { name: `${formatUsd(total, true)} on ${where}`, path: payoutRoute(main) },
        ]}
      />
      {isSample && (
        <p role="status" className="mt-6 border border-amber/40 bg-amber/10 px-4 py-3 text-sm text-amber">
          <strong>Sample data.</strong> This is a placeholder used before real payouts are loaded. It is not a real
          Vest payout.
        </p>
      )}
      <header className="mt-6">
        <div className="flex flex-wrap items-center gap-2">
          <ChainBadge payout={main} />
          {main.source === "onchain" && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-green">
              <CheckCircle2 className="size-3.5" aria-hidden="true" /> Verified on-chain
            </span>
          )}
          {main.source === "manual" && <span className="text-xs text-amber">Reported payout, not yet matched on-chain</span>}
        </div>
        <h1 className="mt-3 max-w-full text-[clamp(1.75rem,8vw,2.25rem)] leading-[0.96] font-medium tracking-[-0.035em] text-ink md:text-[56px]">
          <span className="tabular font-mono text-green">{formatUsd(total, true)}</span> Vest payout
        </h1>
        <p className="mt-3 text-lg text-sub">
          Paid in USDC on {where} on {formatDate(main.paidAt, true)}
          {rows.length > 1 ? `, split across ${rows.length} transfers in one transaction` : ""}.
        </p>
      </header>

      <StatGrid className="mt-8">
        <Stat label="Amount" value={formatUsd(total, true)} highlight />
        <Stat label="Bigger than" value={`${percentile.toFixed(0)}%`} sub="of all tracked Vest payouts" />
        <Stat label="Processing time" value={processing != null ? formatDuration(processing) : "—"} sub="Request → USDC in wallet" />
        <Stat label="Wallet total" value={wallet ? formatUsd(wallet.amount) : "—"} sub={wallet ? `${wallet.count} Vest payouts` : undefined} />
      </StatGrid>

      <section aria-labelledby="proof" className="mt-10 border border-line bg-background p-6">
        <h2 id="proof" className="text-xl font-medium tracking-[-0.02em] text-ink">
          Payout proof
        </h2>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-[10rem_1fr]">
          {main.wallet && (
            <>
              <dt className="text-muted-foreground">Recipient wallet</dt>
              <dd className="font-mono break-all">
                <Link href={`/wallets/${main.wallet}`} className="text-ink hover:text-ink">
                  {main.walletLabel ? `${main.walletLabel} · ` : ""}
                  {main.wallet}
                </Link>
              </dd>
            </>
          )}
          {main.trader && !main.wallet && (
            <>
              <dt className="text-muted-foreground">Trader</dt>
              <dd className="text-ink">{main.trader}</dd>
            </>
          )}
          {main.txHash && main.chain && (
            <>
              <dt className="text-muted-foreground">Transaction</dt>
              <dd className="font-mono break-all">
                <a href={txUrl(main.chain, main.txHash)} target="_blank" rel="noopener nofollow" className="inline-flex items-center gap-1 text-ink hover:text-ink">
                  {main.txHash} <ExternalLink className="size-3.5 shrink-0" aria-hidden="true" />
                </a>
              </dd>
              <dt className="text-muted-foreground">Sent from</dt>
              <dd className="font-mono break-all">
                <a href={addressUrl(main.chain, CHAINS[main.chain].payoutContract)} target="_blank" rel="noopener nofollow" className="text-ink hover:text-ink">
                  Vest payout contract · {CHAINS[main.chain].payoutContract}
                </a>
              </dd>
            </>
          )}
          {main.block && (
            <>
              <dt className="text-muted-foreground">Block</dt>
              <dd className="font-mono text-ink">{main.block.toLocaleString()}</dd>
            </>
          )}
          {main.requestedAt && (
            <>
              <dt className="text-muted-foreground">Requested</dt>
              <dd className="text-ink">{formatDate(main.requestedAt, true)}</dd>
            </>
          )}
          <dt className="text-muted-foreground">Settled</dt>
          <dd className="text-ink">{formatDate(main.paidAt, true)}</dd>
          {main.proofUrl && (
            <>
              <dt className="text-muted-foreground">Public post</dt>
              <dd>
                <a href={main.proofUrl} target="_blank" rel="noopener nofollow" className="text-green underline underline-offset-4">
                  {main.proofUrl}
                </a>
              </dd>
            </>
          )}
          {main.note && (
            <>
              <dt className="text-muted-foreground">Note</dt>
              <dd className="text-ink">{main.note}</dd>
            </>
          )}
        </dl>
        {main.chain && main.txHash && (
          <p className="mt-5 text-sm text-sub">
            To verify: open the transaction on {CHAINS[main.chain].explorerName} and check that USDC moved from Vest&apos;s
            payout contract to the wallet above. <Link href="/blog/vest-payout-proof" className="text-green underline underline-offset-4">Step-by-step guide</Link>.
          </p>
        )}
      </section>

      {others.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-xl font-medium tracking-[-0.02em] text-ink">Other Vest payouts to this wallet</h2>
          <PayoutTable payouts={others} caption="Other Vest payouts to the same wallet" showWallet={false} />
        </section>
      )}

      <div className="mt-12">
        <ReferralPanel placement="payout-detail" title="Get paid by Vest yourself" />
      </div>
    </div>
  );
}
