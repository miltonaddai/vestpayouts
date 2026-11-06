import Link from "next/link";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { POST_META } from "@/content/blog/posts";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Vest Guides — Payouts, Proof and Comparisons",
  description:
    "Guides for Vest traders: how to get paid, how to verify a Vest payout, Instant vs evaluation accounts, and how Vest compares with other prop firms.",
  path: "/blog",
  keywords: ["Vest guide", "Vest payout guide", "Vest Capital explained"],
});

export default function BlogIndexPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-8 sm:px-6">
      <Breadcrumbs items={[{ name: "Guides", path: "/blog" }]} />
      <h1 className="mt-5 text-3xl font-bold text-paper sm:text-5xl">Guides</h1>
      <p className="mt-4 text-lg text-paper/75">
        Practical writing about getting paid on Vest. Numbers inside the articles update from the live payout database.
      </p>
      <ul className="mt-10 space-y-4">
        {POST_META.map((p) => (
          <li key={p.slug}>
            <Link href={`/blog/${p.slug}`} className="block rounded-2xl border border-ink-800 bg-ink-900/60 p-5 hover:border-mint/40">
              <p className="text-xs tracking-wide text-muted-foreground uppercase">
                {p.published} · {p.readingMinutes} min read
              </p>
              <h2 className="mt-2 text-xl font-semibold text-paper">{p.title}</h2>
              <p className="mt-2 text-paper/70">{p.description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
