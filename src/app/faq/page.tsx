import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ReferralPanel } from "@/components/referral/referral-cta";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { PAYOUT_FAQS } from "@/lib/content/faqs";
import { faqLd, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Vest Payout FAQ — Timing, Proof, Splits and Minimums",
  description:
    "Answers to the questions traders ask about Vest payouts: does Vest pay, how long it takes, which chain, the profit split, and how to verify a payout.",
  path: "/faq",
  keywords: ["Vest payout FAQ", "does Vest pay", "Vest payout time", "Vest profit split"],
});

export default function FaqPage() {
  return (
    <>
      <JsonLd data={faqLd(PAYOUT_FAQS)} />
      <div className="mx-auto max-w-3xl px-4 pt-8 sm:px-6">
        <Breadcrumbs items={[{ name: "FAQ", path: "/faq" }]} />
        <h1 className="mt-5 text-3xl font-bold text-paper sm:text-5xl">Vest payout FAQ</h1>
        <p className="mt-4 text-lg text-paper/75">
          Short answers. The longer versions live in the <a className="text-mint underline underline-offset-4" href="/how-vest-payouts-work">payout guide</a> and the <a className="text-mint underline underline-offset-4" href="/methodology">methodology</a>.
        </p>
        <Accordion type="single" collapsible className="mt-8">
          {PAYOUT_FAQS.map((f, i) => (
            <AccordionItem key={f.q} value={`q${i}`} className="border-ink-800">
              <AccordionTrigger className="text-base font-semibold text-paper hover:no-underline">{f.q}</AccordionTrigger>
              <AccordionContent className="text-paper/75">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        <div className="mt-12">
          <ReferralPanel placement="faq" />
        </div>
      </div>
    </>
  );
}
