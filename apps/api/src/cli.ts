import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { argValue, hasFlag, repoRoot, serviceClient, triggerRevalidate } from "./env";
import { importManualPayouts, validateCsv } from "./import-payouts";
import { runIngest } from "./ingest";
import { writeSeedSql } from "./seed-sql";

const [command, ...rest] = process.argv.slice(2);

function num(value: string | undefined) {
  if (value == null || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

async function ingest() {
  const ok = await runIngest({
    chain: argValue(rest, "--chain"),
    since: argValue(rest, "--since"),
    maxBlocks: num(argValue(rest, "--max-blocks")),
    method: argValue(rest, "--method"),
    maxRequests: num(argValue(rest, "--max-requests")),
    saveCursor: hasFlag(rest, "--save-cursor") ? true : undefined,
  });
  process.exit(ok ? 0 : 1);
}

async function importCsv() {
  const fileArg = rest.find((a) => !a.startsWith("--"));
  if (!fileArg) {
    console.error("usage: yarn payouts:import <file.csv> [--dry-run]");
    process.exit(1);
  }
  const file = existsSync(fileArg) ? fileArg : path.resolve(repoRoot, fileArg);
  const { valid, errors } = validateCsv(await readFile(file, "utf8"));
  for (const e of errors) console.error(`line ${e.line}: ${e.message}`);
  console.log(`${valid.length} valid row(s), ${errors.length} invalid`);
  if (errors.length) process.exit(1);
  if (hasFlag(rest, "--dry-run") || !valid.length) return;
  const report = await importManualPayouts(serviceClient(), valid.map((v) => v.row));
  console.log(`inserted ${report.inserted} manual payout(s), enriched ${report.enriched} on-chain payout(s)`);
  await triggerRevalidate();
}

async function main() {
  if (command === "ingest") return ingest();
  if (command === "import") return importCsv();
  if (command === "seed-sql") return writeSeedSql();
  console.error("usage: tsx src/cli.ts <ingest|import|seed-sql>");
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
