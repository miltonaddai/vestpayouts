import Link from "next/link";
import { InlineCta } from "@/components/content/inline-cta";
import { LiveStatsCallout } from "@/components/content/live-stats-callout";
import { CHAINS, VEST_PAYOUT_RELAYER } from "@/lib/payouts/chains";

export default function VestPayoutProof() {
  return (
    <>
      <p>
        Prop firm marketing runs on payout screenshots, and screenshots are easy to fake. Vest is unusual because its
        payouts settle as <strong>USDC on public blockchains</strong>. That means there&apos;s an independent,
        permanent record of every one. Here&apos;s how to read it.
      </p>

      <LiveStatsCallout />

      <h2>Where Vest payouts come from</h2>
      <p>
        When a Vest withdrawal is processed, a USDC transfer is sent from one of Vest&apos;s payout contracts to the
        trader&apos;s wallet. These are the addresses we track:
      </p>
      <table>
        <thead>
          <tr>
            <th>Chain</th>
            <th>Payout contract</th>
          </tr>
        </thead>
        <tbody>
          {Object.values(CHAINS).map((c) => (
            <tr key={c.id}>
              <td>{c.name}</td>
              <td>
                <a href={`${c.explorer}/address/${c.payoutContract}`} target="_blank" rel="noopener nofollow">
                  <code>{c.payoutContract}</code>
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>
        The transactions are submitted by the same operator address on both chains (
        <code>{VEST_PAYOUT_RELAYER}</code>). Each payout also emits an event recording the recipient, the token, the
        amount, and the moment the withdrawal was requested inside Vest. That&apos;s how we can measure processing time.
      </p>

      <h2>How to verify a Vest payout in 60 seconds</h2>
      <ol>
        <li>Get the transaction hash. It&apos;s in Vest&apos;s Withdrawals tab, or on any PaidTape payout page.</li>
        <li>
          Open it on <a href="https://basescan.org" target="_blank" rel="noopener nofollow">BaseScan</a> or{" "}
          <a href="https://arbiscan.io" target="_blank" rel="noopener nofollow">Arbiscan</a>, depending on the chain.
        </li>
        <li>
          Under <strong>ERC-20 Tokens Transferred</strong>, check that USDC moved <strong>from</strong> the payout
          contract above <strong>to</strong> the trader&apos;s wallet.
        </li>
        <li>
          Check that the token is genuine USDC: <code>{CHAINS.base.usdc}</code> on Base,{" "}
          <code>{CHAINS.arbitrum.usdc}</code> on Arbitrum.
        </li>
      </ol>

      <h2>Red flags in fake &ldquo;Vest payout&rdquo; posts</h2>
      <ul>
        <li>A screenshot with no transaction hash, or a hash that doesn&apos;t exist on the stated chain.</li>
        <li>USDC that came from an ordinary wallet rather than Vest&apos;s payout contract.</li>
        <li>A token called &ldquo;USDC&rdquo; whose contract address doesn&apos;t match the official one.</li>
        <li>An amount that doesn&apos;t match what the explorer shows.</li>
      </ul>

      <h2>What on-chain proof can and can&apos;t tell you</h2>
      <p>
        On-chain data proves that Vest sent a given amount of USDC to a given wallet at a given time. It can&apos;t tell
        you who owns the wallet. It also can&apos;t always separate a Vest Capital profit withdrawal from an ordinary
        withdrawal of exchange funds, because both leave through the same contract. We explain how we handle that in our{" "}
        <Link href="/methodology">methodology</Link>.
      </p>
      <p>
        Want to see it for yourself? Browse the <Link href="/payouts?sort=largest">largest Vest payouts</Link> or the{" "}
        <Link href="/leaderboard">payout leaderboard</Link>. Every row links to its transaction.
      </p>

      <InlineCta />
    </>
  );
}
