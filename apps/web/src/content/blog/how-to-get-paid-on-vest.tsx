import Link from "next/link";
import { LiveStatsCallout } from "@/components/content/live-stats-callout";
import { InlineCta } from "@/components/content/inline-cta";
import { SPLITS, VEST_SOURCES } from "@/lib/content/vest-facts";

export default function HowToGetPaidOnVest() {
  return (
    <>
      <p>
        Getting paid on Vest is a two-step process: you <strong>claim profit</strong> from your funded account into
        your Vest Primary Account, then you <strong>withdraw USDC</strong> to your own wallet. Each step has its own
        timing and rules. This guide covers both, with the numbers from Vest&apos;s own documentation and what we see in
        real on-chain payout data.
      </p>

      <LiveStatsCallout />

      <h2>Step 1: Claim profit from your funded account</h2>
      <p>
        A Vest Capital account, whether you bought an Instant Account or passed an evaluation, is separate from your
        main Vest balance. Profit stays in the funded account until you submit a <strong>Claim Profit</strong> request
        from its Portfolio page.
      </p>
      <ul>
        <li>
          <strong>Your split is applied at the moment you claim:</strong> {SPLITS.instant}% on Instant Accounts,{" "}
          {SPLITS.evalBase}% or {SPLITS.evalUpgrade}% on evaluation accounts, whichever you picked at purchase.
        </li>
        <li>
          <strong>Processing takes up to 24 hours.</strong> The USDC is then credited to your Primary Account.
        </li>
        <li>
          <strong>Claims are irrevocable</strong> once submitted, and you may need to close open positions or orders first.
        </li>
        <li>
          <strong>No caps.</strong> Vest&apos;s docs say you can claim as often as you like and there&apos;s no limit on
          the amount.
        </li>
      </ul>
      <p>
        Source: <a href={VEST_SOURCES.claim} rel="noopener nofollow" target="_blank">Vest docs, Claiming Profit</a>.
      </p>

      <h2>Step 2: Withdraw USDC to your wallet</h2>
      <p>
        Once profit is in your Primary Account it&apos;s yours: you can trade it, leave it there or withdraw it. A
        withdrawal sends USDC to an external wallet address you enter manually.
      </p>
      <ol>
        <li>Open your Primary Account portfolio and press <strong>Withdraw</strong>.</li>
        <li>
          Enter the destination address, pick the chain, and enter the amount. Email and Google accounts can withdraw on{" "}
          <strong>Base</strong> or <strong>Arbitrum One</strong>; wallet-connected accounts see the chains offered on the
          withdrawal screen.
        </li>
        <li>Confirm. Withdrawals can&apos;t be reversed, so double-check the address and the chain.</li>
      </ol>
      <h3>Withdrawal limits and timing</h3>
      <div className="prose-table">
        <table>
          <thead>
            <tr>
              <th>Rule</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Minimum withdrawal</td>
              <td>1 USDC</td>
            </tr>
            <tr>
              <td>Rolling limit</td>
              <td>Anything that takes you above $50,000 in 24 hours gets an extra 24-hour processing period</td>
            </tr>
            <tr>
              <td>Processing</td>
              <td>Vest currently lists a 24-hour processing period for all withdrawals, with an email when it completes</td>
            </tr>
            <tr>
              <td>Tracking</td>
              <td>The Withdrawals tab shows status, amount, time and the on-chain transaction ID</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        Source: <a href={VEST_SOURCES.withdrawals} rel="noopener nofollow" target="_blank">Vest docs, Withdrawals</a>.
        On-chain, VestPayouts measures the time between the withdrawal request and the USDC arriving. The{" "}
        <Link href="/">home page</Link> shows the current median.
      </p>

      <InlineCta />

      <h2>Common mistakes that delay a Vest payout</h2>
      <ul>
        <li>
          <strong>Wrong chain.</strong> Sending to an exchange deposit address that only supports Ethereum mainnet USDC
          can strand funds. Use a wallet or exchange that supports USDC on Base or Arbitrum.
        </li>
        <li>
          <strong>Open positions.</strong> A claim may need you to be flat. Close positions and cancel orders first.
        </li>
        <li>
          <strong>Breaching a loss limit before claiming.</strong> Going below the Max. Drawdown or Daily Loss Limit
          floor closes the account immediately. Claim profit you want to keep instead of leaving it exposed. See{" "}
          <a href={VEST_SOURCES.lossLimits} rel="noopener nofollow" target="_blank">Loss Limits</a>.
        </li>
        <li>
          <strong>Big withdrawals in one day.</strong> Splitting a large payout across days avoids the $50,000 rolling
          limit&apos;s extra processing time.
        </li>
      </ul>

      <h2>How to confirm you got paid</h2>
      <p>
        Copy the transaction ID from Vest&apos;s Withdrawals tab and look it up on BaseScan or Arbiscan, or search your
        wallet address on <Link href="/payouts">VestPayouts&apos;s payout list</Link>. Every Vest payout we track has its
        own page with the amount, time and a link to the explorer. Our{" "}
        <Link href="/blog/vest-payout-proof">Vest payout proof guide</Link> walks through it.
      </p>
    </>
  );
}
