/**
 * Copy data/onchain-store.json into Supabase.
 * Does not call Alchemy or scan the chain — it only upserts existing rows
 * and ingest cursors so a later `yarn ingest` can resume incrementally.
 */
import type { ChainId, PayoutInsert } from "@vestpayouts/shared";
import { serviceClient, triggerRevalidate } from "./env";
import { LOCAL_STORE_REL, readLocalStore, type LocalPayout } from "./local-store";

const BATCH = 500;
const TX = /^0x[0-9a-f]{64}$/;
const ADDR = /^0x[0-9a-f]{40}$/;
const CHAINS = new Set<string>(["base", "arbitrum"]);

function toInsert(p: LocalPayout): PayoutInsert | null {
  const chain = p.chain;
  const txHash = (p.tx_hash || "").toLowerCase();
  const wallet = (p.wallet || "").toLowerCase();
  const amount = Number(p.amount_usd);
  if (!CHAINS.has(chain)) return null;
  if (!TX.test(txHash)) return null;
  if (!ADDR.test(wallet)) return null;
  if (!Number.isFinite(amount) || amount <= 0) return null;
  if (!p.paid_at) return null;
  const logIndex = Number(p.log_index);
  const blockNumber = Number(p.block_number);
  if (!Number.isInteger(logIndex) || !Number.isInteger(blockNumber)) return null;
  return {
    source: "onchain",
    chain,
    tx_hash: txHash,
    log_index: logIndex,
    block_number: blockNumber,
    wallet,
    amount_usd: amount,
    paid_at: p.paid_at,
    requested_at: p.requested_at ?? null,
    trader_name: p.trader_name ?? null,
    proof_url: p.proof_url ?? null,
    note: p.note ?? null,
    published: true,
  };
}

export async function importLocalStoreToSupabase() {
  const store = readLocalStore();
  const cursors = Object.values(store.ingest_state || {});
  if (!cursors.length) {
    throw new Error(
      "Local store has no ingest_state cursors; refusing to import because a later ingest would scan from block 0.",
    );
  }

  const db = serviceClient();
  const rows: PayoutInsert[] = [];
  let skipped = 0;
  const aliases = new Map<string, string>();

  for (const p of store.payouts) {
    const row = toInsert(p);
    if (!row) {
      skipped += 1;
      continue;
    }
    rows.push(row);
    const label = (p.wallet_label || "").trim().slice(0, 60);
    if (label && row.wallet) aliases.set(row.wallet, label);
  }

  console.log(`import-local: ${rows.length} payout(s) from ${LOCAL_STORE_REL} (${skipped} skipped)`);
  console.log(`import-local: ${cursors.length} ingest cursor(s), ${aliases.size} wallet alias(es)`);

  let upserted = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    const { error } = await db.from("payouts").upsert(chunk, {
      onConflict: "chain,tx_hash,log_index",
      ignoreDuplicates: true,
    });
    if (error) throw new Error(`payout upsert failed at ${i}: ${error.message}`);
    upserted += chunk.length;
    if (upserted % 2000 === 0 || upserted === rows.length) {
      console.log(`import-local: payouts ${upserted}/${rows.length}`);
    }
  }

  const aliasRows = [...aliases.entries()].map(([address, display_name]) => ({ address, display_name }));
  for (let i = 0; i < aliasRows.length; i += BATCH) {
    const { error } = await db.from("wallets").upsert(aliasRows.slice(i, i + BATCH));
    if (error) throw new Error(`wallet upsert failed: ${error.message}`);
  }

  for (const cursor of cursors) {
    const { error } = await db.from("ingest_state").upsert({
      chain: cursor.chain as ChainId,
      contract: cursor.contract,
      from_block: cursor.from_block,
      last_block: cursor.last_block,
      updated_at: cursor.updated_at || new Date().toISOString(),
    });
    if (error) throw new Error(`ingest_state upsert failed for ${cursor.chain}: ${error.message}`);
    console.log(`import-local: cursor ${cursor.chain} last_block=${cursor.last_block}`);
  }

  const { count, error: countError } = await db.from("payouts").select("id", { count: "exact", head: true });
  if (countError) throw new Error(`count failed: ${countError.message}`);

  const { data: stateRows, error: stateError } = await db
    .from("ingest_state")
    .select("chain,last_block,from_block,updated_at")
    .order("chain");
  if (stateError) throw new Error(`ingest_state read failed: ${stateError.message}`);

  const { data: summary, error: summaryError } = await db.rpc("payout_summary");
  if (summaryError) throw new Error(`payout_summary failed: ${summaryError.message}`);

  console.log(`import-local: supabase payouts count=${count}`);
  console.log(`import-local: supabase ingest_state=${JSON.stringify(stateRows)}`);
  console.log(`import-local: payout_summary=${JSON.stringify(summary)}`);

  await triggerRevalidate();
  return { local: rows.length, skipped, aliases: aliases.size, supabaseCount: count ?? 0, cursors: stateRows, summary };
}
