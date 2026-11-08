import type { MetadataRoute } from "next";
import { POST_META } from "@/content/blog/posts";
import { getIndexablePayouts, getLeaderboard, payoutRoute } from "@/lib/payouts/repository";
import { absoluteUrl } from "@/lib/site";

export const revalidate = 3600;

const STATIC: { path: string; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]; priority: number }[] = [
  { path: "/", changeFrequency: "hourly", priority: 1 },
  { path: "/payouts", changeFrequency: "hourly", priority: 0.9 },
  { path: "/leaderboard", changeFrequency: "hourly", priority: 0.8 },
  { path: "/leaderboard/30d", changeFrequency: "hourly", priority: 0.5 },
  { path: "/leaderboard/7d", changeFrequency: "hourly", priority: 0.5 },
  { path: "/leaderboard/24h", changeFrequency: "hourly", priority: 0.4 },
  { path: "/rank", changeFrequency: "weekly", priority: 0.6 },
  { path: "/how-vest-payouts-work", changeFrequency: "monthly", priority: 0.8 },
  { path: "/vest-review", changeFrequency: "monthly", priority: 0.8 },
  { path: "/faq", changeFrequency: "monthly", priority: 0.6 },
  { path: "/blog", changeFrequency: "weekly", priority: 0.7 },
  { path: "/methodology", changeFrequency: "monthly", priority: 0.4 },
  { path: "/about", changeFrequency: "yearly", priority: 0.3 },
  { path: "/disclosure", changeFrequency: "yearly", priority: 0.2 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.2 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.2 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [
    ...STATIC.map((p) => ({
      url: absoluteUrl(p.path),
      lastModified: now,
      changeFrequency: p.changeFrequency,
      priority: p.priority,
    })),
    ...POST_META.map((p) => ({
      url: absoluteUrl(`/blog/${p.slug}`),
      lastModified: new Date(p.updated),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];

  try {
    const [payouts, board] = await Promise.all([getIndexablePayouts(2000), getLeaderboard("all", 40)]);
    for (const p of payouts) {
      if (p.source !== "onchain") continue;
      entries.push({
        url: absoluteUrl(payoutRoute(p)),
        lastModified: new Date(p.paidAt),
        changeFrequency: "yearly",
        priority: 0.4,
      });
    }
    for (const row of board) {
      if (!row.wallet) continue;
      entries.push({
        url: absoluteUrl(`/wallets/${row.wallet}`),
        lastModified: new Date(row.lastPaidAt),
        changeFrequency: "weekly",
        priority: 0.3,
      });
    }
  } catch {
    // Sitemap still ships the static pages if the database is unreachable at build time.
  }

  return entries;
}
