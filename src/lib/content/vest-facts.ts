/**
 * Facts about Vest used across guides. Re-check against the sources before each content
 * refresh; Vest changes pricing and rules without notice.
 */
export const VEST_FACTS_CHECKED = "2026-11-05";

export const VEST_SOURCES = {
  home: "https://www.vestmarkets.com/",
  docs: "https://docs.vestmarkets.com/",
  capital: "https://docs.vestmarkets.com/vest-capital/overview",
  tiers: "https://docs.vestmarkets.com/vest-capital/account-tiers",
  claim: "https://docs.vestmarkets.com/vest-capital/claiming-profit",
  withdrawals: "https://docs.vestmarkets.com/platform/withdrawals",
  lossLimits: "https://docs.vestmarkets.com/vest-capital/loss-limits",
  terms: "https://next.vestmarkets.com/prop-terms-of-service",
  x: "https://x.com/vestexchange",
  discord: "https://discord.com/invite/vestmarkets",
} as const;

export const INSTANT_ACCOUNTS = [
  { capital: 500, fee: 10, maxDrawdown: 10 },
  { capital: 5_000, fee: 200, maxDrawdown: 200 },
  { capital: 10_000, fee: 400, maxDrawdown: 400 },
  { capital: 25_000, fee: 1_000, maxDrawdown: 1_000 },
] as const;

export const EVAL_TIERS = [
  { tier: "Silver", capital: 5_000, maxDrawdown: 300, twoStepFee: 15, oneStepFrom: 25 },
  { tier: "Gold", capital: 10_000, maxDrawdown: 600, twoStepFee: 35, oneStepFrom: 50 },
  { tier: "Platinum", capital: 25_000, maxDrawdown: 1_500, twoStepFee: 90, oneStepFrom: 130 },
] as const;

export const SPLITS = { instant: 95, evalBase: 80, evalUpgrade: 90 } as const;
