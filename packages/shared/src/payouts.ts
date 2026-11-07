import { z } from "zod";
import type { ChainId } from "./chains";

export type PayoutSource = "onchain" | "manual" | "sample";

export interface Payout {
  id: string;
  source: PayoutSource;
  chain: ChainId | null;
  txHash: string | null;
  logIndex: number | null;
  block: number | null;
  /** When the USDC left Vest (block time), unix ms. */
  paidAt: number;
  /** When the withdrawal was requested inside Vest, unix ms, if known. */
  requestedAt: number | null;
  wallet: string | null;
  walletLabel: string | null;
  amount: number;
  trader: string | null;
  proofUrl: string | null;
  note: string | null;
}

export type Period = "24h" | "7d" | "30d" | "all";
export const PERIODS: Period[] = ["24h", "7d", "30d", "all"];
export const PERIOD_LABEL: Record<Period, string> = {
  "24h": "Last 24 hours",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  all: "All time",
};

export interface WindowStats {
  amount: number;
  count: number;
  wallets: number;
  largest: Payout | null;
}

export interface Summary {
  windows: Record<Period, WindowStats>;
  medianAmount30d: number | null;
  medianProcessingHours: number | null;
  byChain: { chain: ChainId; amount: number; count: number }[];
  firstPaidAt: number | null;
  syncedAt: number | null;
  isSample: boolean;
}

export interface LeaderboardRow {
  key: string;
  wallet: string | null;
  label: string | null;
  total: number;
  count: number;
  largest: number;
  lastPaidAt: number;
}

export interface PayoutQuery {
  chain?: ChainId;
  min?: number;
  period?: Period;
  sort?: "latest" | "largest";
  q?: string;
  page?: number;
}

export interface PayoutPage {
  rows: Payout[];
  total: number;
  sum: number;
  page: number;
  pages: number;
}

export interface WalletProfile {
  address: string;
  label: string | null;
  xHandle: string | null;
  payouts: Payout[];
  amount: number;
  count: number;
  largest: Payout | null;
}

export interface ChainCoverage {
  chain: ChainId;
  contract: string;
  fromBlock: number;
  lastBlock: number;
  updatedAt: string;
}

const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? undefined : typeof v === "string" ? v.trim() : v), schema.optional());

/** Row schema for CSV imports (API admin and `yarn payouts:import`). */
export const manualPayoutSchema = z
  .object({
    paid_at: z.string().trim().refine((v) => !Number.isNaN(Date.parse(v)), "paid_at must be a date like 2026-11-01 or 2026-11-01T14:30:00Z"),
    amount_usd: z.coerce.number().positive("amount_usd must be > 0"),
    chain: optional(z.enum(["base", "arbitrum"])),
    tx_hash: optional(z.string().regex(/^0x[0-9a-fA-F]{64}$/, "tx_hash must be a 0x-prefixed 32-byte hash")),
    wallet: optional(z.string().regex(/^0x[0-9a-fA-F]{40}$/, "wallet must be a 0x address")),
    trader: optional(z.string().max(80)),
    proof_url: optional(z.url()),
    note: optional(z.string().max(500)),
  })
  .refine((r) => !r.tx_hash || r.chain, { message: "chain is required when tx_hash is set", path: ["chain"] });

export type ManualPayoutInput = z.infer<typeof manualPayoutSchema>;

export const MANUAL_CSV_HEADER = ["paid_at", "amount_usd", "chain", "tx_hash", "wallet", "trader", "proof_url", "note"] as const;
