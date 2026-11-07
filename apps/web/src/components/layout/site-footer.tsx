import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { ReferralLink } from "@/components/referral/referral-link";
import { SplitInner } from "@/components/ui/split-cta";
import { AFFILIATE_DISCLOSURE, NOT_AFFILIATED, RISK_WARNING, SITE } from "@/lib/site";

const COLUMNS = [
  {
    title: "Payout data",
    links: [
      { href: "/payouts", label: "Latest Vest payouts" },
      { href: "/payouts?sort=largest", label: "Largest Vest payouts" },
      { href: "/leaderboard", label: "Vest payout leaderboard" },
      { href: "/methodology", label: "Methodology" },
    ],
  },
  {
    title: "Guides",
    links: [
      { href: "/how-vest-payouts-work", label: "How Vest payouts work" },
      { href: "/vest-review", label: "Vest review" },
      { href: "/blog/vest-payout-proof", label: "Vest payout proof" },
      { href: "/blog/how-to-get-paid-on-vest", label: "How to get paid on Vest" },
      { href: "/blog/vest-vs-competitors", label: "Vest vs competitors" },
      { href: "/faq", label: "FAQ" },
    ],
  },
  {
    title: "VestPayouts",
    links: [
      { href: "/about", label: "About" },
      { href: "/disclosure", label: "Affiliate disclosure" },
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-0 min-w-0 border-t border-line pb-20 sm:pb-0">
      <div className="grid border-b border-line md:grid-cols-[1.3fr_repeat(3,1fr)]">
        <div className="border-b border-line px-6 py-10 md:border-r md:border-b-0 md:px-14">
          <Logo />
          <p className="mt-5 max-w-sm border border-line bg-orange-soft px-3 py-2.5 text-sm leading-relaxed text-ink">
            <strong className="text-orange">Independent. Not affiliated with or endorsed by Vest.</strong> {NOT_AFFILIATED}
          </p>
          <p className="mt-3 max-w-sm text-sm text-sub">{SITE.tagline}</p>
          <ReferralLink placement="footer" className="split-cta mt-5">
            <SplitInner>Open a Vest account</SplitInner>
          </ReferralLink>
        </div>
        {COLUMNS.map((c) => (
          <div key={c.title} className="border-b border-line px-6 py-10 last:border-b-0 md:border-r md:border-b-0 md:last:border-r-0 md:px-8">
            <h2 className="meta text-ink">{c.title}</h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {c.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sub hover:text-ink">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="space-y-3 border-b border-line px-6 py-5 text-[11px] leading-relaxed text-sub md:px-14">
        <p>
          <strong className="text-ink">Affiliate disclosure.</strong> {AFFILIATE_DISCLOSURE}{" "}
          <Link href="/disclosure" className="underline underline-offset-2 hover:text-ink">
            Read the affiliate disclosure
          </Link>
          .
        </p>
        <p>
          <strong className="text-ink">Risk warning.</strong> {RISK_WARNING}
        </p>
      </div>
      <div className="flex flex-wrap items-stretch font-mono text-[11px] sm:text-[12px]">
        <span className="w-full border-b border-line px-6 py-4 text-sub sm:w-auto sm:border-b-0 md:px-14">
          © {new Date().getFullYear()} {SITE.name.toUpperCase()}. ALL RIGHTS RESERVED
        </span>
        {[
          { href: "/about", label: "About" },
          { href: "/disclosure", label: "Disclosure" },
          { href: "/methodology", label: "Methodology" },
          { href: "/privacy", label: "Privacy" },
          { href: "/terms", label: "Terms" },
        ].map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="flex-1 border-l border-line px-4 py-4 text-center whitespace-nowrap text-sub uppercase hover:text-ink sm:flex-none sm:px-6"
          >
            {l.label}
          </Link>
        ))}
      </div>
    </footer>
  );
}
