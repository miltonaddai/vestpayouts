import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { ReferralLink } from "@/components/referral/referral-link";
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
    <footer className="mt-24 border-t border-ink-800 bg-ink-950 pb-24 sm:pb-0">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Logo />
            <p className="mt-4 max-w-sm rounded-xl border border-amber/35 bg-amber/10 px-3 py-2.5 text-sm leading-relaxed text-paper/90">
              <strong className="text-amber">Independent. Not affiliated with or endorsed by Vest.</strong> {NOT_AFFILIATED}
            </p>
            <p className="mt-3 max-w-sm text-sm text-muted-foreground">{SITE.tagline}</p>
            <ReferralLink
              placement="footer"
              className="mt-5 inline-flex h-10 items-center rounded-lg border border-mint/40 px-4 text-sm font-semibold text-mint hover:bg-mint/10"
            >
              Open a Vest account →
            </ReferralLink>
          </div>
          {COLUMNS.map((c) => (
            <div key={c.title}>
              <h2 className="text-sm font-semibold text-paper">{c.title}</h2>
              <ul className="mt-4 space-y-2.5 text-sm">
                {c.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-muted-foreground hover:text-paper">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 space-y-3 border-t border-ink-800 pt-8 text-xs leading-relaxed text-muted-foreground">
          <p>
            <strong className="text-paper/80">Affiliate disclosure.</strong> {AFFILIATE_DISCLOSURE}{" "}
            <Link href="/disclosure" className="underline underline-offset-2 hover:text-paper">
              Read the affiliate disclosure
            </Link>
            .
          </p>
          <p>
            <strong className="text-paper/80">Risk warning.</strong> {RISK_WARNING}
          </p>
          <p>© {new Date().getFullYear()} {SITE.name}. Payout data is derived from public blockchains and provided as-is.</p>
        </div>
      </div>
    </footer>
  );
}
