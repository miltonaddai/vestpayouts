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
    <div className="mx-auto max-w-3xl px-6 pt-8 pb-16 md:px-14 md:pb-24">
      <Breadcrumbs items={[{ name: "Guides", path: "/blog" }]} />
      <p className="meta mt-6">§ Writing</p>
      <h1 className="mt-3 max-w-full text-[clamp(1.75rem,8vw,2.25rem)] leading-[0.96] font-medium tracking-[-0.035em] text-ink md:text-[56px]">Guides</h1>
      <p className="mt-4 text-lg text-sub">
        Practical writing about getting paid on Vest. Numbers inside the articles update from the live payout database.
      </p>
      <ul className="mt-10 border border-line">
        {POST_META.map((p) => (
          <li key={p.slug} className="border-b border-line last:border-b-0">
            <Link href={`/blog/${p.slug}`} className="block p-5 hover:bg-paper">
              <p className="meta">
                {p.published} · {p.readingMinutes} min read
              </p>
              <h2 className="mt-2 text-xl font-medium tracking-[-0.02em] text-ink">{p.title}</h2>
              <p className="mt-2 text-sub">{p.description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
