import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";
import { bigText, heatTier, roundupText, roundupWindow, tierArtPath, type BigPayout } from "../src/social/poster";

const site = "https://vestpayouts.com";
const tx = "0x" + "ab".repeat(32);

const payout = (over: Partial<BigPayout> = {}): BigPayout => ({
  id: 1,
  amount: 23_450.87,
  chain: "arbitrum",
  txHash: tx,
  wallet: "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9f3e",
  name: null,
  rank: 14,
  ...over,
});

test("heatTier maps amounts onto the 10 tiers", () => {
  assert.equal(heatTier(9_999.99), 0);
  assert.equal(heatTier(10_000), 1);
  assert.equal(heatTier(14_999), 1);
  assert.equal(heatTier(15_000), 2);
  assert.equal(heatTier(99_999), 7);
  assert.equal(heatTier(100_000), 8);
  assert.equal(heatTier(250_000), 10);
  assert.equal(heatTier(5_000_000), 10);
});

test("every tier has its art file", () => {
  assert.equal(tierArtPath(5_000), null);
  for (const amount of [10_000, 15_000, 20_000, 30_000, 40_000, 50_000, 75_000, 100_000, 150_000, 250_000]) {
    const file = tierArtPath(amount);
    assert.ok(file && existsSync(file), `missing art for $${amount}`);
    assert.equal(path.basename(file), `tier-${String(heatTier(amount)).padStart(2, "0")}.jpg`);
  }
});

test("big payout post: normal format", () => {
  assert.equal(
    bigText(payout(), { linkBig: true, site }),
    [
      "🚨 $23,451 Vest payout",
      "",
      "0x1a2b…9f3e was just paid $23,450.87 USDC on Arbitrum One, the 14th largest @vestexchange payout on record.",
      "",
      "🔥 Heat 03/10 · Flame: someone open a window",
      "",
      `Proof: ${site}/payouts/arbitrum/${tx}`,
    ].join("\n"),
  );
});

test("big payout post: new record format", () => {
  const text = bigText(payout({ amount: 182_000, chain: "base", name: "TraderName", rank: 1 }), { linkBig: true, site });
  assert.match(text, /^🏆 New record: \$182,000 Vest payout\n/);
  assert.match(text, /TraderName was just paid \$182,000\.00 USDC on Base\. That's the largest @vestexchange payout ever recorded\./);
  assert.match(text, /🔥 Heat 09\/10/);
});

test("big payout post: ordinals", () => {
  const phrase = (rank: number) => bigText(payout({ rank }), { linkBig: false, site }).match(/the (\S+) largest/)?.[1];
  assert.equal(phrase(2), "2nd");
  assert.equal(phrase(3), "3rd");
  assert.equal(phrase(11), "11th");
  assert.equal(phrase(12), "12th");
  assert.equal(phrase(13), "13th");
  assert.equal(phrase(21), "21st");
  assert.equal(phrase(22), "22nd");
  assert.equal(phrase(100), "100th");
});

test("big payout post: rank phrase is dropped outside the top 100", () => {
  const text = bigText(payout({ rank: 101 }), { linkBig: true, site });
  assert.match(text, /on Arbitrum One\.\n/);
  assert.doesNotMatch(text, /largest/);
});

test("big payout post: falls back when name, wallet, link or tier are missing", () => {
  const text = bigText(payout({ wallet: null, txHash: null, amount: 9_000, rank: 500 }), { linkBig: true, site });
  assert.match(text, /^🚨 \$9,000 Vest payout\n\nA Vest trader was just paid/);
  assert.doesNotMatch(text, /Proof:/);
  assert.doesNotMatch(text, /Heat/);
  assert.doesNotMatch(bigText(payout(), { linkBig: false, site }), /Proof:/);
});

test("big payout posts stay within X's 280 character limit", () => {
  // X counts each URL as 23 characters and emoji as 2.
  const xLength = (s: string) => [...s.replace(/https?:\/\/\S+/g, "x".repeat(23))].reduce((n, ch) => n + (ch.codePointAt(0)! > 0xffff ? 2 : 1), 0);
  for (const amount of [10_000, 99_999.99, 250_000]) {
    for (const rank of [1, 2, 100, 101]) {
      const text = bigText(payout({ amount, rank, name: "A Pretty Long Display Name Here" }), { linkBig: true, site });
      assert.ok(xLength(text) <= 280, `too long (${xLength(text)}):\n${text}`);
    }
  }
});

test("roundup post format", () => {
  const text = roundupText(
    {
      start: new Date("2026-11-10T14:00:00Z"),
      end: new Date("2026-11-10T14:30:00Z"),
      total: 12_345.6,
      count: 1,
      wallets: 1,
      largest: { amount: 9_000, wallet: null, chain: "base", name: null },
    },
    { linkRoundups: true, site },
  );
  assert.equal(
    text,
    [
      "💸 $12,346 paid to Vest traders in the last 30 minutes",
      "",
      "1 payout · 1 wallet",
      "Largest: $9,000 to a trader on Base",
      "",
      "14:00–14:30 UTC",
      `${site}/payouts`,
    ].join("\n"),
  );
});

test("roundupWindow picks the last 30-minute window that closed at least `lag` ago", () => {
  const at = (iso: string) => Date.parse(iso);
  const lag = 10 * 60_000;
  const w = roundupWindow(at("2026-11-10T14:45:00Z"), lag);
  assert.equal(w.start.toISOString(), "2026-11-10T14:00:00.000Z");
  assert.equal(w.end.toISOString(), "2026-11-10T14:30:00.000Z");
  // At 14:39 the 14:00–14:30 window is only 9 minutes old, so it waits.
  assert.equal(roundupWindow(at("2026-11-10T14:39:00Z"), lag).end.toISOString(), "2026-11-10T14:00:00.000Z");
});
