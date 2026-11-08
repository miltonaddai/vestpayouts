import Link from "next/link";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { pageMetadata } from "@/lib/seo";
import { NOT_AFFILIATED, SITE } from "@/lib/site";

export const metadata = pageMetadata({
  title: "Terms of Use",
  description: "Terms for using VestPayouts. Informational only, no financial advice, data provided as-is.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 pt-8 pb-16 md:px-14 md:pb-24">
      <Breadcrumbs items={[{ name: "Terms", path: "/terms" }]} />
      <h1 className="mt-5 max-w-full text-[clamp(1.75rem,8vw,2.25rem)] leading-[0.96] font-medium tracking-[-0.035em] text-ink md:text-[56px]">Terms of use</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated 6 November 2026.</p>
      <article className="prose-tape">
        <p>By using VestPayouts you agree to these terms. If you don&apos;t, don&apos;t use the site.</p>
        <h2>What the site is</h2>
        <p>
          VestPayouts publishes information about payouts sent by Vest, plus guides about how that program works. {NOT_AFFILIATED} &ldquo;Vest&rdquo; is their trademark, used here to identify the platform we track.
        </p>
        <h2>Not advice</h2>
        <p>
          Nothing on the site is financial, investment, legal or tax advice, and nothing is an offer to buy or sell anything. Trading derivatives can result in the loss of the fee you paid and of any money you add. Past payouts to other people say nothing about what you will receive.
        </p>
        <h2>Data is provided as-is</h2>
        <p>
          We work to keep figures accurate and we link on-chain rows to a block explorer so you can check them. We do not warrant that the data is complete, current or fit for a particular purpose. Chains reorg, RPCs gap, and manual entries can be wrong. Don&apos;t make a financial decision that depends on a single number from this site without opening the transaction yourself.
        </p>
        <p>Sample rows are fictional and labelled. Don&apos;t cite them as real payouts.</p>
        <h2>Referral links</h2>
        <p>
          Some links are paid referrals, described in the <Link href="/disclosure">disclosure</Link>. Clicking one sends you to Vest, and their terms govern anything you buy there.
        </p>
        <h2>Acceptable use</h2>
        <p>
          Don&apos;t scrape in a way that degrades the site, don&apos;t try to break into the admin, and don&apos;t submit payout reports you know are false. You may quote figures with a link back.
        </p>
        <h2>Liability</h2>
        <p>
          To the extent the law allows, VestPayouts and its operator are not liable for lost profits, lost fees, or decisions you make after reading the site. The site is provided &ldquo;as is&rdquo;.
        </p>
        <h2>Changes</h2>
        <p>
          We can update these terms by editing this page. Continued use after a change means you accept the new terms.
        </p>
        <p>
          Contact: <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>.
        </p>
      </article>
    </div>
  );
}
