import Link from "next/link";
import { ArrowRight, Clock3, Link2, ShieldCheck, Wallet } from "lucide-react";
import { DailyChart } from "@/components/payouts/daily-chart";
import { PayoutFeed } from "@/components/payouts/payout-feed";
import { PayoutTable } from "@/components/payouts/payout-table";
import { SampleDataBanner } from "@/components/payouts/sample-banner";
import { Stat, StatGrid } from "@/components/payouts/stat-grid";
import { TapeTicker } from "@/components/payouts/tape-ticker";
import { ReferralButton, ReferralCodeHint, ReferralPanel } from "@/components/referral/referral-cta";
import { JsonLd } from "@/components/seo/json-ld";
import { POST_META as BLOG_POSTS } from "@/content/blog/posts";
import { PAYOUT_FAQS } from "@/lib/content/faqs";
import { SPLITS } from "@/lib/content/vest-facts";
import { formatDate, formatDuration, formatInt, formatUsd, formatUsdCompact } from "@/lib/format";
import { CHAINS } from "@/lib/payouts/chains";
import { getDailySeries, getLargest, getLatest, getSummary } from "@/lib/payouts/repository";
import { datasetLd, pageMetadata } from "@/lib/seo";

export const revalidate = 3600;

export const metadata = pageMetadata({
  title: "Vest Payouts Tracker — Live Vest Payout Proof, Totals & Leaderboard",
  description:
    "Track every Vest payout live. See how much Vest has paid traders, the latest and largest Vest payouts, and on-chain payout proof on Base and Arbitrum. Independent and verifiable.",
  path: "/",
  keywords: ["Vest payouts", "Vest payout proof", "Vest Markets payouts", "Vest Capital payout", "Vest prop firm payouts"],
});

