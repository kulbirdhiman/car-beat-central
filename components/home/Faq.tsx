import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Reveal } from "@/components/ui/Reveal";
import { COUPONS } from "@/lib/pricing";
import { SectionHeading } from "./SectionHeading";

const FAQS = [
  {
    q: "How do I know a part fits my car?",
    a: "Pick your make and model in the finder at the top of the page and we'll only show compatible parts. Every product page also shows a fitment check for your saved car. If something we said fits doesn't, we'll cover return postage.",
  },
  {
    q: "How much is delivery?",
    a: "Standard delivery is free on orders over $99, otherwise $9.95 Australia-wide. Express (1-2 business days) is $14.95, and click & collect from a fitting partner is free.",
  },
  {
    q: "Can I return something?",
    a: "Yes. You have 30 days for change-of-mind returns on unused items in original packaging, plus your full rights under Australian Consumer Law for faulty goods.",
  },
  {
    q: "Do you install?",
    a: "Our partner installers work in every capital city, Monday to Saturday. Book online and we'll confirm a time within one business day.",
  },
  {
    q: "How do the offer codes work?",
    a: `Enter one code at checkout. ${Object.entries(COUPONS)
      .map(([code, text]) => `${code}: ${text.charAt(0).toLowerCase()}${text.slice(1)}`)
      .join(". ")}.`,
  },
];

export function Faq() {
  return (
    <section id="faq" className="scroll-mt-20 bg-secondary/60 py-20 sm:py-28">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1.4fr]">
        <div className="self-start lg:sticky lg:top-28">
          <SectionHeading eyebrow="Questions" title="Good to know" description="Everything worth knowing before you order." />
        </div>
        <Reveal>
          <Accordion type="single" collapsible className="rounded-2xl border bg-card px-6">
            {FAQS.map((f) => (
              <AccordionItem key={f.q} value={f.q}>
                <AccordionTrigger className="py-5 text-base">{f.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  );
}
