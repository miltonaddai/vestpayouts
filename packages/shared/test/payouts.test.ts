import { test } from "node:test";
import assert from "node:assert/strict";
import { manualPayoutSchema } from "../src/payouts";

const tx = "0x" + "ab".repeat(32);
const wallet = "0x" + "12".repeat(20);

test("accepts a minimal row and coerces the amount", () => {
  const r = manualPayoutSchema.parse({ paid_at: "2026-11-01", amount_usd: "1500.25" });
  assert.equal(r.amount_usd, 1500.25);
  assert.equal(r.chain, undefined);
});

test("accepts a full row and trims strings", () => {
  const r = manualPayoutSchema.parse({
    paid_at: " 2026-11-01T14:30:00Z ",
    amount_usd: "20000",
    chain: " base ",
    tx_hash: tx,
    wallet,
    trader: " Alice ",
    proof_url: "https://example.com/proof",
    note: "",
  });
  assert.equal(r.paid_at, "2026-11-01T14:30:00Z");
  assert.equal(r.chain, "base");
  assert.equal(r.trader, "Alice");
  assert.equal(r.note, undefined, "blank optional fields become undefined");
});

test("treats blank optional columns from a CSV as missing", () => {
  const r = manualPayoutSchema.parse({ paid_at: "2026-11-01", amount_usd: "10", chain: "", tx_hash: "  ", wallet: "" });
  assert.equal(r.chain, undefined);
  assert.equal(r.tx_hash, undefined);
  assert.equal(r.wallet, undefined);
});

const rejects = (row: Record<string, unknown>, path: string) => {
  const res = manualPayoutSchema.safeParse({ paid_at: "2026-11-01", amount_usd: "10", ...row });
  assert.equal(res.success, false);
  assert.ok(
    res.error!.issues.some((i) => i.path.join(".") === path),
    `expected an issue on ${path}, got ${JSON.stringify(res.error!.issues.map((i) => i.path))}`,
  );
};

test("rejects bad dates and non-positive amounts", () => {
  rejects({ paid_at: "not a date" }, "paid_at");
  rejects({ amount_usd: "0" }, "amount_usd");
  rejects({ amount_usd: "-5" }, "amount_usd");
  rejects({ amount_usd: "abc" }, "amount_usd");
});

test("rejects malformed chain, hash, wallet and URL", () => {
  rejects({ chain: "solana" }, "chain");
  rejects({ chain: "base", tx_hash: "0x1234" }, "tx_hash");
  rejects({ wallet: "0xnotanaddress" }, "wallet");
  rejects({ proof_url: "not a url" }, "proof_url");
});

test("requires a chain when a tx hash is given", () => {
  rejects({ tx_hash: tx }, "chain");
});
