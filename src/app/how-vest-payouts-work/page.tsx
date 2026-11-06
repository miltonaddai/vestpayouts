import Link from "next/link";
import { LiveStatsCallout } from "@/components/content/live-stats-callout";
import { ReferralPanel } from "@/components/referral/referral-cta";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { PAYOUT_FAQS } from "@/lib/content/faqs";
import { EVAL_TIERS, INSTANT_ACCOUNTS, SPLITS, VEST_SOURCES } from "@/lib/content/vest-facts";
import { formatUsd } from "@/lib/format";
import { faqLd, pageMetadata } from "@/lib/seo";

export const revalidate = 3600;

const faqs = PAYOUT_FAQS.slice(0, 5);

export const metadata = pageMetadata({
  title: "How Vest Payouts Work — Claim Profit, Withdraw USDC",
  description:
    "How Vest payouts work: claim profit from a funded account, withdraw USDC on Base or Arbitrum, profit splits, timing, limits, and how to verify the transfer on-chain.",
  path: "/how-vest-payouts-work",
  keywords: ["how Vest payouts work", "Vest claim profit", "Vest withdrawal", "Vest payout time"],
});

export default function HowPayoutsWorkPage() {
  return (
    <>
      <JsonLd data={faqLd(faqs)} />
      <div className="mx-auto max-w-3xl px-4 pt-8 sm:px-6">
        <Breadcrumbs items={[{ name: "How Vest payouts work", path: "/how-vest-payouts-work" }]} />
        <p className="mt-6 text-xs font-semibold tracking-wide text-mint uppercase">Guide</p>
        <h1 className="mt-3 text-3xl font-bold text-paper sm:text-5xl">How Vest payouts work</h1>
        <p className="mt-4 text-lg text-paper/75">
          Vest pays traders in USDC, in two distinct steps. Neither one is a bank transfer, and both leave a trail you can check.
        </p>
      </div>
      <article className="prose-tape mx-auto max-w-3xl px-4 sm:px-6">
        <LiveStatsCallout />
        <h2>The two steps</h2>
        <p>
          A Vest Capital account is not the same balance as your main Vest account. Profit sits in the funded account until you ask for it.
        </p>
        <ol>
          <li>
            <strong>Claim Profit.</strong> From the funded account you submit a claim. Vest credits your profit split to your Primary Account. The docs say this takes up to 24 hours, the request can&apos;t be reversed, and you may need to close positions first.
          </li>
          <li>
            <strong>Withdraw.</strong> From the Primary Account you send USDC to a wallet address you type in. Email and Google accounts withdraw on Base or Arbitrum One. That on-chain transfer is the payout VestPayouts records.
          </li>
        </ol>
        <p>
          Sources:{" "}
          <a href={VEST_SOURCES.claim} target="_blank" rel="noopener nofollow">Claiming Profit</a> and{" "}
          <a href={VEST_SOURCES.withdrawals} target="_blank" rel="noopener nofollow">Withdrawals</a> in the Vest docs. The step-by-step version is{" "}
          <Link href="/blog/how-to-get-paid-on-vest">how to get paid on Vest</Link>.
        </p>
        <h2>What you keep</h2>
        <p>The split is chosen when you buy the account and does not change later.</p>
        <table>
          <thead>
            <tr>
              <th>Account</th>
              <th>You keep</th>
              <th>Entry price</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Instant</td>
              <td>{SPLITS.instant}% flat</td>
              <td>
                {formatUsd(INSTANT_ACCOUNTS[0].fee)} for {formatUsd(INSTANT_ACCOUNTS[0].capital)} of capital, up to {formatUsd(INSTANT_ACCOUNTS.at(-1)!.fee)} for {formatUsd(INSTANT_ACCOUNTS.at(-1)!.capital)}
              </td>
            </tr>
            <tr>
              <td>Evaluation, 1-Step or 2-Step</td>
              <td>
                {SPLITS.evalBase}% or {SPLITS.evalUpgrade}%
              </td>
              <td>
                2-Step from {formatUsd(EVAL_TIERS[0].twoStepFee)}; 1-Step priced by target, daily loss limit and split
              </td>
            </tr>
          </tbody>
        </table>
        <h2>Limits and timing</h2>
        <ul>
          <li>Minimum withdrawal: 1 USDC.</li>
          <li>No cap on how often or how much you claim from a funded account.</li>
          <li>Withdrawals that push a rolling 24-hour total past $50,000 get an extra 24-hour processing period.</li>
          <li>Vest currently lists a 24-hour processing period for platform withdrawals, with an email when they complete.</li>
        </ul>
        <p>
          VestPayouts measures the on-chain half: the time from the withdrawal request recorded in the payout event to the block where the USDC moves. The median is on the <Link href="/">home page</Link>.
        </p>
        <h2>What shows up on VestPayouts</h2>
        <p>
          We index USDC leaving Vest&apos;s payout contracts. A claim that is still inside Vest is not on the feed yet. A withdrawal is, whether it came from funded-account profit or from an ordinary exchange balance, because both exit through the same contract. That distinction is covered in the <Link href="/methodology">methodology</Link>.
        </p>
        <h2>Questions</h2>
        <dl>
          {faqs.map((f) => (
            <div key={f.q}>
              <dt>
                <strong>{f.q}</strong>
              </dt>
              <dd>{f.a}</dd>
            </div>
          ))}
        </dl>
        <p>
          More answers on the <Link href="/faq">FAQ</Link>, and a full look at the product in the <Link href="/vest-review">Vest review</Link>.
        </p>
      </article>
      <div className="mx-auto max-w-3xl px-4 pt-4 pb-8 sm:px-6">
        <ReferralPanel placement="guide" title="Open a Vest account and get paid in USDC" />
      </div>
    </>
  );
}
