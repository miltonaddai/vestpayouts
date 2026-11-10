import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CHAINS, type ChainId } from "@vestpayouts/shared";
import { serviceClient } from "../env";
import { postToX, uploadImageToX, xCredentials, XPostError } from "./x-client";

/**
 * Automated X posts:
 *  - Roundup: one post per completed 30-minute window covering every payout
 *    of X_ROUNDUP_MIN (default $50) or more.
 *  - Big payout: its own post for each payout of X_BIG_MIN (default $10,000) or more.
 *
 * Runs every few minutes and is idempotent: each item is claimed in
 * public.social_posts (unique ref) before it's posted, so restarts and
 * overlapping runs never double-post.
 *
 * Env:
 *   X_POSTING_ENABLED=true      turn the scheduler on
 *   X_POSTING_DRY_RUN=true      log and record posts without calling X
 *   X_API_KEY / X_API_SECRET / X_ACCESS_TOKEN / X_ACCESS_SECRET
 *   X_ROUNDUP_MIN=50  X_BIG_MIN=10000  X_ROUNDUP_LAG_MIN=10  X_DAILY_POST_CAP=120
 *   X_LINK_ROUNDUPS=false  X_LINK_BIG=true  (posts with links cost more on X's API)
 *   X_BIG_IMAGES=true           attach the pixel-art heat tier card to big-payout posts
 */

const WINDOW_MS = 30 * 60_000;
const BIG_LOOKBACK_MS = 3 * 3_600_000;
const MAX_BIG_PER_RUN = 5;

const num = (name: string, fallback: number) => {
  const n = Number(process.env[name]);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};
const flag = (name: string, fallback: boolean) => {
  const v = (process.env[name] || "").trim().toLowerCase();
  return v ? v === "true" || v === "1" || v === "yes" : fallback;
};

export function socialConfig() {
  return {
    enabled: flag("X_POSTING_ENABLED", false),
    dryRun: flag("X_POSTING_DRY_RUN", false),
    roundupMin: num("X_ROUNDUP_MIN", 50),
    bigMin: num("X_BIG_MIN", 10_000),
    lagMs: num("X_ROUNDUP_LAG_MIN", 10) * 60_000,
    dailyCap: num("X_DAILY_POST_CAP", 120),
    linkRoundups: flag("X_LINK_ROUNDUPS", false),
    linkBig: flag("X_LINK_BIG", true),
    bigImages: flag("X_BIG_IMAGES", true),
    site: (process.env.NEXT_PUBLIC_SITE_URL || "https://vestpayouts.com").replace(/\/$/, ""),
  };
}
type Config = ReturnType<typeof socialConfig>;

/* ---------- Text ---------- */

const usd0 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const usd2 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const int = new Intl.NumberFormat("en-US");
const short = (addr: string) => `${addr.slice(0, 6)}…${addr.slice(-4)}`;
const hhmm = (d: Date) => d.toISOString().slice(11, 16);
const chainName = (c: string | null) => (c && c in CHAINS ? CHAINS[c as ChainId].name : "on-chain");

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${int.format(n)}${s[(v - 20) % 10] || s[v] || s[0]}`;
}

export interface RoundupStats {
  start: Date;
  end: Date;
  total: number;
  count: number;
  wallets: number;
  largest: { amount: number; wallet: string | null; chain: string | null; name: string | null };
}

export function roundupText(r: RoundupStats, cfg: Pick<Config, "linkRoundups" | "site">) {
  const lines = [
    `💸 ${usd0.format(r.total)} paid to Vest traders in the last 30 minutes`,
    "",
    `${int.format(r.count)} payout${r.count === 1 ? "" : "s"} · ${int.format(r.wallets)} wallet${r.wallets === 1 ? "" : "s"}`,
    `Largest: ${usd0.format(r.largest.amount)} to ${r.largest.name ?? (r.largest.wallet ? short(r.largest.wallet) : "a trader")} on ${chainName(r.largest.chain)}`,
    "",
    `${hhmm(r.start)}–${hhmm(r.end)} UTC`,
  ];
  if (cfg.linkRoundups) lines.push(`${cfg.site}/payouts`);
  return lines.join("\n");
}

export interface BigPayout {
  id: number;
  amount: number;
  chain: string | null;
  txHash: string | null;
  wallet: string | null;
  name: string | null;
  /** 1 = largest ever. */
  rank: number;
}

export function bigText(p: BigPayout, cfg: Pick<Config, "linkBig" | "site">) {
  const who = p.name ?? (p.wallet ? short(p.wallet) : "A Vest trader");
  const lines =
    p.rank === 1
      ? [
          `🏆 New record: ${usd0.format(p.amount)} Vest payout`,
          "",
          `${who} was just paid ${usd2.format(p.amount)} USDC on ${chainName(p.chain)}. That's the largest @vestexchange payout ever recorded.`,
        ]
      : [
          `🚨 ${usd0.format(p.amount)} Vest payout`,
          "",
          `${who} was just paid ${usd2.format(p.amount)} USDC on ${chainName(p.chain)}${p.rank <= 100 ? `, the ${ordinal(p.rank)} largest @vestexchange payout on record` : ""}.`,
        ];
  const tier = heatTier(p.amount);
  if (tier) lines.push("", `🔥 Heat ${String(tier).padStart(2, "0")}/10 · ${TIER_LABELS[tier - 1]}`);
  if (cfg.linkBig && p.chain && p.txHash) lines.push("", `Proof: ${cfg.site}/payouts/${p.chain}/${p.txHash}`);
  return lines.join("\n");
}

