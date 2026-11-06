import { getPostMeta } from "@/content/blog/posts";
import { OG_SIZE, ogCard } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "PaidTape guide";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostMeta(slug);
  return ogCard({
    eyebrow: "Guide",
    title: post?.title ?? "PaidTape guide",
    footer: "Vest payouts, explained",
  });
}
