"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { clearAdminCookie, isAdmin, setAdminCookie } from "@/lib/admin-auth";
import { importManualPayouts, validateCsv } from "@/lib/payouts/import";
import { manualPayoutSchema } from "@/lib/payouts/types";
import { getServiceClient, isServiceRoleConfigured, PAYOUTS_TAG } from "@/lib/supabase/clients";

export interface ActionState {
  error?: string;
  ok?: string;
}

async function guard(): Promise<ActionState | null> {
  if (!(await isAdmin())) return { error: "That session is not authorized. Sign in again." };
  if (!isServiceRoleConfigured) return { error: "Set SUPABASE_SERVICE_ROLE_KEY before writing payouts." };
  return null;
}

function refresh() {
  revalidateTag(PAYOUTS_TAG, "max");
  revalidatePath("/", "layout");
}

export async function login(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const password = String(formData.get("password") ?? "");
  const expected = process.env.ADMIN_PASSWORD ?? "";
  if (!expected || password.length !== expected.length || !safeEqual(password, expected)) {
    return { error: "Wrong password." };
  }
  await setAdminCookie();
  return { ok: "Unlocked." };
}

function safeEqual(a: string, b: string) {
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function logout(): Promise<void> {
  await clearAdminCookie();
}

export async function addPayout(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const denied = await guard();
  if (denied) return denied;
  const paidAtRaw = String(formData.get("paid_at") ?? "");
  const paid_at = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(paidAtRaw) ? `${paidAtRaw}:00Z` : paidAtRaw;
  const parsed = manualPayoutSchema.safeParse({
    paid_at,
    amount_usd: formData.get("amount_usd"),
    chain: formData.get("chain"),
    tx_hash: formData.get("tx_hash"),
    wallet: formData.get("wallet"),
    trader: formData.get("trader"),
    proof_url: formData.get("proof_url"),
    note: formData.get("note"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(" ") };
  }
  try {
    const report = await importManualPayouts(getServiceClient(), [parsed.data]);
    refresh();
    return {
      ok: report.enriched
        ? "Matched an on-chain payout and added the trader details to it."
        : "Payout added. It will show on the site within a few seconds.",
    };
  } catch (err) {
    return { error: (err as Error).message };
  }
}

export async function importCsv(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const denied = await guard();
  if (denied) return denied;
  const file = formData.get("file");
  const pasted = String(formData.get("csv") ?? "");
  const text = file instanceof File && file.size ? await file.text() : pasted;
  if (!text.trim()) return { error: "Paste CSV text or choose a file." };
  const { valid, errors } = validateCsv(text);
  if (!valid.length) return { error: errors.map((e) => `Line ${e.line}: ${e.message}`).join("\n") || "No rows found." };
  try {
    const report = await importManualPayouts(getServiceClient(), valid.map((v) => v.row));
    refresh();
    const skipped = errors.length ? ` ${errors.length} row(s) skipped.` : "";
    return { ok: `Inserted ${report.inserted}, enriched ${report.enriched}.${skipped}` };
  } catch (err) {
    return { error: (err as Error).message };
  }
}

export async function saveAlias(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const denied = await guard();
  if (denied) return denied;
  const address = String(formData.get("address") ?? "").trim().toLowerCase();
  const display_name = String(formData.get("display_name") ?? "").trim();
  const x_handle = String(formData.get("x_handle") ?? "").trim();
  if (!/^0x[0-9a-f]{40}$/.test(address)) return { error: "Address must be a 0x wallet." };
  if (!display_name || display_name.length > 60) return { error: "Display name is required (60 characters max)." };
  const { error } = await getServiceClient()
    .from("wallets")
    .upsert({ address, display_name, x_handle: x_handle || null });
  if (error) return { error: error.message };
  refresh();
  return { ok: `Saved alias for ${address.slice(0, 8)}…` };
}

export async function deleteSamples(prev: ActionState): Promise<ActionState> {
  void prev;
  const denied = await guard();
  if (denied) return denied;
  const { error, count } = await getServiceClient().from("payouts").delete({ count: "exact" }).eq("source", "sample");
  if (error) return { error: error.message };
  refresh();
  return { ok: `Removed ${count ?? 0} sample row(s).` };
}
