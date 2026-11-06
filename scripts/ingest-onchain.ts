/**
 * Pulls Vest payout events from Base and Arbitrum into Supabase (table public.payouts).
 *
 *   yarn ingest                      # incremental sync for every chain (cursor in public.ingest_state)
 *   yarn ingest --chain base         # one chain
 *   yarn ingest --since 2026-07-01   # first run start date, or backfill earlier history later
 *
 * Needs NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY. Set BASE_RPC_URL /
 * ARBITRUM_RPC_URL for a private (archive) RPC; the free defaults only reach ~2M blocks back on Base.
 * Re-running is safe: rows are upserted on (chain, tx_hash, log_index).
 */
import { CHAINS, CHAIN_IDS, PAYOUT_EVENT_TOPIC, type ChainConfig, type ChainId } from "../src/lib/payouts/chains";
import type { PayoutInsert } from "../src/lib/supabase/database.types";
import { argValue, serviceClient, triggerRevalidate } from "./lib/env";
import { hex, RangeTooLargeError, Rpc } from "./lib/rpc";

const DEFAULT_SINCE = "2026-10-01T00:00:00Z";
const FLUSH_EVERY_CHUNKS = 20;
const db = serviceClient();

interface RpcLog {
  topics: string[];
  data: string;
  blockNumber: string;
  transactionHash: string;
  logIndex: string;
  removed?: boolean;
}

const word = (data: string, i: number) => data.slice(2 + i * 64, 2 + (i + 1) * 64);

/**
 * Event layout (Vest payout contract, topic0 = PAYOUT_EVENT_TOPIC):
 *   topics[1] Vest-side account, topics[2] recipient wallet, topics[3] withdrawal id
 *   data      [requestedAt (unix ms), token, amount (token decimals)]
 */
function decode(chain: ChainConfig, log: RpcLog) {
  if (log.removed || log.topics[0] !== PAYOUT_EVENT_TOPIC || log.topics.length < 3) return null;
  const token = `0x${word(log.data, 1).slice(-40)}`.toLowerCase();
  if (token !== chain.usdc) return null;
  return {
    tx: log.transactionHash.toLowerCase(),
    logIndex: parseInt(log.logIndex, 16),
    block: parseInt(log.blockNumber, 16),
    requestedAtMs: parseInt(word(log.data, 0), 16),
    wallet: `0x${log.topics[2].slice(-40)}`.toLowerCase(),
    micros: BigInt(`0x${word(log.data, 2)}`),
  };
}

type Decoded = NonNullable<ReturnType<typeof decode>>;

async function toRows(rpc: Rpc, chain: ChainId, logs: Decoded[]): Promise<PayoutInsert[]> {
  const blocks = [...new Set(logs.map((l) => l.block))];
  const ts = new Map<number, number>();
  for (let i = 0; i < blocks.length; i += 25) {
    const slice = blocks.slice(i, i + 25);
    const res = await rpc.batch<{ timestamp: string }>(slice.map((n) => ({ method: "eth_getBlockByNumber", params: [hex(n), false] })));
    slice.forEach((n, j) => ts.set(n, parseInt(res[j].timestamp, 16)));
  }
  return logs.map((l) => {
    const paidMs = ts.get(l.block)! * 1000;
    return {
      source: "onchain",
      chain,
      tx_hash: l.tx,
      log_index: l.logIndex,
      block_number: l.block,
      wallet: l.wallet,
      amount_usd: Number(l.micros) / 1e6,
      paid_at: new Date(paidMs).toISOString(),
      requested_at: l.requestedAtMs > 0 && l.requestedAtMs <= paidMs ? new Date(l.requestedAtMs).toISOString() : null,
    };
  });
}

async function upsert(rows: PayoutInsert[]) {
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await db
      .from("payouts")
      .upsert(rows.slice(i, i + 500), { onConflict: "chain,tx_hash,log_index", ignoreDuplicates: true });
    if (error) throw new Error(`upsert failed: ${error.message}`);
  }
}