/* ---------- Heat tier art ---------- */

// Lower bound of each tier (USD). Art lives in apps/api/assets/fire/tier-NN.jpg
// (1024x1024): SPARK, EMBER, FLAME, BLAZE, BONFIRE, WILDFIRE, FIRESTORM,
// INFERNO, MELTDOWN, SUPERNOVA.
const TIER_FLOORS = [10_000, 15_000, 20_000, 30_000, 40_000, 50_000, 75_000, 100_000, 150_000, 250_000];
// Name and joke per tier, shown in the post text (the image only carries the heat meter).
const TIER_LABELS = [
  "Spark: is it warm in here?",
  "Ember: getting toasty",
  "Flame: someone open a window",
  "Blaze: too hot to HODL",
  "Bonfire: bring the marshmallows",
  "Wildfire: spreading fast",
  "Firestorm: fire dept. gave up",
  "Inferno: wallet is melting",
  "Plasma: physics has left the chat",
  "Supernova: somebody call NASA",
];
const ART_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../assets/fire");

export function heatTier(amount: number) {
  let tier = 0;
  for (let i = 0; i < TIER_FLOORS.length; i++) if (amount >= TIER_FLOORS[i]) tier = i + 1;
  return tier; // 0 = below the first tier
}

export function tierArtPath(amount: number) {
  const tier = heatTier(amount);
  if (!tier) return null;
  const file = path.join(ART_DIR, "tier-" + String(tier).padStart(2, "0") + ".jpg");
  return existsSync(file) ? file : null;
}

/* ---------- Data ---------- */

type Db = ReturnType<typeof serviceClient>;

/** The most recent 30-minute window that closed at least `lag` ago. */
export function roundupWindow(now: number, lagMs: number) {
  const end = Math.floor((now - lagMs) / WINDOW_MS) * WINDOW_MS;
  return { start: new Date(end - WINDOW_MS), end: new Date(end) };
}

async function names(db: Db, wallets: string[]) {
  if (!wallets.length) return new Map<string, string>();
  const { data } = await db.from("wallets").select("address, display_name").in("address", wallets);
  return new Map((data ?? []).map((w) => [w.address, w.display_name]));
}

async function roundupStats(db: Db, cfg: Config, start: Date, end: Date): Promise<RoundupStats | null> {
  const { data, error } = await db
    .from("payouts")
    .select("amount_usd, chain, wallet, trader_name")
    .eq("published", true)
    .eq("source", "onchain")
    .gte("paid_at", start.toISOString())
    .lt("paid_at", end.toISOString())
    .gte("amount_usd", cfg.roundupMin)
    .limit(10_000);
  if (error) throw new Error(`roundup query failed: ${error.message}`);
  if (!data?.length) return null;
  const top = data.reduce((a, b) => (Number(b.amount_usd) > Number(a.amount_usd) ? b : a));
  const label = top.wallet ? (await names(db, [top.wallet])).get(top.wallet) : undefined;
  return {
    start,
    end,
    total: data.reduce((s, r) => s + Number(r.amount_usd), 0),
    count: data.length,
    wallets: new Set(data.map((r) => r.wallet)).size,
    largest: { amount: Number(top.amount_usd), wallet: top.wallet, chain: top.chain, name: label ?? top.trader_name ?? null },
  };
}

async function bigCandidates(db: Db, cfg: Config, now: number): Promise<BigPayout[]> {
  const { data, error } = await db
    .from("payouts")
    .select("id, amount_usd, chain, tx_hash, wallet, trader_name")
    .eq("published", true)
    .eq("source", "onchain")
    .gte("amount_usd", cfg.bigMin)
    .gte("paid_at", new Date(now - BIG_LOOKBACK_MS).toISOString())
    .lte("paid_at", new Date(now).toISOString())
    .order("paid_at", { ascending: true })
    .limit(25);
  if (error) throw new Error(`big payout query failed: ${error.message}`);
  if (!data?.length) return [];

  const refs = data.map((p) => `big:${p.id}`);
  const { data: done } = await db.from("social_posts").select("ref").eq("network", "x").in("ref", refs);
  const seen = new Set((done ?? []).map((r) => r.ref));
  const fresh = data.filter((p) => !seen.has(`big:${p.id}`)).slice(0, MAX_BIG_PER_RUN);
  const labels = await names(db, fresh.map((p) => p.wallet).filter((w): w is string => !!w));

  const out: BigPayout[] = [];
  for (const p of fresh) {
    const { count } = await db
      .from("payouts")
      .select("id", { count: "exact", head: true })
      .eq("published", true)
      .neq("source", "sample")
      .gt("amount_usd", p.amount_usd);
    out.push({
      id: p.id,
      amount: Number(p.amount_usd),
      chain: p.chain,
      txHash: p.tx_hash,
      wallet: p.wallet,
      name: (p.wallet && labels.get(p.wallet)) || p.trader_name || null,
      rank: (count ?? 0) + 1,
    });
  }
  return out;
}

