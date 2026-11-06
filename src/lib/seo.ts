import type { Metadata } from "next";
import { absoluteUrl, SITE } from "./site";

export function pageMetadata({
  title,
  description,
  path,
  type = "website",
  noindex = false,
  publishedTime,
  modifiedTime,
  keywords,
}: {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
  noindex?: boolean;
  publishedTime?: string;
  modifiedTime?: string;
  keywords?: string[];
}): Metadata {
  const url = absoluteUrl(path);
  return {
    title,
    description,
    keywords,
    alternates: { canonical: url },
    robots: noindex ? { index: false, follow: true } : undefined,
    openGraph: {
      title,
      description,
      url,
      type,
      siteName: SITE.name,
      locale: SITE.locale,
      ...(type === "article" ? { publishedTime, modifiedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(SITE.twitter ? { site: SITE.twitter, creator: SITE.twitter } : {}),
    },
  };
}

type Json = Record<string, unknown>;

export const organizationLd = (): Json => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": absoluteUrl("/#organization"),
  name: SITE.name,
  url: SITE.url,
  logo: absoluteUrl("/brand/vestpayouts-mark.svg"),
  description: SITE.description,
  disambiguatingDescription:
    "Independent website that tracks public Vest payouts. Not affiliated with, endorsed by, or operated by Vest.",
  email: SITE.contactEmail,
  ...(SITE.twitter ? { sameAs: [`https://x.com/${SITE.twitter.replace("@", "")}`] } : {}),
});

export const websiteLd = (): Json => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": absoluteUrl("/#website"),
  name: SITE.name,
  url: SITE.url,
  description: SITE.description,
  publisher: { "@id": absoluteUrl("/#organization") },
  inLanguage: "en-US",
  potentialAction: {
    "@type": "SearchAction",
    target: { "@type": "EntryPoint", urlTemplate: `${absoluteUrl("/payouts")}?q={search_term_string}` },
    "query-input": "required name=search_term_string",
  },
});

export const breadcrumbLd = (items: { name: string; path: string }[]): Json => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((it, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: it.name,
    item: absoluteUrl(it.path),
  })),
});

export const faqLd = (faqs: { q: string; a: string }[]): Json => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
});

export const articleLd = (a: {
  title: string;
  description: string;
  path: string;
  datePublished: string;
  dateModified?: string;
  type?: "Article" | "BlogPosting";
}): Json => ({
  "@context": "https://schema.org",
  "@type": a.type ?? "Article",
  headline: a.title,
  description: a.description,
  url: absoluteUrl(a.path),
  mainEntityOfPage: absoluteUrl(a.path),
  image: absoluteUrl(`${a.path}/opengraph-image`),
  datePublished: a.datePublished,
  dateModified: a.dateModified ?? a.datePublished,
  author: { "@type": "Organization", name: `${SITE.name} Research`, url: absoluteUrl("/about") },
  publisher: { "@id": absoluteUrl("/#organization") },
  inLanguage: "en-US",
});

export const datasetLd = (d: { name: string; description: string; path: string; dateModified?: string }): Json => ({
  "@context": "https://schema.org",
  "@type": "Dataset",
  name: d.name,
  description: d.description,
  url: absoluteUrl(d.path),
  creator: { "@id": absoluteUrl("/#organization") },
  isAccessibleForFree: true,
  license: "https://creativecommons.org/licenses/by/4.0/",
  ...(d.dateModified ? { dateModified: d.dateModified } : {}),
  measurementTechnique: "Public blockchain event logs (Base, Arbitrum One)",
  variableMeasured: ["Payout amount (USDC)", "Recipient wallet", "Settlement time"],
});
