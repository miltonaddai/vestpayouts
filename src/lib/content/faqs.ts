export interface Faq {
  q: string;
  a: string;
}

export const PAYOUT_FAQS: Faq[] = [
  {
    q: "Does Vest actually pay out?",
    a: "Yes. Vest sends payouts as USDC from public payout contracts on Base and Arbitrum One, so anyone can check them on a block explorer. VestPayouts reads those contracts directly and lists every transfer with its transaction hash, so you can verify each payout yourself instead of trusting screenshots.",
  },
  {
    q: "How long do Vest payouts take?",
    a: "Getting paid is two steps. A Claim Profit request moves your profit split from the Funded Account to your Primary Account; Vest's docs say that takes up to 24 hours. A withdrawal then sends USDC from the Primary Account to your wallet; the docs currently list a 24-hour processing period too. VestPayouts measures how long the on-chain step really takes, from request to settlement, and shows the median on the home page.",
  },
  {
    q: "What profit split does Vest pay?",
    a: "Instant Accounts pay a flat 95% split. Accounts that go through an evaluation pay 80% by default, or 90% if you buy the higher split at checkout. The split is fixed when you buy and doesn't change once the account is live.",
  },
  {
    q: "Which blockchain does Vest pay out on?",
    a: "Email and Google accounts can withdraw USDC on Base or Arbitrum One. Wallet-connected accounts see the chains available on the withdrawal screen. Nearly all payouts we track settle on Base and Arbitrum.",
  },
  {
    q: "Is there a minimum or maximum Vest payout?",
    a: "Vest's minimum withdrawal is 1 USDC. Claim Profit has no cap on how often or how much you claim. Withdrawals over a rolling $50,000 in 24 hours are subject to an additional 24-hour processing period.",
  },
  {
    q: "How do I verify a Vest payout is real?",
    a: "Open the payout's transaction on BaseScan or Arbiscan. A genuine Vest payout is a USDC transfer sent from Vest's payout contract (0x5513…07af on Base, 0xb2f8…d1ea on Arbitrum) to the trader's wallet. Every payout page on VestPayouts links straight to that transaction.",
  },
  {
    q: "Is VestPayouts run by Vest?",
    a: "No. VestPayouts is independent and not affiliated with or endorsed by Vest. We read public blockchain data and publish it. Some links are referral links, which is how the site is funded. That never changes the data we show.",
  },
  {
    q: "Are all the payouts listed here prop-firm profits?",
    a: "Not necessarily. On-chain, a Vest Capital profit withdrawal looks the same as any other withdrawal from a Vest Primary Account, so the feed also includes withdrawals of regular exchange balances. We call them Vest payouts because every one is real USDC leaving Vest for a trader's wallet. See our methodology for details.",
  },
];
