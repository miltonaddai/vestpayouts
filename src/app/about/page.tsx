import Link from "next/link";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { pageMetadata } from "@/lib/seo";
import { NOT_AFFILIATED, SITE } from "@/lib/site";

export const metadata = pageMetadata({
  title: "About PaidTape",
  description: "PaidTape is an independent tracker of Vest payouts. Who runs it, how it's funded, and what it is not.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-8 sm:px-6">
      <Breadcrumbs items={[{ name: "About", path: "/about" }]} />
      <h1 className="mt-5 text-3xl font-bold text-paper sm:text-5xl">About PaidTape</h1>
      <article className="prose-tape">
        <p>
          PaidTape tracks payouts from Vest and nothing else. The site exists because prop-firm payout claims are usually screenshots, and Vest&apos;s payouts happen to be public USDC transfers. We read those transfers and publish them with the transaction attached.
        </p>
        <h2>How the site is funded</h2>
        <p>
          Buttons that say &ldquo;Get funded on Vest&rdquo; are referral links. If you sign up through one, we may earn a commission. You don&apos;t pay extra. The commission never changes a number on the site: the figures come from the chain, and the pages say when a figure is sample data. Details are on the <Link href="/disclosure">affiliate disclosure</Link>.
        </p>
        <h2>What we are not</h2>
        <p>{NOT_AFFILIATED}</p>
        <p>
          We don&apos;t hold funds, we don&apos;t place trades, and nothing on the site is financial advice. Trading leveraged products can wipe out the fee you paid and any capital you add.
        </p>
        <h2>Contact</h2>
        <p>
          Corrections and wallet-name requests: <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>. If a transaction on the explorer disagrees with a page, send the hash.
        </p>
      </article>
    </div>
  );
}
