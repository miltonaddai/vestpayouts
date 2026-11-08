import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { getPost, POSTS } from "@/content/blog";
import { POST_META } from "@/content/blog/posts";
import { articleLd, pageMetadata } from "@/lib/seo";

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return pageMetadata({
    title: post.title,
    description: post.description,
    path: `/blog/${post.slug}`,
    type: "article",
    publishedTime: post.published,
    modifiedTime: post.updated,
    keywords: post.keywords,
  });
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();
  const { Content } = post;
  const more = POST_META.filter((p) => p.slug !== post.slug);
  return (
    <>
      <JsonLd
        data={articleLd({
          title: post.title,
          description: post.description,
          path: `/blog/${post.slug}`,
          datePublished: post.published,
          dateModified: post.updated,
          type: "BlogPosting",
        })}
      />
      <div className="mx-auto max-w-3xl px-6 pt-8 md:px-14">
        <Breadcrumbs
          items={[
            { name: "Guides", path: "/blog" },
            { name: post.title, path: `/blog/${post.slug}` },
          ]}
        />
        <p className="meta mt-6">
          <time dateTime={post.published}>{post.published}</time>
          {" · "}
          {post.readingMinutes} min read
          {post.updated !== post.published && ` · updated ${post.updated}`}
        </p>
        <h1 className="mt-3 max-w-full text-[clamp(1.75rem,8vw,2.25rem)] leading-[0.96] font-medium tracking-[-0.035em] text-ink md:text-[56px]">{post.title}</h1>
        <p className="mt-4 text-lg text-sub">{post.description}</p>
      </div>
      <article className="prose-tape mx-auto max-w-3xl px-4 pt-2 sm:px-6">
        <Content />
      </article>
      <aside className="mx-auto max-w-3xl px-4 pt-10 pb-16 sm:px-6 md:pb-24">
        <h2 className="text-lg font-medium text-ink">Keep reading</h2>
        <ul className="mt-3 space-y-2">
          {more.map((p) => (
            <li key={p.slug}>
              <Link href={`/blog/${p.slug}`} className="text-green underline underline-offset-4">
                {p.title}
              </Link>
            </li>
          ))}
          <li>
            <Link href="/vest-review" className="text-green underline underline-offset-4">
              Vest review
            </Link>
          </li>
        </ul>
      </aside>
    </>
  );
}
