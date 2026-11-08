import Link from "next/link";
import { InlineCta } from "@/components/content/inline-cta";
import { formatUsd } from "@/lib/format";
import { EVAL_TIERS, INSTANT_ACCOUNTS, SPLITS, VEST_SOURCES } from "@/lib/content/vest-facts";

export default function InstantVsEvaluation() {
  return (
    <>
      <p>
        Vest Capital offers two routes to a live funded account. <strong>Instant Accounts</strong> go live as soon as
        you pay and keep a {SPLITS.instant}% split. <strong>Evaluation accounts</strong> make you hit a profit target
        first, in exchange for more drawdown room and a lower price per dollar of capital. Which one gets you paid
        sooner depends on how you trade.
      </p>

      <h2>Instant Accounts</h2>
      <div className="prose-table">
        <table>
          <thead>
            <tr>
              <th>Capital</th>
              <th>One-time fee</th>
              <th>Max. Drawdown</th>
              <th>Split</th>
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
                <td>{SPLITS.instant}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        No profit target, no Daily Loss Limit, no time limit. The catch: your drawdown equals your fee, so the room to
        be wrong is small, and it&apos;s a static floor that doesn&apos;t move up with profits.
      </p>

      <h2>Evaluation accounts</h2>
      <div className="prose-table">
        <table>
          <thead>
            <tr>
              <th>Tier</th>
              <th>Capital</th>
              <th>Max. Drawdown (6%)</th>
              <th>2-Step fee</th>
              <th>1-Step fee from</th>
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
      </div>
      <p>
        1-Step accounts let you choose a 10% or 20% profit target, a 3%, 4% or no Daily Loss Limit, and an{" "}
        {SPLITS.evalBase}% or {SPLITS.evalUpgrade}% split. Each choice changes the price. 2-Step is fixed: 10% then
        5%, a 3% DLL and an {SPLITS.evalBase}% split. Source:{" "}
        <a href={VEST_SOURCES.tiers} target="_blank" rel="noopener nofollow">Vest account tiers</a>.
      </p>

      <h2>Which pays out faster?</h2>
      <ul>
        <li>
          <strong>Instant</strong> can pay out on day one. Any profit is claimable right away at {SPLITS.instant}%.
          It&apos;s best for disciplined traders with tight stops and small, frequent wins.
        </li>
        <li>
          <strong>Evaluation</strong> delays the first payout until you pass, but 6% drawdown gives swing traders far
          more room, and the fee per dollar of capital is much lower.
        </li>
      </ul>
      <p>
        Either way, payouts go through the same two steps (Claim Profit, then Withdraw) described in{" "}
        <Link href="/blog/how-to-get-paid-on-vest">how to get paid on Vest</Link>, and they show up in the{" "}
        <Link href="/payouts">payout feed</Link> once they hit the chain.
      </p>

      <InlineCta />
    </>
  );
}