async function postedLast24h(db: Db) {
  const { count } = await db
    .from("social_posts")
    .select("id", { count: "exact", head: true })
    .eq("network", "x")
    .in("status", ["posted", "pending"])
    .gte("created_at", new Date(Date.now() - 86_400_000).toISOString());
  return count ?? 0;
}

/** Insert a pending row. Returns false if this ref was already claimed. */
async function claim(db: Db, kind: "roundup" | "big", ref: string, body: string, status: "pending" | "skipped" = "pending") {
  const { error } = await db.from("social_posts").insert({ network: "x", kind, ref, body, status });
  if (!error) return true;
  if (error.code === "23505") return false;
  throw new Error(`social_posts insert failed: ${error.message}`);
}

/* ---------- Run ---------- */

export interface SocialRunResult {
  posted: number;
  skipped: number;
  failed: number;
  previews: string[];
}

/**
 * One pass: the latest roundup window, then any new big payouts.
 * `preview` reads data and returns the post texts without writing or posting anything.
 */
export async function runSocial(opts: { preview?: boolean; now?: number } = {}): Promise<SocialRunResult> {
  const cfg = socialConfig();
  const db = serviceClient();
  const now = opts.now ?? Date.now();
  const result: SocialRunResult = { posted: 0, skipped: 0, failed: 0, previews: [] };

  const { start, end } = roundupWindow(now, cfg.lagMs);
  const roundupRef = `roundup:${start.toISOString()}`;
  const stats = await roundupStats(db, cfg, start, end);
  const items: { kind: "roundup" | "big"; ref: string; body: string | null; image?: string | null }[] = [
    { kind: "roundup", ref: roundupRef, body: stats ? roundupText(stats, cfg) : null },
    ...(await bigCandidates(db, cfg, now)).map((p) => ({
      kind: "big" as const,
      ref: `big:${p.id}`,
      body: bigText(p, cfg),
      image: cfg.bigImages ? tierArtPath(p.amount) : null,
    })),
  ];
  const imageNote = (image?: string | null) => (image ? ` + image ${path.basename(image)}` : "");

  if (opts.preview) {
    result.previews = items.map((i) => `[${i.ref}]${imageNote(i.image)}\n${i.body ?? "(nothing to post: no payouts in this window)"}`);
    return result;
  }

  const creds = xCredentials();
  if (!cfg.dryRun && !creds) throw new Error("X posting is enabled but X_API_KEY / X_API_SECRET / X_ACCESS_TOKEN / X_ACCESS_SECRET are not all set.");
  let budget = cfg.dailyCap - (await postedLast24h(db));

  for (const item of items) {
    if (item.body === null) {
      // An empty window: record it so it isn't re-checked, but don't post.
      if (await claim(db, item.kind, item.ref, "", "skipped")) result.skipped++;
      continue;
    }
    if (budget <= 0) {
      console.warn(`social: daily cap of ${cfg.dailyCap} posts reached; holding ${item.ref}`);
      break;
    }
    if (!(await claim(db, item.kind, item.ref, item.body))) continue;
    budget--;

    if (cfg.dryRun) {
      console.log(`social (dry run) ${item.ref}${imageNote(item.image)}:\n${item.body}`);
      await db.from("social_posts").update({ status: "dry_run", updated_at: new Date().toISOString() }).eq("network", "x").eq("ref", item.ref);
      result.posted++;
      continue;
    }

    try {
      // The image is a bonus: if the upload fails, post the text anyway.
      let mediaIds: string[] = [];
      if (item.image) {
        try {
          mediaIds = [await uploadImageToX(readFileSync(item.image), creds!)];
        } catch (err) {
          console.warn(`social: image upload for ${item.ref} failed, posting text only: ${(err as Error).message}`);
        }
      }
      const { id } = await postToX(item.body, creds!, mediaIds);
      await db
        .from("social_posts")
        .update({ status: "posted", post_id: id, updated_at: new Date().toISOString() })
        .eq("network", "x")
        .eq("ref", item.ref);
      console.log(`social: posted ${item.ref} as ${id}`);
      result.posted++;
    } catch (err) {
      const e = err as XPostError;
      result.failed++;
      if (e.retryable) {
        // Release the claim so the next run tries again.
        await db.from("social_posts").delete().eq("network", "x").eq("ref", item.ref);
        console.warn(`social: ${item.ref} will retry: ${e.message}`);
        if (e.status === 429) break;
      } else {
        await db
          .from("social_posts")
          .update({ status: "failed", error: e.message.slice(0, 500), updated_at: new Date().toISOString() })
          .eq("network", "x")
          .eq("ref", item.ref);
        console.error(`social: ${item.ref} failed: ${e.message}`);
      }
    }
  }
  return result;
}
