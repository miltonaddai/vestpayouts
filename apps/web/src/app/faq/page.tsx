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
      <div className="mx-auto max-w-3xl px-6 pt-8 pb-16 md:px-14 md:pb-24">
        <Breadcrumbs items={[{ name: "FAQ", path: "/faq" }]} />
        <p className="meta mt-6">§ Questions</p>
        <h1 className="mt-3 max-w-full text-[clamp(1.75rem,8vw,2.25rem)] leading-[0.96] font-medium tracking-[-0.035em] text-ink md:text-[56px]">Vest payout FAQ</h1>
        <p className="mt-4 text-lg text-sub">
          Short answers. The longer versions live in the <a className="text-ink underline decoration-line underline-offset-4 hover:decoration-signal" href="/how-vest-payouts-work">payout guide</a> and the <a className="text-ink underline decoration-line underline-offset-4 hover:decoration-signal" href="/methodology">methodology</a>.
        </p>
        <Accordion type="single" collapsible className="mt-8 border border-line">
          {PAYOUT_FAQS.map((f, i) => (
            <AccordionItem key={f.q} value={`q${i}`} className="border-line px-4">
              <AccordionTrigger className="text-base font-medium text-ink hover:no-underline">{f.q}</AccordionTrigger>
              <AccordionContent className="text-sub">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        <div className="mt-12 mb-4">
          <ReferralPanel placement="faq" />
        </div>
      </div>
    </>
  );
}