export default async function HomePage() {
  const [summary, ticker, series, largest] = await Promise.all([
    getSummary(),
    getLatest(20),
    getDailySeries(30),
    getLargest(6, "30d"),
  ]);
  const { windows } = summary;
  const latest = ticker.slice(0, 8);
  const since = summary.firstPaidAt ? formatDate(summary.firstPaidAt) : null;

  return (
    <>
      <JsonLd
        data={datasetLd({
          name: "Vest payouts (on-chain)",
          description: "Every USDC payout sent by Vest's payout contracts on Base and Arbitrum One, with amount, recipient wallet and settlement time.",
          path: "/payouts",
          dateModified: summary.syncedAt ? new Date(summary.syncedAt).toISOString() : undefined,
        })}
      />
      {summary.isSample && <SampleDataBanner />}

      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_20%_0%,rgba(62,224,161,0.14),transparent_70%)]"
        />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 pt-12 pb-14 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:pt-20">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-mint/30 bg-mint/10 px-3 py-1 text-xs font-semibold text-mint">
              <ShieldCheck className="size-3.5" aria-hidden="true" /> Verified on Base &amp; Arbitrum
            </p>
            <h1 className="mt-5 text-4xl leading-[1.05] font-bold text-paper sm:text-5xl lg:text-6xl">
              Vest payouts, <span className="text-mint">tracked live</span> on-chain.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-paper/75">
              Every USDC payout Vest sends to traders, read straight from its public payout contracts. Real amounts,
              real wallets, real transaction hashes. No screenshots required.
            </p>

            <div className="mt-8 rounded-2xl border border-ink-800 bg-ink-900/70 p-5">
              <p className="text-sm text-muted-foreground">
                {summary.isSample ? "Sample total (placeholder data)" : `Paid to traders${since ? ` since ${since}` : ""}`}
              </p>
              <p className="tabular mt-1 font-mono text-4xl font-bold text-mint sm:text-5xl">{formatUsd(windows.all.amount)}</p>
              <p className="mt-2 text-sm text-paper/70">
                {formatInt(windows.all.count)} payouts to {formatInt(windows.all.wallets)} wallets ·{" "}
                <span className="text-paper">{formatUsdCompact(windows["24h"].amount)}</span> in the last 24 hours
              </p>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <ReferralButton placement="hero" label="Get funded on Vest" />
              <Link
                href="/payouts"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-ink-700 px-5 font-semibold text-paper hover:bg-ink-800"
              >
                Browse payout proof <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
            <ReferralCodeHint className="mt-3" />
            <p className="mt-3 text-xs text-muted-foreground">
              Instant accounts from $10 · up to {SPLITS.instant}% profit split · paid in USDC. Referral link.
            </p>
          </div>
          <PayoutFeed payouts={latest} syncedAt={summary.syncedAt} />
        </div>
      </section>

      <TapeTicker payouts={ticker} />

      <section aria-labelledby="stats-title" className="mx-auto max-w-7xl px-4 pt-16 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="stats-title" className="text-2xl font-semibold text-paper sm:text-3xl">
              How much has Vest paid out?
            </h2>
            <p className="mt-2 max-w-2xl text-paper/70">
              Totals update automatically from on-chain data. Every figure links back to individual transactions you can
              check yourself.
            </p>
          </div>
          <Link href="/leaderboard" className="text-sm font-medium text-mint hover:text-mint-300">
            View the Vest payout leaderboard →
          </Link>
        </div>
        <StatGrid className="mt-8">
          <Stat label="Paid last 24h" value={formatUsd(windows["24h"].amount)} sub={`${formatInt(windows["24h"].count)} payouts`} highlight />
          <Stat label="Paid last 7 days" value={formatUsd(windows["7d"].amount)} sub={`${formatInt(windows["7d"].wallets)} wallets paid`} />
          <Stat label="Paid last 30 days" value={formatUsd(windows["30d"].amount)} sub={`${formatInt(windows["30d"].count)} payouts`} />
          <Stat
            label="Largest payout (30d)"
            value={windows["30d"].largest ? formatUsd(windows["30d"].largest.amount) : "—"}
            sub={windows["30d"].largest ? formatDate(windows["30d"].largest.paidAt) : undefined}
          />
          <Stat
            label="Median payout (30d)"
            value={summary.medianAmount30d != null ? formatUsd(summary.medianAmount30d, true) : "—"}
          />
          <Stat
            label="Median processing time"
            value={summary.medianProcessingHours != null ? formatDuration(summary.medianProcessingHours) : "—"}
            sub="Withdrawal request → USDC in wallet"
          />
          {summary.byChain.slice(0, 2).map((c) => (
            <Stat key={c.chain} label={`Paid on ${CHAINS[c.chain].name}`} value={formatUsdCompact(c.amount)} sub={`${formatInt(c.count)} payouts`} />
          ))}
          {summary.byChain.length === 0 && (
            <>
              <Stat label="Wallets paid (all time)" value={formatInt(windows.all.wallets)} />
              <Stat label="Payouts (all time)" value={formatInt(windows.all.count)} />
            </>
          )}
        </StatGrid>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 pt-10 sm:px-6 lg:grid-cols-[1fr_1.2fr]">
        <DailyChart series={series} title="Vest payouts per day, last 30 days" />
        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-lg font-semibold text-paper">Largest Vest payouts this month</h2>
            <Link href="/payouts?sort=largest&period=30d" className="text-sm text-mint hover:text-mint-300">
              All →
            </Link>
          </div>
          <PayoutTable payouts={largest} caption="Largest Vest payouts in the last 30 days" />
        </div>
      </section>

      <section aria-labelledby="how-title" className="mx-auto max-w-7xl px-4 pt-20 sm:px-6">
        <h2 id="how-title" className="text-2xl font-semibold text-paper sm:text-3xl">
          How Vest payouts work, in three steps
        </h2>
        <ol className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            {
              icon: Wallet,
              title: "1. Trade a funded account",
              body: `Buy an Instant Account (live immediately, ${SPLITS.instant}% split) or pass an evaluation (${SPLITS.evalBase}–${SPLITS.evalUpgrade}% split).`,
            },
            {
              icon: Clock3,
              title: "2. Claim profit",
              body: "Submit a Claim Profit request. Vest credits your split to your Primary Account within 24 hours. No cap on frequency or size.",
            },
            {
              icon: Link2,
              title: "3. Withdraw USDC",
              body: "Withdraw to any wallet on Base or Arbitrum One. That transfer is the on-chain payout you see on PaidTape.",
            },
          ].map((s) => (
            <li key={s.title} className="rounded-2xl border border-ink-800 bg-ink-900/60 p-6">
              <s.icon className="size-6 text-mint" aria-hidden="true" />
              <h3 className="mt-4 text-lg font-semibold text-paper">{s.title}</h3>
              <p className="mt-2 text-paper/70">{s.body}</p>
            </li>
          ))}
        </ol>
        <Link href="/how-vest-payouts-work" className="mt-6 inline-flex items-center gap-1.5 font-medium text-mint hover:text-mint-300">
          Read the full guide to Vest payouts <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </section>

      <section aria-labelledby="proof-title" className="mx-auto max-w-7xl px-4 pt-20 sm:px-6">
        <div className="grid gap-8 rounded-3xl border border-ink-800 bg-ink-900/50 p-8 lg:grid-cols-2 lg:p-10">
          <div>
            <h2 id="proof-title" className="text-2xl font-semibold text-paper sm:text-3xl">
              Vest payout proof you can check yourself
            </h2>
            <p className="mt-4 text-paper/75">
              Screenshots can be faked. Blockchain transfers can&apos;t. Every Vest payout leaves a public USDC transfer
              from Vest&apos;s payout contract to the trader&apos;s wallet. PaidTape indexes those transfers and links
              each one to its block explorer page.
            </p>
            <Link href="/blog/vest-payout-proof" className="mt-5 inline-flex items-center gap-1.5 font-medium text-mint hover:text-mint-300">
              How to verify a Vest payout <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
          <dl className="space-y-4 text-sm">
            {Object.values(CHAINS).map((c) => (
              <div key={c.id} className="rounded-xl border border-ink-800 bg-ink-950/60 p-4">
                <dt className="font-semibold text-paper">{c.name} payout contract</dt>
                <dd className="mt-1 font-mono break-all text-paper/70">
                  <a href={`${c.explorer}/address/${c.payoutContract}`} target="_blank" rel="noopener nofollow" className="hover:text-mint">
                    {c.payoutContract}
                  </a>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 pt-20 sm:px-6">
        <ReferralPanel placement="stats" />
      </div>

      <section aria-labelledby="faq-title" className="mx-auto grid max-w-7xl gap-10 px-4 pt-20 sm:px-6 lg:grid-cols-2">
        <div>
          <h2 id="faq-title" className="text-2xl font-semibold text-paper sm:text-3xl">
            Vest payout questions
          </h2>
          <dl className="mt-6 space-y-6">
            {PAYOUT_FAQS.slice(0, 4).map((f) => (
              <div key={f.q}>
                <dt className="font-semibold text-paper">{f.q}</dt>
                <dd className="mt-1.5 text-paper/70">{f.a}</dd>
              </div>
            ))}
          </dl>
          <Link href="/faq" className="mt-6 inline-flex font-medium text-mint hover:text-mint-300">
            All FAQs →
          </Link>
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-paper sm:text-3xl">Vest guides</h2>
          <ul className="mt-6 space-y-3">
            {[{ slug: "", href: "/vest-review", title: "Vest review: is Vest Capital legit?", description: "Rules, pricing, payout speed and the fine print." }, ...BLOG_POSTS.map((p) => ({ ...p, href: `/blog/${p.slug}` }))].map((p) => (
              <li key={p.href}>
                <Link href={p.href} className="block rounded-xl border border-ink-800 bg-ink-900/60 p-4 hover:border-mint/40">
                  <span className="font-semibold text-paper">{p.title}</span>
                  <span className="mt-1 block text-sm text-paper/65">{p.description}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
