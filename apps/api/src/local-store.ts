/**
 * File-backed payout store used when Supabase is not configured.
 * Written by the API ingest; read by the Next.js app in apps/web.
 * Path: <repo>/data/onchain-store.json (gitignored).
 */
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { ChainId, PayoutInsert } from "@vestpayouts/shared";
import { repoRoot } from "./env";

export const LOCAL_STORE_REL = path.join("data", "onchain-store.json");

export function localStorePath() {
  return process.env.LOCAL_PAYOUTS_PATH?.trim() || path.join(repoRoot, LOCAL_STORE_REL);
}

export interface LocalPayout {
  id: number;
  source: "onchain";
  chain: ChainId;
  tx_hash: string;
  log_index: number;
  block_number: number;
  wallet: string;
  amount_usd: number;
  paid_at: string;
  requested_at: string | null;
  trader_name: string | null;
  proof_url: string | null;
  note: string | null;
  published: true;
  created_at: string;
  updated_at: string;
  wallet_label: string | null;
}

export interface LocalIngestState {
  chain: ChainId;
  contract: string;
  from_block: number;
  last_block: number;
  updated_at: string;
}

export interface LocalStoreFile {
  version: 1;
  nextId: number;
  updatedAt: string;
  payouts: LocalPayout[];
  ingest_state: Record<string, LocalIngestState>;
}

function empty(): LocalStoreFile {
  return { version: 1, nextId: 1, updatedAt: new Date().toISOString(), payouts: [], ingest_state: {} };
}

export function readLocalStore(): LocalStoreFile {
  const file = localStorePath();
  if (!existsSync(file)) return empty();
  try {
    const parsed = JSON.parse(readFileSync(file, "utf8")) as LocalStoreFile;
    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.payouts)) return empty();
    return parsed;
  } catch {
    return empty();
  }
}

export function writeLocalStore(store: LocalStoreFile) {
  const file = localStorePath();
  mkdirSync(path.dirname(file), { recursive: true });
  store.updatedAt = new Date().toISOString();
  const tmp = `${file}.tmp`;
  writeFileSync(tmp, `${JSON.stringify(store, null, 2)}\n`, "utf8");
  renameSync(tmp, file);
}

function keyOf(chain: string, tx: string, logIndex: number) {
  return `${chain}:${tx}:${logIndex}`;
}

export function upsertLocalPayouts(rows: PayoutInsert[]) {
  if (!rows.length) return 0;
  const store = readLocalStore();
  const index = new Map(store.payouts.map((row, i) => [keyOf(row.chain, row.tx_hash, row.log_index), i]));
  const now = new Date().toISOString();
  let written = 0;
  for (const row of rows) {
    if (!row.chain || !row.tx_hash || row.log_index == null) continue;
    const key = keyOf(row.chain, row.tx_hash, row.log_index);
    const existing = index.get(key);
    if (existing != null) {
      const prev = store.payouts[existing];
      store.payouts[existing] = {
        ...prev,
        source: "onchain",
        chain: row.chain,
        tx_hash: row.tx_hash,
        log_index: row.log_index,
        block_number: row.block_number ?? prev.block_number,
        wallet: row.wallet ?? prev.wallet,
        amount_usd: row.amount_usd,
        paid_at: row.paid_at,
        requested_at: row.requested_at ?? prev.requested_at,
        published: true,
        updated_at: now,
      };
    } else {
      const created: LocalPayout = {
        id: store.nextId++,
        source: "onchain",
        chain: row.chain,
        tx_hash: row.tx_hash,
        log_index: row.log_index,
        block_number: row.block_number ?? 0,
        wallet: (row.wallet || "").toLowerCase(),
        amount_usd: row.amount_usd,
        paid_at: row.paid_at,
        requested_at: row.requested_at ?? null,
        trader_name: null,
        proof_url: null,
        note: null,
        published: true,
        created_at: now,
        updated_at: now,
        wallet_label: null,
      };
      index.set(key, store.payouts.length);
      store.payouts.push(created);
    }
    written += 1;
  }
  writeLocalStore(store);
  return written;
}

export function getLocalCursor(chain: ChainId): LocalIngestState | null {
  return readLocalStore().ingest_state[chain] ?? null;
}

export function saveLocalCursor(state: LocalIngestState) {
  const store = readLocalStore();
  store.ingest_state[state.chain] = state;
  writeLocalStore(store);
}
