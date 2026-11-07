import { serve } from "@hono/node-server";
import { Hono } from "hono";
import cron from "node-cron";
import { manualPayoutSchema, type ManualPayoutInput } from "@vestpayouts/shared";
import { adminConfigured, bearer, issueAdminToken, passwordOk, secretOk, tokenOk } from "./auth";
import { serviceClient, supabaseUrl, triggerRevalidate } from "./env";
import { importManualPayouts, validateCsv } from "./import-payouts";
import { runIngest } from "./ingest";

const app = new Hono();
let ingesting = false;

function requireAdmin(header: string | undefined) {
  if (!tokenOk(bearer(header))) return false;
  return true;
}

app.get("/health", (c) =>
  c.json({
    ok: true,
    service: "vestpayouts-api",
    admin: adminConfigured(),
    supabase: Boolean(supabaseUrl() && process.env.SUPABASE_SERVICE_ROLE_KEY),
  }),
);

app.post("/admin/login", async (c) => {
  if (!adminConfigured()) return c.json({ error: "Set ADMIN_PASSWORD on the API." }, 503);
  const body = (await c.req.json().catch(() => null)) as { password?: string } | null;
  if (!body?.password || !passwordOk(body.password)) return c.json({ error: "Wrong password." }, 401);
  return c.json({ token: issueAdminToken(body.password) });
});

app.get("/admin/overview", async (c) => {
  if (!requireAdmin(c.req.header("authorization"))) return c.json({ error: "Unauthorized" }, 401);
  const db = serviceClient();
  const [rows, onchain, manual, sample] = await Promise.all([
    db.from("payouts").select("id, source, amount_usd, paid_at, wallet, trader_name").order("paid_at", { ascending: false }).limit(12),
    db.from("payouts").select("id", { count: "exact", head: true }).eq("source", "onchain"),
    db.from("payouts").select("id", { count: "exact", head: true }).eq("source", "manual"),
    db.from("payouts").select("id", { count: "exact", head: true }).eq("source", "sample"),
  ]);
  if (rows.error) return c.json({ error: rows.error.message }, 500);
  return c.json({
    counts: { onchain: onchain.count ?? 0, manual: manual.count ?? 0, sample: sample.count ?? 0 },
    recent: rows.data,
  });
});

app.post("/admin/payouts", async (c) => {
  if (!requireAdmin(c.req.header("authorization"))) return c.json({ error: "Unauthorized" }, 401);
  const parsed = manualPayoutSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: parsed.error.issues.map((i) => i.message).join(" ") }, 400);
  const report = await importManualPayouts(serviceClient(), [parsed.data]);
  await triggerRevalidate();
  return c.json(report);
});

app.post("/admin/import", async (c) => {
  if (!requireAdmin(c.req.header("authorization"))) return c.json({ error: "Unauthorized" }, 401);
  const body = (await c.req.json().catch(() => null)) as { csv?: string } | null;
  if (!body?.csv?.trim()) return c.json({ error: "Paste CSV text or choose a file." }, 400);
  const { valid, errors } = validateCsv(body.csv);
  if (!valid.length) {
    return c.json({ error: errors.map((e) => `Line ${e.line}: ${e.message}`).join("\n") || "No rows found." }, 400);
  }
  const report = await importManualPayouts(serviceClient(), valid.map((v) => v.row));
  await triggerRevalidate();
  return c.json({ ...report, skipped: errors.length });
});

app.post("/admin/wallets", async (c) => {
  if (!requireAdmin(c.req.header("authorization"))) return c.json({ error: "Unauthorized" }, 401);
  const body = (await c.req.json().catch(() => null)) as { address?: string; display_name?: string; x_handle?: string } | null;
  const address = String(body?.address ?? "").trim().toLowerCase();
  const display_name = String(body?.display_name ?? "").trim();
  const x_handle = String(body?.x_handle ?? "").trim();
  if (!/^0x[0-9a-f]{40}$/.test(address)) return c.json({ error: "Address must be a 0x wallet." }, 400);
  if (!display_name || display_name.length > 60) return c.json({ error: "Display name is required (60 characters max)." }, 400);
  const { error } = await serviceClient().from("wallets").upsert({ address, display_name, x_handle: x_handle || null });
  if (error) return c.json({ error: error.message }, 500);
  await triggerRevalidate();
  return c.json({ ok: true });
});

app.delete("/admin/samples", async (c) => {
  if (!requireAdmin(c.req.header("authorization"))) return c.json({ error: "Unauthorized" }, 401);
  const { error, count } = await serviceClient().from("payouts").delete({ count: "exact" }).eq("source", "sample");
  if (error) return c.json({ error: error.message }, 500);
  await triggerRevalidate();
  return c.json({ removed: count ?? 0 });
});

app.post("/clicks", async (c) => {
  if (!secretOk(process.env.CLICK_LOG_SECRET, bearer(c.req.header("authorization")))) return c.json({ error: "Unauthorized" }, 401);
  const body = (await c.req.json().catch(() => null)) as Partial<ManualPayoutInput> & {
    placement?: string;
    from_path?: string | null;
    referer?: string | null;
    user_agent?: string | null;
    country?: string | null;
  } | null;
  const placement = String(body?.placement ?? "unknown").replace(/[^a-z0-9-]/gi, "").slice(0, 40) || "unknown";
  const click = {
    placement,
    from_path: body?.from_path?.slice(0, 200) ?? null,
    referer: body?.referer?.slice(0, 500) ?? null,
    user_agent: body?.user_agent?.slice(0, 300) ?? null,
    country: body?.country?.slice(0, 8) ?? null,
  };
  console.log(JSON.stringify({ type: "referral_click", at: new Date().toISOString(), ...click }));
  const { error } = await serviceClient().from("referral_clicks").insert(click);
  if (error) return c.json({ error: error.message }, 500);
  const hook = process.env.REFERRAL_WEBHOOK_URL;
  if (hook) {
    await fetch(hook, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type: "referral_click", at: new Date().toISOString(), ...click }),
      signal: AbortSignal.timeout(3000),
    }).catch(() => {});
  }
  return c.json({ ok: true });
});

app.post("/internal/ingest", async (c) => {
  if (!secretOk(process.env.CRON_SECRET, bearer(c.req.header("authorization")))) return c.json({ error: "Unauthorized" }, 401);
  if (ingesting) return c.json({ error: "Ingest already running." }, 409);
  ingesting = true;
  const body = (await c.req.json().catch(() => ({}))) as { chain?: string; since?: string };
  try {
    const ok = await runIngest({ chain: body.chain, since: body.since });
    return c.json({ ok }, ok ? 200 : 500);
  } finally {
    ingesting = false;
  }
});

const expr = process.env.INGEST_CRON?.trim();
if (expr) {
  if (!cron.validate(expr)) console.error(`INGEST_CRON is not a valid cron expression: ${expr}`);
  else {
    cron.schedule(expr, () => {
      if (ingesting) return;
      ingesting = true;
      runIngest()
        .catch((err) => console.error("scheduled ingest failed:", err))
        .finally(() => {
          ingesting = false;
        });
    });
    console.log(`ingest scheduled: ${expr}`);
  }
}

const port = Number(process.env.PORT) || 4318;
serve({ fetch: app.fetch, port, hostname: "0.0.0.0" }, () => {
  console.log(`vestpayouts-api listening on http://127.0.0.1:${port}`);
});
