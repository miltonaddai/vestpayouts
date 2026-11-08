/**
 * Pulls Vest USDC withdrawals from Base and Arbitrum.
 *
 * Default on Alchemy: alchemy_getAssetTransfers (120 CU/page, up to 1000
 * transfers with block timestamps). Free-tier eth_getLogs is limited to a
 * 10-block range on Base and Arbitrum, so a getLogs backfill would burn tens
 * of millions of CU — that path is implemented as a fallback only
 * (`--method logs` / INGEST_METHOD=logs), with chunk size 10, adaptive
 * halving, 429 retries, and a hard per-run request cap.
 *
 * Storage: Supabase when configured, otherwise <repo>/data/onchain-store.json
 * so the website can render real rows locally without calling Alchemy.
 *
 *   yarn ingest
 *   yarn ingest -- --chain base
 *   yarn ingest -- --since 2026-07-01
 *   yarn ingest -- --max-blocks 4000
 *   yarn ingest -- --method logs
 *   yarn ingest -- --max-requests 300
 *
 * Env: ALCHEMY_API_KEY (preferred), or BASE_RPC_URL / ARBITRUM_RPC_URL.
 *      INGEST_METHOD=transfers|logs
 *      INGEST_MAX_REQUESTS=300
 *      INGEST_STORE=local|supabase
 *      INGEST_CRON every 12 minutes (recommended cadence; leave empty so yarn dev does not scan)
 */
import { CHAINS, CHAIN_IDS, PAYOUT_EVENT_TOPIC, type ChainConfig, type ChainId, type PayoutInsert } from "@vestpayouts/shared";
import {
  ingestMaxRequests,
  isAlchemyRpc,
  rpcProviderLabel,
  rpcUrlFor,
  serviceClient,
  triggerRevalidate,
  useLocalPayoutStore,
} from "./env";
import { getLocalCursor, saveLocalCursor, upsertLocalPayouts } from "./local-store";
import { refreshPayoutStats } from "./refresh-stats";
import { hex, RangeTooLargeError, RequestCapError, RequestMeter, Rpc } from "./rpc";

const DEFAULT_SINCE = "2026-10-01T00:00:00Z";
const FLUSH_EVERY_CHUNKS = 20;
const MONTHLY_FREE_CU = 30_000_000;
const GETLOGS_CHUNK_ALCHEMY = 10;
const TRANSFERS_PAGE = "0x3e8"; // 1000
/** Rebuild stats at least this often even with no new payouts, so rolling
 *  windows (24h, 7d, 30d) keep sliding forward during quiet periods. */
const MAX_STATS_AGE_MS = 10 * 60 * 1000;
let lastStatsRefreshAt = 0;

export interface IngestOpts {
  chain?: string;
  since?: string;
  maxBlocks?: number;
  method?: string;
  maxRequests?: number;
  saveCursor?: boolean;
}

interface RpcLog {
  topics: string[];
  data: string;
  blockNumber: string;
  transactionHash: string;
  logIndex: string;
  removed?: boolean;
}

interface AssetTransfer {
  hash: string;
  from: string;
  to: string | null;
  value: number | null;
  uniqueId?: string;
  blockNum: string;
  rawContract?: { value?: string | null; address?: string | null; decimal?: string | null };
  metadata?: { blockTimestamp?: string };
}

interface PayoutStore {
  kind: "local" | "supabase";
  getCursor(chain: ChainId): Promise<{ from_block: number; last_block: number } | null>;
  saveCursor(row: { chain: ChainId; contract: string; from_block: number; last_block: number }): Promise<void>;
  upsert(rows: PayoutInsert[]): Promise<void>;
}

