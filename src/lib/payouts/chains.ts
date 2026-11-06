export type ChainId = "base" | "arbitrum";

export interface ChainConfig {
  id: ChainId;
  name: string;
  /** Vest's payout (withdrawal) contract that sends USDC to trader wallets. */
  payoutContract: `0x${string}`;
  usdc: `0x${string}`;
  explorer: string;
  explorerName: string;
  defaultRpc: string;
  rpcEnv: string;
  /** Max block span per eth_getLogs request the default public RPC accepts. */
  logChunk: number;
  confirmations: number;
}

/** keccak topic0 of the event Vest's payout contract emits for every USDC withdrawal. */
export const PAYOUT_EVENT_TOPIC =
  "0x4bd6ed09a0f43383f998beb71712934b2b3091b8fa094ba5c8e844f426474148";

/** EOA that submits payout transactions on both chains (useful for verification). */
export const VEST_PAYOUT_RELAYER = "0x2cea8ffefcc17a7098445ee0a5cf3230d5b893d2";

export const CHAINS: Record<ChainId, ChainConfig> = {
  base: {
    id: "base",
    name: "Base",
    payoutContract: "0x55133c825603e6a5b9e911abab23e75dc3bb07af",
    usdc: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
    explorer: "https://basescan.org",
    explorerName: "BaseScan",
    defaultRpc: "https://base-rpc.publicnode.com",
    rpcEnv: "BASE_RPC_URL",
    logChunk: 50_000,
    confirmations: 300,
  },
  arbitrum: {
    id: "arbitrum",
    name: "Arbitrum One",
    payoutContract: "0xb2f86eae1197032fa85389cc6c0f3b06b58dd1ea",
    usdc: "0xaf88d065e77c8cc2239327c5edb3a432268e5831",
    explorer: "https://arbiscan.io",
    explorerName: "Arbiscan",
    defaultRpc: "https://arb1.arbitrum.io/rpc",
    rpcEnv: "ARBITRUM_RPC_URL",
    logChunk: 1_000_000,
    confirmations: 400,
  },
};

export const CHAIN_IDS = Object.keys(CHAINS) as ChainId[];

export function txUrl(chain: ChainId, tx: string) {
  return `${CHAINS[chain].explorer}/tx/${tx}`;
}

export function addressUrl(chain: ChainId, address: string) {
  return `${CHAINS[chain].explorer}/address/${address}`;
}
