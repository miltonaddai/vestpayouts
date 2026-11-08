import Link from "next/link";
import { Suspense } from "react";
import { ExploreCards } from "@/components/home/explore-cards";
import { HeroTotal } from "@/components/payouts/hero-total";
import { DailyChart } from "@/components/payouts/daily-chart";
import { HomePayoutTabs } from "@/components/payouts/home-payout-tabs";
import { SampleDataBanner } from "@/components/payouts/sample-banner";
import { LiveSummaryProvider } from "@/components/payouts/live-summary";
import { TapeTicker } from "@/components/payouts/tape-ticker";
import { VestHeroHeading } from "@/components/brand/vest-hero-icon";
import { ReferralButton, ReferralCodeHint, ReferralPanel } from "@/components/referral/referral-cta";
import { ArrowLink } from "@/components/ui/split-cta";
import { JsonLd } from "@/components/seo/json-ld";
import { POST_META as BLOG_POSTS } from "@/content/blog/posts";
import { PAYOUT_FAQS } from "@/lib/content/faqs";
import { SPLITS } from "@/lib/content/vest-facts";
import { formatDate } from "@/lib/format";
import { CHAINS } from "@/lib/payouts/chains";
import { getDailySeries, getLargest, getLatest, getLeaderboard, getSummary } from "@/lib/payouts/repository";
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
  const [summary, ticker, series, largest24h, largest7d, largest30d, top3] = await Promise.all([
    getSummary(),
    getLatest(20),
    getDailySeries(90),
    getLargest(10, "24h"),
    getLargest(10, "7d"),
    getLargest(10, "30d"),
    getLeaderboard("all", 3),
  ]);
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

      {/* Hero and /paid figures roll to new values as payouts come in. */}
      <LiveSummaryProvider initial={summary}>
      <section className="relative">
        <div className="pointer-events-none absolute inset-0 z-0 hidden grid-cols-12 md:grid" aria-hidden="true" data-no-reveal>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className={i === 0 ? "" : "border-l border-dashed border-line"} />
          ))}
        </div>
        <div className="relative z-10 px-6 py-10 md:px-14 md:py-20" data-reveal-children>
          <div className="meta mb-8">§ 00 — Payout specification</div>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,3fr)_minmax(16rem,1fr)] lg:gap-16" data-reveal-children>
            <h1 className="m-0 max-w-full text-[clamp(1.875rem,9.2vw,2.75rem)] leading-[0.94] font-medium tracking-[-0.04em] text-ink md:text-[80px] lg:text-[96px]">
              <VestHeroHeading>Vest payouts,</VestHeroHeading>
              <br />
              tracked live
              <span className="mt-3 block text-[clamp(1.125rem,4.8vw,1.375rem)] tracking-[-0.03em] md:text-[40px] lg:text-[48px]">
                on-chain, with proof
              </span>
            </h1>
            <div className="border-l border-line pl-6">
              <div className="meta">Abstract</div>
              <p className="mt-3 text-[15px] leading-[1.6] text-ink">
                Every USDC payout Vest sends to traders, read straight from its
                public payout contracts. Real amounts, real wallets, real transaction hashes. No screenshots required.
              </p>
              <div className="mt-6 flex flex-col items-stretch gap-3">
                <ReferralButton placement="hero" label="Get funded on Vest" />
                <ArrowLink href="/payouts">Browse payout proof</ArrowLink>
              </div>
              <ReferralCodeHint className="mt-3" />
              <p className="mt-3 text-[13px] text-sub">
                Instant accounts from $10 · up to {SPLITS.instant}% profit split · paid in USDC. Referral link.
              </p>
            </div>
          </div>
          <HeroTotal
            since={summary.isSample ? null : since}
            chains={summary.byChain.map((c) => ({ id: c.chain, name: CHAINS[c.chain].name }))}
          />
        </div>
      </section>

      <div className="border-t border-line">
        <TapeTicker payouts={ticker} />
      </div>

      <section aria-labelledby="explore-title" className="border-b border-line px-6 py-12 md:px-14 md:py-16">
        <div className="mb-8">
          <div className="meta mb-3">§ 01 — Explore</div>
          <h2 id="explore-title" className="text-[36px] leading-none font-medium tracking-[-0.03em] text-ink md:text-[56px]">
            /explore
          </h2>
        </div>
        <ExploreCards
          top={top3}
          wallets={summary.windows.all.wallets}
          proof={[...largest24h, ...ticker].find((p) => p.source === "onchain" && p.chain && p.txHash) ?? null}
        />
      </section>
      </LiveSummaryProvider>

      <section className="border-b border-line px-6 py-12 md:px-14 md:py-16">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="meta mb-3">§ 02 — Activity</div>
            <h2 className="text-[36px] leading-none font-medium tracking-[-0.03em] text-ink md:text-[56px]">/latest</h2>
          </div>
          <ArrowLink href="/payouts">See every Vest payout</ArrowLink>
        </div>
        <DailyChart series={series} title="Vest payouts per day" />
        <div className="mt-6">
          <Suspense fallback={<div className="min-h-64 border border-line bg-background" />}>
            <HomePayoutTabs
              initial={{
                realtime: ticker.slice(0, 10),
                "24h": largest24h,
                "7d": largest7d,
                "30d": largest30d,
              }}
            />
          </Suspense>
        </div>
      </section>

      <section aria-labelledby="how-title" className="border-b border-line px-6 py-12 md:px-14 md:py-16">
        <div className="meta mb-3">§ 03 — Process</div>
        <h2 id="how-title" className="text-[36px] leading-none font-medium tracking-[-0.03em] text-ink md:text-[56px]">
          /how
        </h2>
        <p className="mt-3 max-w-2xl text-[15px] leading-[1.6] text-sub">How Vest payouts work, in three steps.</p>
        <ol className="mt-8 grid border border-line md:grid-cols-3">
          {[
            {
              n: "01",
              title: "Trade a funded account",
              body: `Buy an Instant Account (live immediately, ${SPLITS.instant}% split) or pass an evaluation (${SPLITS.evalBase}–${SPLITS.evalUpgrade}% split).`,
            },
            {
              n: "02",
              title: "Claim profit",
              body: "Submit a Claim Profit request. Vest credits your split to your Primary Account within 24 hours. No cap on frequency or size.",
            },
            {
              n: "03",
              title: "Withdraw USDC",
              body: "Withdraw to any wallet on Base or Arbitrum One. That transfer is the on-chain payout you see on VestPayouts.",
            },
          ].map((s) => (
            <li key={s.n} className="border-b border-line px-5 py-6 last:border-b-0 md:border-r md:border-b-0 md:last:border-r-0">
              <p className="meta text-signal">{s.n}</p>
              <h3 className="mt-3 text-xl font-medium tracking-[-0.02em] text-ink">{s.title}</h3>
              <p className="mt-2 text-[15px] leading-[1.6] text-sub">{s.body}</p>
            </li>
          ))}
        </ol>
        <ArrowLink href="/how-vest-payouts-work" className="mt-6">Read the full guide to Vest payouts</ArrowLink>
      </section>

      <section aria-labelledby="proof-title" className="border-b border-line px-6 py-12 md:px-14 md:py-16">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <div className="meta mb-3">§ 04 — Proof</div>
            <h2 id="proof-title" className="text-[36px] leading-none font-medium tracking-[-0.03em] text-ink md:text-[56px]">
              /verify
            </h2>
            <p className="mt-4 text-[15px] leading-[1.6] text-sub">
              Vest payout proof you can check yourself. Screenshots can be faked. Blockchain transfers can&apos;t. Every
              Vest payout leaves a public USDC transfer from Vest&apos;s payout contract to the trader&apos;s wallet.
              VestPayouts indexes those transfers and links each one to its block explorer page.
            </p>
            <ArrowLink href="/blog/vest-payout-proof" className="mt-5">How to verify a Vest payout</ArrowLink>
          </div>
          <dl className="border border-line">
            {Object.values(CHAINS).map((c) => (
              <div key={c.id} className="border-b border-line px-5 py-4 last:border-b-0">
                <dt className="meta text-ink">{c.name} payout contract</dt>
                <dd className="mt-2 font-mono text-[14px] break-all text-sub">
                  <a href={`${c.explorer}/address/${c.payoutContract}`} target="_blank" rel="noopener nofollow" className="hover:text-ink">
                    {c.payoutContract}
                  </a>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <div className="px-6 py-12 md:px-14 md:py-16">
        <ReferralPanel placement="stats" />
      </div>

      <section aria-labelledby="faq-title" className="border-t border-line px-6 py-12 md:px-14 md:py-16">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <div className="meta mb-3">§ 05 — Questions</div>
            <h2 id="faq-title" className="text-[36px] leading-none font-medium tracking-[-0.03em] text-ink md:text-[48px]">
              /faq
            </h2>
            <dl className="mt-6 divide-y divide-line border border-line">
              {PAYOUT_FAQS.slice(0, 4).map((f) => (
                <div key={f.q} className="px-5 py-5">
                  <dt className="font-medium text-ink">{f.q}</dt>
                  <dd className="mt-1.5 text-[15px] leading-[1.6] text-sub">{f.a}</dd>
                </div>
              ))}
            </dl>
            <ArrowLink href="/faq" className="mt-6">All FAQs</ArrowLink>
          </div>
          <div>
            <div className="meta mb-3">§ 06 — Writing</div>
            <h2 className="text-[36px] leading-none font-medium tracking-[-0.03em] text-ink md:text-[48px]">/guides</h2>
            <ul className="mt-6 border border-line">
              {[{ slug: "", href: "/vest-review", title: "Vest review: is Vest Capital legit?", description: "Rules, pricing, payout speed and the fine print." }, ...BLOG_POSTS.map((p) => ({ ...p, href: `/blog/${p.slug}` }))].map((p) => (
                <li key={p.href} className="border-b border-line last:border-b-0">
                  <Link href={p.href} className="block px-5 py-4 hover:bg-paper">
                    <span className="font-medium text-ink">{p.title}</span>
                    <span className="mt-1 block text-sm text-sub">{p.description}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
