"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { clearAdminCookie, getAdminToken, setAdminCookie } from "@/lib/admin-auth";
import { backendFetch } from "@/lib/backend";
import { PAYOUTS_TAG } from "@/lib/supabase/clients";

export interface ActionState {
  error?: string;
  ok?: string;
}

async function tokenOrError(): Promise<{ token: string } | { error: string }> {
  const token = await getAdminToken();
  if (!token) return { error: "That session is not authorized. Sign in again." };
  return { token };
}

function refresh() {
  revalidateTag(PAYOUTS_TAG, "max");
  revalidatePath("/", "layout");
}

async function readError(res: Response) {
  const json = (await res.json().catch(() => null)) as { error?: string } | null;
  return json?.error || `The API returned HTTP ${res.status}.`;
}

export async function login(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const password = String(formData.get("password") ?? "");
  let res: Response;
  try {
    res = await backendFetch("/admin/login", { method: "POST", body: JSON.stringify({ password }) });
  } catch {
    return { error: "The API is not reachable. Start it with yarn dev:api." };
  }
  if (!res.ok) return { error: await readError(res) };
  const body = (await res.json()) as { token?: string };
  if (!body.token) return { error: "The API did not return a session." };
  await setAdminCookie(body.token);
  return { ok: "Unlocked." };
}

export async function logout(): Promise<void> {
  await clearAdminCookie();
}

export async function addPayout(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await tokenOrError();
  if (!("token" in auth)) return auth;
  const paidAtRaw = String(formData.get("paid_at") ?? "");
  const paid_at = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(paidAtRaw) ? `${paidAtRaw}:00Z` : paidAtRaw;
  let res: Response;
  try {
    res = await backendFetch("/admin/payouts", {
      method: "POST",
      token: auth.token,
      body: JSON.stringify({
        paid_at,
        amount_usd: formData.get("amount_usd"),
        chain: formData.get("chain"),
        tx_hash: formData.get("tx_hash"),
        wallet: formData.get("wallet"),
        trader: formData.get("trader"),
        proof_url: formData.get("proof_url"),
        note: formData.get("note"),
      }),
    });
  } catch {
    return { error: "The API is not reachable. Start it with yarn dev:api." };
  }
  if (!res.ok) return { error: await readError(res) };
  const body = (await res.json()) as { enriched?: boolean };
  refresh();
  return {
    ok: body.enriched
      ? "Matched an on-chain payout and added the trader details to it."
      : "Payout added. It will show on the site within a few seconds.",
  };
}

export async function importCsv(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await tokenOrError();
  if (!("token" in auth)) return auth;
  const file = formData.get("file");
  const pasted = String(formData.get("csv") ?? "");
  const csv = file instanceof File && file.size ? await file.text() : pasted;
  if (!csv.trim()) return { error: "Paste CSV text or choose a file." };
  let res: Response;
  try {
    res = await backendFetch("/admin/import", { method: "POST", token: auth.token, body: JSON.stringify({ csv }) });
  } catch {
    return { error: "The API is not reachable. Start it with yarn dev:api." };
  }
  if (!res.ok) return { error: await readError(res) };
  const body = (await res.json()) as { inserted: number; enriched: number; skipped: number };
  refresh();
  const skipped = body.skipped ? ` ${body.skipped} row(s) skipped.` : "";
  return { ok: `Inserted ${body.inserted}, enriched ${body.enriched}.${skipped}` };
}

export async function saveAlias(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await tokenOrError();
  if (!("token" in auth)) return auth;
  let res: Response;
  try {
    res = await backendFetch("/admin/wallets", {
      method: "POST",
      token: auth.token,
      body: JSON.stringify({
        address: formData.get("address"),
        display_name: formData.get("display_name"),
        x_handle: formData.get("x_handle"),
      }),
    });
  } catch {
    return { error: "The API is not reachable. Start it with yarn dev:api." };
  }
  if (!res.ok) return { error: await readError(res) };
  refresh();
  const address = String(formData.get("address") ?? "").trim().toLowerCase();
  return { ok: `Saved alias for ${address.slice(0, 8)}…` };
}

export async function deleteSamples(prev: ActionState): Promise<ActionState> {
  void prev;
  const auth = await tokenOrError();
  if (!("token" in auth)) return auth;
  let res: Response;
  try {
    res = await backendFetch("/admin/samples", { method: "DELETE", token: auth.token });
  } catch {
    return { error: "The API is not reachable. Start it with yarn dev:api." };
  }
  if (!res.ok) return { error: await readError(res) };
  const body = (await res.json()) as { removed?: number };
  refresh();
  return { ok: `Removed ${body.removed ?? 0} sample row(s).` };
}
