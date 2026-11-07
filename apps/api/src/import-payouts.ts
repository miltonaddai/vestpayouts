import type { SupabaseClient } from "@supabase/supabase-js";
import { manualPayoutSchema, parseCsv, type Database, type ManualPayoutInput, type PayoutInsert } from "@vestpayouts/shared";

type Db = SupabaseClient<Database>;

export interface ImportReport {
  inserted: number;
  enriched: number;
  errors: { line: number; message: string }[];
}

export function validateCsv(text: string) {
  const valid: { line: number; row: ManualPayoutInput }[] = [];
  const errors: ImportReport["errors"] = [];
  parseCsv(text).forEach((raw, i) => {
    const line = i + 2;
    const parsed = manualPayoutSchema.safeParse(raw);
    if (parsed.success) valid.push({ line, row: parsed.data });
    else errors.push({ line, message: parsed.error.issues.map((x) => `${x.path.join(".") || "row"}: ${x.message}`).join("; ") });
  });
  return { valid, errors };
}

/**
 * Writes manual payouts with the service-role client. Rows whose tx_hash matches an
 * already-ingested on-chain payout enrich that row (trader name, proof link, note)
 * instead of creating a duplicate.
 */
export async function importManualPayouts(db: Db, rows: ManualPayoutInput[]): Promise<ImportReport> {
  const report: ImportReport = { inserted: 0, enriched: 0, errors: [] };
  const inserts: PayoutInsert[] = [];
  for (const r of rows) {
    if (r.tx_hash && r.chain) {
      const { data, error } = await db
        .from("payouts")
        .update({
          ...(r.trader ? { trader_name: r.trader } : {}),
          ...(r.proof_url ? { proof_url: r.proof_url } : {}),
          ...(r.note ? { note: r.note } : {}),
        })
        .eq("source", "onchain")
        .eq("chain", r.chain)
        .eq("tx_hash", r.tx_hash.toLowerCase())
        .select("id");
      if (error) throw new Error(error.message);
      if (data.length) {
        report.enriched += data.length;
        continue;
      }
    }
    inserts.push({
      source: "manual",
      chain: r.chain ?? null,
      tx_hash: r.tx_hash?.toLowerCase() ?? null,
      wallet: r.wallet?.toLowerCase() ?? null,
      amount_usd: r.amount_usd,
      paid_at: new Date(r.paid_at).toISOString(),
      trader_name: r.trader ?? null,
      proof_url: r.proof_url ?? null,
      note: r.note ?? null,
    });
  }
  if (inserts.length) {
    const { error } = await db.from("payouts").insert(inserts);
    if (error) throw new Error(error.message);
    report.inserted = inserts.length;
  }
  return report;
}