function openStore(): PayoutStore {
  if (useLocalPayoutStore()) {
    return {
      kind: "local",
      async getCursor(chain) {
        const row = getLocalCursor(chain);
        return row ? { from_block: row.from_block, last_block: row.last_block } : null;
      },
      async saveCursor(row) {
        saveLocalCursor({ ...row, updated_at: new Date().toISOString() });
      },
      async upsert(rows) {
        upsertLocalPayouts(rows);
      },
    };
  }
  const db = serviceClient();
  return {
    kind: "supabase",
    async getCursor(chain) {
      const { data, error } = await db.from("ingest_state").select("*").eq("chain", chain).maybeSingle();
      if (error) throw new Error(`reading ingest_state failed: ${error.message}`);
      return data ? { from_block: Number(data.from_block), last_block: Number(data.last_block) } : null;
    },
    async saveCursor(row) {
      const { error } = await db.from("ingest_state").upsert({
        ...row,
        updated_at: new Date().toISOString(),
      });
      if (error) throw new Error(`ingest_state update failed: ${error.message}`);
    },
    async upsert(rows) {
      for (let i = 0; i < rows.length; i += 500) {
        const { error } = await db.from("payouts").upsert(rows.slice(i, i + 500), {
          onConflict: "chain,tx_hash,log_index",
          ignoreDuplicates: true,
        });
        if (error) throw new Error(`upsert failed: ${error.message}`);
      }
    },
  };
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
  if (!logs.length) return [];
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
      source: "onchain" as const,
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

function parseLogIndex(uniqueId: string | undefined): number {
  if (!uniqueId) return 0;
  const match = uniqueId.match(/:log:(0x[0-9a-fA-F]+|\d+)\s*$/i);
  if (!match) return 0;
  return match[1].toLowerCase().startsWith("0x") ? parseInt(match[1], 16) : Number(match[1]);
}

function transferToRow(chain: ChainConfig, transfer: AssetTransfer): PayoutInsert | null {
  const to = (transfer.to || "").toLowerCase();
  if (!/^0x[0-9a-f]{40}$/.test(to)) return null;
  const token = (transfer.rawContract?.address || "").toLowerCase();
  if (token && token !== chain.usdc) return null;
  const raw = transfer.rawContract?.value;
  const decimals = transfer.rawContract?.decimal ? parseInt(transfer.rawContract.decimal, 16) : 6;
  let amount = 0;
  if (typeof raw === "string" && raw.startsWith("0x")) {
    amount = Number(BigInt(raw)) / 10 ** decimals;
  } else if (typeof transfer.value === "number") {
    amount = transfer.value;
  }
  if (!(amount > 0) || !Number.isFinite(amount)) return null;
  const timestamp = transfer.metadata?.blockTimestamp;
  if (!timestamp) return null;
  return {
    source: "onchain",
    chain: chain.id,
    tx_hash: transfer.hash.toLowerCase(),
    log_index: parseLogIndex(transfer.uniqueId),
    block_number: parseInt(transfer.blockNum, 16),
    wallet: to,
    amount_usd: amount,
    paid_at: new Date(timestamp).toISOString(),
    requested_at: null,
  };
}

function resolveMethod(explicit: string | undefined, url: string): "transfers" | "logs" {
  const wanted = (explicit || process.env.INGEST_METHOD || "").trim().toLowerCase();
  if (wanted === "logs" || wanted === "transfers") {
    if (wanted === "transfers" && !isAlchemyRpc(url)) {
      console.warn("  alchemy_getAssetTransfers needs an Alchemy RPC; falling back to eth_getLogs");
      return "logs";
    }
    return wanted;
  }
  return isAlchemyRpc(url) ? "transfers" : "logs";
}

function initialLogChunk(url: string, chain: ChainConfig) {
  return isAlchemyRpc(url) ? GETLOGS_CHUNK_ALCHEMY : chain.logChunk;
}

export function estimateGetLogsBackfill(sinceIso = DEFAULT_SINCE) {
  const elapsedSec = Math.max(0, (Date.now() - Date.parse(sinceIso)) / 1000);
  const baseBlocks = elapsedSec / 2;
  const arbBlocks = elapsedSec / 0.25;
  const baseReqs = Math.ceil(baseBlocks / GETLOGS_CHUNK_ALCHEMY);
  const arbReqs = Math.ceil(arbBlocks / GETLOGS_CHUNK_ALCHEMY);
  const cu = (baseReqs + arbReqs) * 60 + 20;
  return { sinceIso, baseBlocks, arbBlocks, baseReqs, arbReqs, cu, pctOfMonthly: (cu / MONTHLY_FREE_CU) * 100 };
}

export function printCuEstimates(maxRequests: number, sinceIso = DEFAULT_SINCE) {
  const logs = estimateGetLogsBackfill(sinceIso);
  const transfersCapCu = maxRequests * 120;
  console.log("CU estimate (Alchemy free tier = 30,000,000 CU/month; 10% threshold = 3,000,000):");
  console.log(
    `  eth_getLogs since ${logs.sinceIso}: Base ~${Math.round(logs.baseBlocks).toLocaleString()} blocks → ${logs.baseReqs.toLocaleString()} req; ` +
      `Arbitrum ~${Math.round(logs.arbBlocks).toLocaleString()} blocks → ${logs.arbReqs.toLocaleString()} req; ` +
      `≈ ${Math.round(logs.cu).toLocaleString()} CU (${logs.pctOfMonthly.toFixed(1)}% of monthly). DO NOT run a getLogs backfill on the free tier.`,
  );
  console.log(
    `  alchemy_getAssetTransfers full sync: 120 CU/page (≤1000 transfers + timestamps). ` +
      `Hard cap ${maxRequests} requests ≈ ${transfersCapCu.toLocaleString()} CU ` +
      `(${((transfersCapCu / MONTHLY_FREE_CU) * 100).toFixed(2)}% of monthly), well under 10%.`,
  );
}

async function ingestViaTransfers(
  rpc: Rpc,
  chain: ChainConfig,
  fromBlock: number,
  toBlock: number,
  store: PayoutStore,
  onProgress: (upTo: number) => Promise<void>,
) {
  let pageKey: string | undefined;
  let inserted = 0;
  let pages = 0;
  let lastConsumed = fromBlock - 1;
  do {
    const params: Record<string, unknown> = {
      fromBlock: hex(fromBlock),
      toBlock: hex(toBlock),
      fromAddress: chain.payoutContract,
      category: ["erc20"],
      contractAddresses: [chain.usdc],
      excludeZeroValue: true,
      withMetadata: true,
      maxCount: TRANSFERS_PAGE,
      order: "asc",
    };
    if (pageKey) params.pageKey = pageKey;
    const result = await rpc.call<{ transfers?: AssetTransfer[]; pageKey?: string }>("alchemy_getAssetTransfers", [params]);
    const transfers = result.transfers ?? [];
    const rows: PayoutInsert[] = [];
    let skipped = 0;
    let maxBlock = 0;
    for (const transfer of transfers) {
      maxBlock = Math.max(maxBlock, parseInt(transfer.blockNum, 16) || 0);
      const row = transferToRow(chain, transfer);
      if (row) rows.push(row);
      else skipped += 1;
    }
    await store.upsert(rows);
    inserted += rows.length;
    pages += 1;
    pageKey = result.pageKey || undefined;
    lastConsumed = pageKey && maxBlock > 0 ? maxBlock - 1 : toBlock;
    await onProgress(lastConsumed);
    console.log(`[${chain.id}] transfers page ${pages}: +${rows.length} row(s) (running ${inserted}${skipped ? `, skipped ${skipped}` : ""})`);
  } while (pageKey);
  return { inserted, lastBlock: lastConsumed };
}

async function ingestChain(
  id: ChainId,
  store: PayoutStore,
  meter: RequestMeter,
  opts: IngestOpts,
): Promise<number> {
  const chain = CHAINS[id];
  const url = rpcUrlFor(id);
  const method = resolveMethod(opts.method, url);
  const rpc = new Rpc(url, meter);
  const shouldSaveCursor = opts.saveCursor ?? opts.maxBlocks == null;
  console.log(`[${id}] provider=${rpcProviderLabel(url)} method=${method} store=${store.kind} cap=${meter.maxRequests}`);

  const tip = parseInt(await rpc.call<string>("eth_blockNumber", []), 16) - chain.confirmations;
  if (tip < 0) throw new Error(`[${id}] tip below zero after confirmations`);

  const state = opts.maxBlocks ? null : await store.getCursor(id);
  let fromBlock: number;
  let lastBlock: number;
  let historyFrom: number;

  if (opts.maxBlocks && opts.maxBlocks > 0) {
    fromBlock = Math.max(0, tip - opts.maxBlocks + 1);
    lastBlock = fromBlock - 1;
    historyFrom = fromBlock;
    console.log(`[${id}] probe window: last ${opts.maxBlocks.toLocaleString()} confirmed blocks (${fromBlock} → ${tip})`);
  } else if (state) {
    historyFrom = Number(state.from_block);
    lastBlock = Number(state.last_block);
    fromBlock = lastBlock + 1;
    console.log(`[${id}] resume from block ${fromBlock} (cursor last_block=${lastBlock})`);
  } else if (method === "logs") {
    const sinceTs = Math.floor(new Date(opts.since ?? DEFAULT_SINCE).getTime() / 1000);
    console.log(`[${id}] first getLogs run, locating start block for ${new Date(sinceTs * 1000).toISOString()}`);
    fromBlock = await rpc.findBlockAtOrAfter(sinceTs, tip);
    const startTs = await rpc.blockTimestamp(fromBlock);
    if (startTs - sinceTs > 3600) {
      console.warn(`[${id}] this RPC's history starts at ${new Date(startTs * 1000).toISOString()}; set an archive RPC for older payouts`);
    }
    lastBlock = fromBlock - 1;
    historyFrom = fromBlock;
  } else {
    fromBlock = 0;
    lastBlock = -1;
    historyFrom = 0;
    if (opts.since) {
      console.log(`[${id}] --since is ignored for transfers (scans from block 0 or the saved cursor)`);
    }
  }

  let inserted = 0;
  let progressFrom = historyFrom;
  let progressLast = lastBlock;

  const persist = async (upTo: number) => {
    progressLast = upTo;
    if (shouldSaveCursor) {
      await store.saveCursor({
        chain: id,
        contract: chain.payoutContract,
        from_block: progressFrom,
        last_block: upTo,
      });
    }
  };

  const scanLogs = async (from: number, to: number, onProgress: (upTo: number) => Promise<void>) => {
    if (to < from) return;
    const total = to - from + 1;
    console.log(`[${id}] scanning logs ${from} → ${to} (${total.toLocaleString()} blocks)`);
    let chunk = initialLogChunk(url, chain);
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
        if (err instanceof RangeTooLargeError && chunk > 1) {
          chunk = Math.max(1, Math.floor(chunk / 2));
          console.log(`[${id}] range too large, chunk → ${chunk}`);
          continue;
        }
        throw err;
      }
      for (const log of logs) {
        const decoded = decode(chain, log);
        if (decoded) pending.push(decoded);
      }
      cursor = end + 1;
      chunks += 1;
      if (chunks % FLUSH_EVERY_CHUNKS === 0 || pending.length >= 2000 || cursor > to) {
        const rows = await toRows(rpc, id, pending);
        await store.upsert(rows);
        inserted += rows.length;
        pending = [];
        await onProgress(end);
        console.log(`[${id}] ${(((end - from + 1) / total) * 100).toFixed(1)}% · block ${end} · ${inserted} rows written`);
      }
    }
  };

  try {
    if (method === "transfers") {
      if (fromBlock <= tip) {
        const result = await ingestViaTransfers(rpc, chain, fromBlock, tip, store, persist);
        inserted += result.inserted;
        lastBlock = result.lastBlock;
      }
    } else {
      if (state && opts.since) {
        const sinceTs = Math.floor(new Date(opts.since).getTime() / 1000);
        const backfillFrom = await rpc.findBlockAtOrAfter(sinceTs, historyFrom);
        if (backfillFrom < historyFrom) {
          await scanLogs(backfillFrom, historyFrom - 1, async () => {});
          progressFrom = backfillFrom;
          historyFrom = backfillFrom;
          if (shouldSaveCursor) await store.saveCursor({ chain: id, contract: chain.payoutContract, from_block: historyFrom, last_block: lastBlock });
        }
      }
      await scanLogs(lastBlock + 1, tip, persist);
      lastBlock = Math.max(lastBlock, tip);
    }
    if (shouldSaveCursor) {
      await store.saveCursor({
        chain: id,
        contract: chain.payoutContract,
        from_block: progressFrom,
        last_block: Math.max(progressLast, tip),
      });
    }
    console.log(`[${id}] done through block ${Math.max(progressLast, tip)} (${inserted} rows written this run)`);
    return inserted;
  } catch (err) {
    if (err instanceof RequestCapError) {
      console.warn(`[${id}] ${err.message}`);
      if (shouldSaveCursor && progressLast >= progressFrom) {
        await store.saveCursor({
          chain: id,
          contract: chain.payoutContract,
          from_block: progressFrom,
          last_block: progressLast,
        });
      }
      return inserted;
    }
    throw err;
  }
}

