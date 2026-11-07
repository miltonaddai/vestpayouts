import { revalidatePath, revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";
import { PAYOUTS_TAG } from "@/lib/supabase/clients";

export const dynamic = "force-dynamic";

/** POST /api/revalidate  Authorization: Bearer $REVALIDATE_SECRET */
export async function POST(req: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  revalidateTag(PAYOUTS_TAG, "max");
  revalidatePath("/", "layout");
  return Response.json({ revalidated: true, at: new Date().toISOString() });
}
