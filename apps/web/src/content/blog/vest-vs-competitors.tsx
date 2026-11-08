import Link from "next/link";
import { InlineCta } from "@/components/content/inline-cta";
import { EVAL_TIERS, INSTANT_ACCOUNTS, SPLITS, VEST_SOURCES } from "@/lib/content/vest-facts";

export default function VestVsCompetitors() {
  return (
    <>
      <p>
        Prop firms all sell the same promise: trade our capital, keep most of the profit. They differ a lot on the
        things that decide whether you actually get paid: how payouts are sent, how fast, how often, and how strict the
        rules are. Here&apos;s how Vest Capital compares with the typical models in the market.
      </p>
      <blockquote>
        Competitor terms change constantly, so we compare against common industry models rather than quoting other
        firms&apos; prices. Always check a firm&apos;s current rules before you buy.
      </blockquote>

      <h2>At a glance</h2>
      <div className="prose-table">
        <table>
          <thead>
            <tr>
              <th>Feature</th>
              <th>Vest Capital</th>
              <th>Typical futures / forex prop firm</th>
              <th>Typical crypto prop firm</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Payout rail</td>
              <td>USDC on Base or Arbitrum, publicly verifiable</td>
              <td>Bank transfer, payment processor or crypto, usually private</td>
              <td>Crypto (often USDC/USDT), sometimes on-chain</td>
            </tr>
            <tr>
              <td>Payout frequency</td>
              <td>Claim any time, no cap on frequency or size</td>
              <td>Often bi-weekly or after a minimum number of trading days</td>
              <td>Varies, from on-demand to weekly cycles</td>
            </tr>
            <tr>
              <td>Processing time</td>
              <td>Up to 24 h to claim and up to 24 h to withdraw</td>
              <td>Often 1–5 business days after approval</td>
              <td>Hours to days</td>
            </tr>
            <tr>
              <td>Profit split</td>
              <td>
                {SPLITS.instant}% Instant; {SPLITS.evalBase}% / {SPLITS.evalUpgrade}% evaluation
              </td>
              <td>Commonly 80–90%, sometimes scaling up</td>
              <td>Commonly 70–90%</td>
            </tr>
            <tr>
              <td>Skip the evaluation?</td>
              <td>Yes, Instant Accounts from ${INSTANT_ACCOUNTS[0].fee}</td>
              <td>Sometimes, at a premium</td>
              <td>Sometimes</td>
            </tr>
            <tr>
              <td>Markets</td>
              <td>Crypto, equities, indices, commodities and FX perps, 24/7</td>
              <td>Futures or CFDs, market hours</td>
              <td>Mostly crypto perps</td>
            </tr>
            <tr>
              <td>Payout transparency</td>
              <td>Every payout traceable on-chain</td>
              <td>Relies on firm-published stats or screenshots</td>
              <td>Mixed</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Where Vest stands out</h2>
      <h3>1. Payouts you can audit</h3>
      <p>
        Most firms publish payout totals you have to take on trust. Vest&apos;s payouts leave public contracts, so
        anyone can count them, and that&apos;s exactly what <Link href="/">VestPayouts</Link> does. See our{" "}
        <Link href="/blog/vest-payout-proof">payout proof guide</Link>.
      </p>
      <h3>2. On-demand claims</h3>
      <p>
        No payout calendar and no minimum trading days before your first claim. Profit can be claimed whenever
        you&apos;re up. Claims take up to 24 hours and aren&apos;t capped.
      </p>
      <h3>3. Cheap entry into a live account</h3>
      <p>
        The smallest Instant Account is ${INSTANT_ACCOUNTS[0].capital.toLocaleString()} of capital for $
        {INSTANT_ACCOUNTS[0].fee}. Evaluation paths start at ${EVAL_TIERS[0].twoStepFee} for a $
        {EVAL_TIERS[0].capital.toLocaleString()} 2-Step account. Source:{" "}
        <a href={VEST_SOURCES.tiers} target="_blank" rel="noopener nofollow">Vest account tiers</a>.
      </p>

      <h2>Where competitors can be better</h2>
      <ul>
        <li>
          <strong>Drawdown room on Instant Accounts is tight.</strong> Max. Drawdown equals the fee you paid: 2–4% of
          capital, static. Some firms give more room per dollar.
        </li>
        <li>
          <strong>Breaches are instant and permanent.</strong> No warnings and no resets. Some firms offer discounted
          resets.
        </li>
        <li>
          <strong>Crypto rails only.</strong> If you need bank payouts, a traditional firm may suit you better.
        </li>
        <li>
          <strong>Program structure.</strong> Vest&apos;s legal disclosures say funded balances and results are
          virtual, and that payouts are compensation under the program rules. That&apos;s common across the industry,
          but read the <a href={VEST_SOURCES.terms} target="_blank" rel="noopener nofollow">terms</a>.
        </li>
      </ul>

      <h2>Bottom line</h2>
      <p>
        If you care most about fast, frequent, verifiable payouts and you&apos;re comfortable with crypto, Vest is one
        of the most transparent options available. If you need wide drawdown limits or bank transfers, compare
        carefully. Read our full <Link href="/vest-review">Vest review</Link> for the details.
      </p>

      <InlineCta placement="compare" />
    </>
  );
}
