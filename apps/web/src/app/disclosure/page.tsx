import Link from "next/link";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { pageMetadata } from "@/lib/seo";
import { AFFILIATE_DISCLOSURE, NOT_AFFILIATED, SITE } from "@/lib/site";

export const metadata = pageMetadata({
  title: "Affiliate Disclosure",
  description: "VestPayouts earns commissions from Vest referral links. How that works, and what it does not change.",
  path: "/disclosure",
});

export default function DisclosurePage() {
  return (
    <div className="mx-auto max-w-3xl px-6 pt-8 md:px-14">
      <Breadcrumbs items={[{ name: "Disclosure", path: "/disclosure" }]} />
      <h1 className="mt-5 max-w-full text-[clamp(1.75rem,8vw,2.25rem)] leading-[0.96] font-medium tracking-[-0.035em] text-ink md:text-[56px]">Affiliate disclosure</h1>
      <article className="prose-tape">
        <p>{AFFILIATE_DISCLOSURE}</p>
        <p>
          Every outbound link to Vest on this site goes through <code>/go</code>, which records the page and the button you clicked and then redirects to the referral URL configured by the site owner. Until a referral URL is set, those links go to Vest&apos;s public homepage. The links are marked <code>rel=&quot;sponsored&quot;</code>.
        </p>
        <h2>What the commission does not buy</h2>
        <ul>
          <li>Payout totals, leaderboards and individual pages are computed from public blockchain data and from payouts entered in admin. A referral relationship does not add, remove or resize a row.</li>
          <li>Sample data is labelled as sample. It is not presented as a real payout.</li>
          <li>Reviews and guides describe rules that can cost you money, including tight drawdowns and the chance of losing the fee.</li>
        </ul>
        <h2>Independence</h2>
        <p>{NOT_AFFILIATED}</p>
        <p>
          Questions: <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>. See also the <Link href="/terms">terms</Link> and <Link href="/privacy">privacy</Link> pages.
        </p>
      </article>
    </div>
  );
}