async function saveState(chain: ChainConfig, fromBlock: number, lastBlock: number) {
  const { error } = await db.from("ingest_state").upsert({
    chain: chain.id,
    contract: chain.payoutContract,
    from_block: fromBlock,
    last_block: lastBlock,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(`ingest_state update failed: ${error.message}`);
}

async function ingestChain(id: ChainId) {
  const chain = CHAINS[id];
  const rpc = new Rpc(process.env[chain.rpcEnv] || chain.defaultRpc);
  const tip = parseInt(await rpc.call<string>("eth_blockNumber", []), 16) - chain.confirmations;
  const sinceArg = argValue("--since");
  const sinceTs = Math.floor(new Date(sinceArg ?? DEFAULT_SINCE).getTime() / 1000);

  const { data: state, error } = await db.from("ingest_state").select("*").eq("chain", id).maybeSingle();
  if (error) throw new Error(`reading ingest_state failed: ${error.message}`);

  let fromBlock: number;
  let lastBlock: number;
  if (state) {
    fromBlock = Number(state.from_block);
    lastBlock = Number(state.last_block);
  } else {
    console.log(`[${id}] first run, locating start block for ${new Date(sinceTs * 1000).toISOString()}`);
    fromBlock = await rpc.findBlockAtOrAfter(sinceTs, tip);
    const startTs = await rpc.blockTimestamp(fromBlock);
    if (startTs - sinceTs > 3600) {
      console.warn(`[${id}] this RPC's history starts at ${new Date(startTs * 1000).toISOString()}; set ${chain.rpcEnv} to an archive RPC for older payouts`);
    }
    lastBlock = fromBlock - 1;
  }

  let inserted = 0;
  const scan = async (from: number, to: number, onProgress: (upTo: number) => Promise<void>) => {
    if (to < from) return;
    const total = to - from + 1;
    console.log(`[${id}] scanning blocks ${from} → ${to} (${total.toLocaleString()} blocks)`);
    let chunk = chain.logChunk;
    let cursor = from;
    let pending: Decoded[] = [];
    let chunks = 0;
    while (cursor <= to) {
      const end = Math.min(cursor + chunk - 1, to);
      let logs: RpcLog[];
      try {
        logs = await rpc.call<RpcLog[]>("eth_getLogs", [
          { fromBlock: hex(cursor), toBlock: hex(end), address: chain.payoutContract, topics: [PAYOUT_EVENT_TOPIC] },
        ]);
      } catch (err) {
        if (err instanceof RangeTooLargeError && chunk > 100) {
          chunk = Math.floor(chunk / 2);
          console.log(`[${id}] range too large, chunk → ${chunk}`);
          continue;
        }
        throw err;
      }
      for (const l of logs) {
        const d = decode(chain, l);
        if (d) pending.push(d);
      }
      cursor = end + 1;
      chunks++;
      if (chunks % FLUSH_EVERY_CHUNKS === 0 || pending.length >= 2000 || cursor > to) {
        const rows = await toRows(rpc, id, pending);
        await upsert(rows);
        inserted += rows.length;
        pending = [];
        await onProgress(end);
        console.log(`[${id}] ${(((end - from + 1) / total) * 100).toFixed(1)}% · block ${end} · ${inserted} rows written`);
      }
    }
  };

  if (state && sinceArg) {
    const backfillFrom = await rpc.findBlockAtOrAfter(sinceTs, fromBlock);
    if (backfillFrom < fromBlock) {
      await scan(backfillFrom, fromBlock - 1, async () => {});
      fromBlock = backfillFrom;
      await saveState(chain, fromBlock, lastBlock);
    }
  }

  await scan(lastBlock + 1, tip, async (upTo) => {
    lastBlock = upTo;
    await saveState(chain, fromBlock, lastBlock);
  });
  await saveState(chain, fromBlock, Math.max(lastBlock, tip));
  console.log(`[${id}] done through block ${Math.max(lastBlock, tip)} (${inserted} rows written this run)`);
}

async function main() {
  const only = argValue("--chain") as ChainId | undefined;
  const targets = only ? [only] : CHAIN_IDS;
  const results = await Promise.allSettled(targets.map(ingestChain));
  let failed = false;
  results.forEach((r, i) => {
    if (r.status === "rejected") {
      failed = true;
      console.error(`[${targets[i]}] failed:`, r.reason);
    }
  });
  await triggerRevalidate();
  process.exit(failed ? 1 : 0);
}

main();
