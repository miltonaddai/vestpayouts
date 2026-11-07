/**
 * Types for the VestPayouts Supabase schema (supabase/migrations). Kept in the same shape as
 * `supabase gen types typescript`; regenerate with `yarn db:types` (writes this file).
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type PayoutSource = "onchain" | "manual" | "sample";
type PayoutChain = "base" | "arbitrum";

export interface Database {
  public: {
    Tables: {
      payouts: {
        Row: {
          id: number;
          source: PayoutSource;
          chain: PayoutChain | null;
          tx_hash: string | null;
          log_index: number | null;
          block_number: number | null;
          wallet: string | null;
          amount_usd: number;
          paid_at: string;
          requested_at: string | null;
          trader_name: string | null;
          proof_url: string | null;
          note: string | null;
          published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: never;
          source: PayoutSource;
          chain?: PayoutChain | null;
          tx_hash?: string | null;
          log_index?: number | null;
          block_number?: number | null;
          wallet?: string | null;
          amount_usd: number;
          paid_at: string;
          requested_at?: string | null;
          trader_name?: string | null;
          proof_url?: string | null;
          note?: string | null;
          published?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["payouts"]["Insert"]>;
        Relationships: [];
      };
      wallets: {
        Row: {
          address: string;
          display_name: string;
          x_handle: string | null;
          url: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          address: string;
          display_name: string;
          x_handle?: string | null;
          url?: string | null;
          notes?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["wallets"]["Insert"]>;
        Relationships: [];
      };
      ingest_state: {
        Row: { chain: PayoutChain; contract: string; from_block: number; last_block: number; updated_at: string };
        Insert: { chain: PayoutChain; contract: string; from_block: number; last_block: number; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["ingest_state"]["Insert"]>;
        Relationships: [];
      };

      payout_stats: {
        Row: { id: number; summary: Json; refreshed_at: string };
        Insert: { id?: number; summary?: Json; refreshed_at?: string };
        Update: Partial<Database["public"]["Tables"]["payout_stats"]["Insert"]>;
        Relationships: [];
      };
      payout_daily_stats: {
        Row: { day: string; amount: number; payouts: number };
        Insert: { day: string; amount?: number; payouts?: number };
        Update: Partial<Database["public"]["Tables"]["payout_daily_stats"]["Insert"]>;
        Relationships: [];
      };
      payout_leaderboard_stats: {
        Row: {
          period: string;
          wallet: string | null;
          label: string | null;
          total: number;
          payouts: number;
          largest: number;
          last_paid_at: string;
          rank: number;
        };
        Insert: {
          period: string;
          wallet?: string | null;
          label?: string | null;
          total: number;
          payouts: number;
          largest: number;
          last_paid_at: string;
          rank: number;
        };
        Update: Partial<Database["public"]["Tables"]["payout_leaderboard_stats"]["Insert"]>;
        Relationships: [];
      };
      referral_clicks: {
        Row: {
          id: number;
          created_at: string;
          placement: string;
          from_path: string | null;
          referer: string | null;
          user_agent: string | null;
          country: string | null;
        };
        Insert: {
          placement: string;
          from_path?: string | null;
          referer?: string | null;
          user_agent?: string | null;
          country?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["referral_clicks"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: {
      visible_payouts: {
        Row: {
          id: number;
          source: PayoutSource;
          chain: PayoutChain | null;
          tx_hash: string | null;
          log_index: number | null;
          block_number: number | null;
          wallet: string | null;
          amount_usd: number;
          paid_at: string;
          requested_at: string | null;
          trader_name: string | null;
          proof_url: string | null;
          note: string | null;
          wallet_label: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      payout_summary: { Args: Record<PropertyKey, never>; Returns: Json };
      refresh_payout_stats: { Args: Record<PropertyKey, never>; Returns: Json };
      payout_daily: { Args: { days?: number }; Returns: { day: string; amount: number; payouts: number }[] };
      payout_leaderboard: {
        Args: { period?: string; max_rows?: number };
        Returns: {
          wallet: string | null;
          label: string | null;
          total: number;
          payouts: number;
          largest: number;
          last_paid_at: string;
        }[];
      };
      payout_search_totals: {
        Args: { p_chain?: string | null; p_min?: number | null; p_period?: string; p_q?: string | null };
        Returns: { payouts: number; amount: number }[];
      };
      payout_percentile: { Args: { amount: number }; Returns: number };
      period_start: { Args: { period: string }; Returns: string };
    };
    Enums: { payout_source: PayoutSource; payout_chain: PayoutChain };
    CompositeTypes: Record<string, never>;
  };
}

export type PayoutRow = Database["public"]["Views"]["visible_payouts"]["Row"];
export type PayoutInsert = Database["public"]["Tables"]["payouts"]["Insert"];
