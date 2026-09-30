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
    <section id="faq" className="scroll-mt-20 pb-24 sm:pb-32">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <SectionHeading index="07" eyebrow="Questions" title="Good to know" description="Everything worth knowing before you order." />
        <Reveal className="grid lg:grid-cols-5">
          <Accordion type="single" collapsible className="border-t border-foreground/15 lg:col-span-3 lg:col-start-3">
            {FAQS.map((f, i) => (
              <AccordionItem key={f.q} value={f.q} className="border-foreground/10">
                <AccordionTrigger className="gap-4 py-6 text-base font-medium hover:no-underline sm:text-lg aria-expanded:[&>span:first-child]:text-primary">
                  <span className="label-mono w-6 shrink-0 pt-1.5 text-muted-foreground transition-colors">{String(i + 1).padStart(2, "0")}</span>
                  <span className="flex-1">{f.q}</span>
                </AccordionTrigger>
                <AccordionContent className="max-w-2xl pl-10 text-[15px] leading-relaxed text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  );
}
