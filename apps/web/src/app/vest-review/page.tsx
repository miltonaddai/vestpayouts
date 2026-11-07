import Link from "next/link";
import { LiveStatsCallout } from "@/components/content/live-stats-callout";
import { ReferralPanel } from "@/components/referral/referral-cta";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { EVAL_TIERS, INSTANT_ACCOUNTS, SPLITS, VEST_FACTS_CHECKED, VEST_SOURCES } from "@/lib/content/vest-facts";
import { formatUsd } from "@/lib/format";
import { articleLd, pageMetadata } from "@/lib/seo";

export const revalidate = 3600;

const TITLE = "Vest Review (2026): Payouts, Rules, Pricing and Who It's For";
const DESCRIPTION =
  "An independent Vest review focused on payouts. How Vest Capital pays, what the rules actually cost you, Instant vs evaluation accounts, and what the on-chain record shows.";

export const metadata = pageMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/vest-review",
  type: "article",
  publishedTime: "2026-11-05",
  modifiedTime: VEST_FACTS_CHECKED,
  keywords: ["Vest review", "Vest Markets review", "Vest Capital review", "is Vest legit", "Vest payouts"],
});

export default function VestReviewPage() {
  return (
    <>
      <JsonLd
        data={articleLd({
          title: TITLE,
          description: DESCRIPTION,
          path: "/vest-review",
          datePublished: "2026-11-05",
          dateModified: VEST_FACTS_CHECKED,
        })}
      />
      <div className="mx-auto max-w-3xl px-6 pt-8 md:px-14">
        <Breadcrumbs items={[{ name: "Vest review", path: "/vest-review" }]} />
        <p className="meta mt-6">Review · facts checked {VEST_FACTS_CHECKED}</p>
        <h1 className="mt-3 text-[36px] leading-[0.96] font-medium tracking-[-0.035em] text-ink md:text-[56px]">Vest review: payouts first</h1>
        <p className="mt-4 text-lg text-sub">
          Vest Markets is a crypto derivatives exchange with a funded-trader program, Vest Capital. This review sticks to the question that matters if you are paying for a challenge: do they pay, how fast, and on what terms.
        </p>
      </div>
      <article className="prose-tape mx-auto max-w-3xl px-6 md:px-14">
        <LiveStatsCallout />
        <h2>What Vest is</h2>
        <p>
          Vest lists perpetual futures on crypto, equities, commodities and FX, and sells funded accounts under the Vest Capital name. You pay a one-time fee, trade under loss limits, and keep a fixed share of profits. The firm is not a brokerage account in your name. Vest&apos;s own terms describe funded balances as virtual and payouts as compensation under the program rules, not a share of a live trade booked for you. Read the{" "}
          <a href={VEST_SOURCES.terms} target="_blank" rel="noopener nofollow">prop terms</a> before you buy. VestPayouts is not affiliated with Vest.
        </p>
        <h2>Do they pay?</h2>
        <p>
          Yes, and you don&apos;t have to take their word for it. Withdrawals leave public payout contracts on Base and Arbitrum as USDC. VestPayouts reads those contracts and links every payout to its transaction. See the <Link href="/payouts">payout list</Link> and the <Link href="/blog/vest-payout-proof">proof guide</Link>. One caveat, explained in the <Link href="/methodology">methodology</Link>: the same contracts also pay ordinary exchange withdrawals, so a row is proof Vest sent USDC, not proof it came from a funded-account profit.
        </p>
        <h2>How the payout works</h2>
        <p>
          Claim Profit moves your split from the funded account to your Primary Account, within 24 hours per the docs, with no cap on size or frequency. A withdrawal then sends USDC to a wallet you specify. Minimum 1 USDC. Amounts that push you over $50,000 in a rolling day wait an extra 24 hours. Full walkthrough: <Link href="/how-vest-payouts-work">how Vest payouts work</Link>.
        </p>
        <h2>What it costs</h2>
        <h3>Instant Accounts</h3>
        <p>Live immediately, {SPLITS.instant}% split, no daily loss limit. Max drawdown equals the fee, so the room to be wrong is small.</p>
        <table>
          <thead>
            <tr>
              <th>Capital</th>
              <th>Fee</th>
              <th>Max drawdown</th>
            </tr>
          </thead>
          <tbody>
            {INSTANT_ACCOUNTS.map((a) => (
              <tr key={a.capital}>
                <td>{formatUsd(a.capital)}</td>
                <td>{formatUsd(a.fee)}</td>
                <td>
                  {formatUsd(a.maxDrawdown)} ({((a.maxDrawdown / a.capital) * 100).toFixed(0)}%)
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <h3>Evaluation accounts</h3>
        <p>
          Silver, Gold and Platinum. 1-Step lets you pick a 10% or 20% target, a 3%, 4% or no daily loss limit, and an {SPLITS.evalBase}% or {SPLITS.evalUpgrade}% split. 2-Step is fixed: 10% then 5%, a 3% daily loss limit, an {SPLITS.evalBase}% split, and a 6% max drawdown. Fees below are from the docs as of {VEST_FACTS_CHECKED}; confirm them on{" "}
          <a href={VEST_SOURCES.tiers} target="_blank" rel="noopener nofollow">Vest&apos;s pricing page</a>.
        </p>
        <table>
          <thead>
            <tr>
              <th>Tier</th>
              <th>Capital</th>
              <th>6% floor</th>
              <th>2-Step</th>
              <th>1-Step from</th>
            </tr>
          </thead>
          <tbody>
            {EVAL_TIERS.map((t) => (
              <tr key={t.tier}>
                <td>{t.tier}</td>
                <td>{formatUsd(t.capital)}</td>
                <td>{formatUsd(t.maxDrawdown)}</td>
                <td>{formatUsd(t.twoStepFee)}</td>
                <td>{formatUsd(t.oneStepFrom)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <h2>What is good</h2>
        <ul>
          <li>Payouts are on-chain. You can audit them without trusting a screenshot.</li>
          <li>Claims are on demand. There is no payout calendar and no minimum trading days.</li>
          <li>The {SPLITS.instant}% Instant split is high, and the cheapest account is {formatUsd(INSTANT_ACCOUNTS[0].fee)}.</li>
          <li>Markets run 24/7 across more than crypto.</li>
        </ul>
        <h2>What is not</h2>
        <ul>
          <li>Instant drawdown is 2–4% and static. One bad trade can end the account.</li>
          <li>Breaching a loss limit closes the account immediately. There is no reset.</li>
          <li>Payouts are crypto only. If you need a bank wire, this is the wrong product.</li>
          <li>Pricing and rules move. The homepage and the docs have disagreed on details before. Check the live pages.</li>
          <li>Most people who buy evaluations do not get paid. The fee is the cost of the attempt, not a deposit you get back.</li>
        </ul>
        <h2>Who it fits</h2>
        <p>
          Traders who already size small, want a public payout record, and are fine holding USDC on Base or Arbitrum. It is a poor fit if you swing wide, need fiat, or want a firm that offers discounted resets. For a side-by-side with typical prop firms, read <Link href="/blog/vest-vs-competitors">Vest vs competitors</Link>. For the Instant vs evaluation tradeoff, read <Link href="/blog/vest-instant-vs-evaluation">that comparison</Link>.
        </p>
        <p>
          Nothing here is financial advice. Trading leveraged derivatives can wipe out the fee and more if you add your own capital.
        </p>
      </article>
      <div className="mx-auto max-w-3xl px-4 pt-4 pb-8 sm:px-6">
        <ReferralPanel placement="review" title="Try Vest with a funded account from $10" />
      </div>
    </>
  );
}
