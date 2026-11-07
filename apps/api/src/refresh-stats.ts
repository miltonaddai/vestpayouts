import { hasSupabaseWrite, serviceClient } from "./env";

/** Rebuild cached payout_summary / daily / leaderboard rows. No-op without write keys
 *  or before the precomputed-stats SQL has been applied. */
export async function refreshPayoutStats() {
  if (!hasSupabaseWrite()) return false;
  try {
    const { error } = await serviceClient().rpc("refresh_payout_stats");
    if (error) {
      console.warn(`refresh_payout_stats skipped: ${error.message}`);
      return false;
    }
    console.log("refresh_payout_stats ok");
    return true;
  } catch (err) {
    console.warn(`refresh_payout_stats skipped: ${(err as Error).message}`);
    return false;
  }
}
