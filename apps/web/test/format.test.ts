import { test } from "node:test";
import assert from "node:assert/strict";
import { formatDate, formatDuration, formatUsd, formatUsdCompact, shortAddress, timeAgo } from "../src/lib/format";

test("formatUsd rounds to dollars or shows cents", () => {
  assert.equal(formatUsd(1234.5), "$1,235");
  assert.equal(formatUsd(1234.5, true), "$1,234.50");
  assert.equal(formatUsdCompact(1_250_000), "$1.3M");
});

test("shortAddress", () => {
  assert.equal(shortAddress("0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9f3e"), "0x1a2b…9f3e");
  assert.equal(shortAddress("0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9f3e", 6), "0x1a2b3c…8f9f3e");
  assert.equal(shortAddress(null), "—");
});

test("formatDate is always in UTC", () => {
  assert.equal(formatDate(Date.parse("2026-11-01T23:30:00Z")), "Nov 1, 2026");
});

test("timeAgo rounds down at each unit boundary", () => {
  const now = Date.parse("2026-11-10T12:00:00Z");
  const ago = (seconds: number) => timeAgo(now - seconds * 1000, now);
  assert.equal(ago(0), "0s ago");
  assert.equal(ago(59), "59s ago");
  assert.equal(ago(60), "1m ago");
  assert.equal(ago(3599), "59m ago");
  assert.equal(ago(3600), "1h ago");
  assert.equal(ago(86_399), "23h ago");
  assert.equal(ago(86_400), "1d ago");
  assert.equal(ago(59 * 86_400), "59d ago");
  assert.equal(ago(60 * 86_400), "2mo ago");
  assert.equal(timeAgo(now + 5000, now), "0s ago", "future times clamp to zero");
});

test("formatDuration picks minutes, hours or days", () => {
  assert.equal(formatDuration(0.001), "1 min");
  assert.equal(formatDuration(0.5), "30 min");
  assert.equal(formatDuration(2.25), "2.3 h");
  assert.equal(formatDuration(12), "12 h");
  assert.equal(formatDuration(72), "3.0 days");
});
