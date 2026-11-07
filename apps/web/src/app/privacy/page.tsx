import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { pageMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata = pageMetadata({
  title: "Privacy Policy",
  description: "What VestPayouts stores: referral click logs, an admin cookie, and public blockchain data. No accounts.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 pt-8 md:px-14">
      <Breadcrumbs items={[{ name: "Privacy", path: "/privacy" }]} />
      <h1 className="mt-5 max-w-full text-[clamp(1.75rem,8vw,2.25rem)] leading-[0.96] font-medium tracking-[-0.035em] text-ink md:text-[56px]">Privacy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated 6 November 2026.</p>
      <article className="prose-tape">
        <p>VestPayouts does not have user accounts. You can read every page without telling us who you are.</p>
        <h2>What we collect</h2>
        <ul>
          <li>
            <strong>Referral clicks.</strong> When you follow a Vest link, we store the time, the button (for example &ldquo;hero&rdquo;), the page you were on, the referrer, a truncated user agent, and the country header the host provides (Vercel&apos;s <code>x-vercel-ip-country</code>). We do not store your IP address in that table.
          </li>
          <li>
            <strong>Admin cookie.</strong> The <code>/admin</code> page sets one httpOnly cookie after a correct password. It identifies a session, not a person, and it is not set for ordinary visitors.
          </li>
          <li>
            <strong>Server logs.</strong> The host (typically Vercel) keeps standard request logs, which can include IP addresses, for security and debugging.
          </li>
        </ul>
        <h2>Blockchain data</h2>
        <p>
          Wallet addresses and transaction hashes on the site are already public on Base and Arbitrum. Publishing them is not a disclosure of private information. If you want a display name removed, email {SITE.contactEmail}. The underlying transfer stays, because we don&apos;t control the chain.
        </p>
        <h2>Cookies and analytics</h2>
        <p>
          The public site sets no tracking cookie. If the operator later adds an analytics script, this page will say so. Referral links add UTM parameters so Vest can attribute the signup. That attribution happens on Vest&apos;s side under their privacy policy.
        </p>
        <h2>Contact</h2>
        <p>
          Privacy requests: <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>.
        </p>
      </article>
    </div>
  );
}
