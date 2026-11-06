/**
 * Import manually reported payouts from a CSV file into Supabase.
 *
 *   yarn payouts:import data/payouts.example.csv            # validate + write
 *   yarn payouts:import my.csv --dry-run                    # validate only
 *
 * Columns: paid_at,amount_usd,chain,tx_hash,wallet,trader,proof_url,note
 * (only paid_at and amount_usd are required; see data/payouts.example.csv)
 */
import { readFile } from "node:fs/promises";
import { importManualPayouts, validateCsv } from "../src/lib/payouts/import";
import { hasFlag, serviceClient, triggerRevalidate } from "./lib/env";

async function main() {
  const file = process.argv.slice(2).find((a) => !a.startsWith("--"));
  if (!file) {
    console.error("usage: yarn payouts:import <file.csv> [--dry-run]");
    process.exit(1);
  }
  const { valid, errors } = validateCsv(await readFile(file, "utf8"));
  for (const e of errors) console.error(`line ${e.line}: ${e.message}`);
  console.log(`${valid.length} valid row(s), ${errors.length} invalid`);
  if (errors.length) process.exit(1);
  if (hasFlag("--dry-run") || !valid.length) return;

  const report = await importManualPayouts(serviceClient(), valid.map((v) => v.row));
  console.log(`inserted ${report.inserted} manual payout(s), enriched ${report.enriched} on-chain payout(s)`);
  await triggerRevalidate();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