export async function runIngest(opts: IngestOpts = {}) {
  const only = opts.chain as ChainId | undefined;
  if (only && !CHAIN_IDS.includes(only)) throw new Error(`unknown chain "${only}"`);
  const targets = only ? [only] : [...CHAIN_IDS];
  const cap = ingestMaxRequests(opts.maxRequests);
  const meter = new RequestMeter(cap);
  const store = openStore();
  printCuEstimates(cap, opts.since ?? DEFAULT_SINCE);
  console.log(`ingest start store=${store.kind} chains=${targets.join(",")} ${meter.summary()}`);

  let failed = false;
  let inserted = 0;
  for (const id of targets) {
    try {
      inserted += await ingestChain(id, store, meter, opts);
    } catch (err) {
      failed = true;
      console.error(`[${id}] failed:`, err);
    }
  }
  console.log(`ingest finish ${meter.summary()} rows=${inserted}`);

  // Rebuilding stats and expiring the site cache is the expensive part of a run.
  // Skip both when nothing new arrived, unless the stats are getting old.
  const statsAge = Date.now() - lastStatsRefreshAt;
  if (inserted > 0 || statsAge >= MAX_STATS_AGE_MS) {
    if (await refreshPayoutStats()) lastStatsRefreshAt = Date.now();
    await triggerRevalidate();
  } else {
    console.log(`no new payouts; stats refreshed ${Math.round(statsAge / 1000)}s ago, skipping refresh and revalidate`);
  }
  return !failed;
}
