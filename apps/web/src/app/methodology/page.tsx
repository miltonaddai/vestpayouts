import Link from "next/link";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { CHAINS, PAYOUT_EVENT_TOPIC, VEST_PAYOUT_RELAYER } from "@/lib/payouts/chains";
import { getCoverage } from "@/lib/payouts/repository";
import { pageMetadata } from "@/lib/seo";
import { formatDate } from "@/lib/format";

export const revalidate = 3600;

export const metadata = pageMetadata({
  title: "Methodology — How VestPayouts Tracks Vest Payouts",
  description:
    "How VestPayouts collects Vest payouts: the Base and Arbitrum contracts we read, what a row does and does not prove, sample data, and manual imports.",
  path: "/methodology",
  keywords: ["Vest payout data", "Vest payout contract", "how VestPayouts works"],
});

export default async function MethodologyPage() {
  const coverage = await getCoverage();
  return (
    <div className="mx-auto max-w-3xl px-4 pt-8 sm:px-6">
      <Breadcrumbs items={[{ name: "Methodology", path: "/methodology" }]} />
      <h1 className="mt-5 text-3xl font-bold text-paper sm:text-5xl">How the numbers are made</h1>
      <article className="prose-tape">
        <p>
          VestPayouts does not scrape Vest&apos;s website and does not take payout screenshots as evidence. A row marked on-chain is a USDC transfer we read from a public blockchain.
        </p>
        <h2>Where the data comes from</h2>
        <p>
          Vest withdrawals are submitted by <code>{VEST_PAYOUT_RELAYER}</code> to a payout contract on each chain. Every payout emits one event (topic <code>{PAYOUT_EVENT_TOPIC.slice(0, 10)}…</code>) carrying the recipient, the token, the amount, and the time the withdrawal was requested inside Vest. We keep the event only when the token is native USDC.
        </p>
        <table>
          <thead>
            <tr>
              <th>Chain</th>
              <th>Payout contract</th>
              <th>USDC</th>
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
                <td>
                  <code>{c.usdc}</code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p>
          The ingester (<code>yarn ingest</code>) walks new blocks, upserts on <code>(chain, tx hash, log index)</code> so reruns don&apos;t duplicate or overwrite a trader name, and stores its cursor in <code>ingest_state</code>. Free public RPCs only serve recent Base history. Set <code>BASE_RPC_URL</code> and <code>ARBITRUM_RPC_URL</code> to an archive endpoint for a full backfill.
        </p>
        {coverage.length > 0 && (
          <>
            <h2>Current coverage</h2>
            <table>
              <thead>
                <tr>
                  <th>Chain</th>
                  <th>Blocks scanned</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {coverage.map((c) => (
                  <tr key={c.chain}>
                    <td>{CHAINS[c.chain].name}</td>
                    <td>
                      {c.fromBlock.toLocaleString()} → {c.lastBlock.toLocaleString()}
                    </td>
                    <td>{formatDate(Date.parse(c.updatedAt), true)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
        <h2>What a row proves</h2>
        <p>
          An on-chain row proves that Vest&apos;s payout contract sent that much USDC to that wallet in that transaction. It does not prove who owns the wallet. It also does not, by itself, prove the money was profit from a Vest Capital funded account. Claim Profit moves funds inside Vest first. The withdrawal that follows looks the same on-chain as a withdrawal of an ordinary exchange balance, because both leave the Primary Account through the same contract. We label the feed &ldquo;Vest payouts&rdquo; for that reason: real USDC leaving Vest, not a filtered subset of prop-firm profit.
        </p>
        <h2>Other sources</h2>
        <ul>
          <li>
            <strong>Manual rows</strong> are payouts someone reported, with an optional link to a public post. They are badged &ldquo;Reported&rdquo; until a transaction hash matches an on-chain row, in which case we attach the name and the link to that row instead of keeping two.
          </li>
          <li>
            <strong>Sample rows</strong> are fake placeholders. They are badged &ldquo;Sample&rdquo;, excluded from search engines, and the database hides them as soon as any real published payout exists. They exist so the site is usable before the first ingest.
          </li>
        </ul>
        <h2>How the site stays fast</h2>
        <p>
          Pages are statically generated and revalidated about once an hour. Totals, the daily chart and the leaderboard are computed in Postgres, not in the browser. After an ingest or an admin import, <code>POST /api/revalidate</code> with <code>REVALIDATE_SECRET</code> refreshes every page immediately.
        </p>
        <p>
          Questions about a specific number: start at the <Link href="/payouts">payout list</Link> and open the transaction. If the explorer disagrees with us, the explorer is right and we want to know.
        </p>
      </article>
    </div>
  );
}
