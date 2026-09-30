import { ArrowRight, MessageCircle, Star } from "lucide-react";
import Link from "next/link";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/Reveal";
import { COUPONS } from "@/lib/pricing";
import { SectionHeading } from "./SectionHeading";

const FAQS = [
  {
    q: "How do I know a part fits my car?",
    a: "Pick your make and model with “Select your vehicle” at the top of the page and we'll only show compatible parts. Every product page also shows a fitment check for your saved car. If something we said fits doesn't, we'll cover return postage.",
  },
  {
    q: "Will I keep my steering wheel controls and reverse camera?",
    a: "Yes. Our model-specific head units ship with the right harness and adaptor so steering wheel controls, factory reverse cameras and parking sensors keep working.",
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

type Stats = { rating: number; reviews: number };

/** Questions on the right; rating proof and a human fallback on the left. */
export function Faq({ stats }: { stats: Stats }) {
  return (
    <section id="faq" className="mx-auto max-w-[1440px] scroll-mt-32 px-4 pb-20 pt-16 sm:px-6 sm:pb-28 sm:pt-24 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[1fr_1.6fr] lg:gap-12">
        <div className="space-y-3">
          <SectionHeading eyebrow="Common questions" title="Frequently asked questions" description="Everything worth knowing before you order." className="mb-6 sm:mb-6" />
          <Reveal className="flex items-center gap-5 rounded-2xl border bg-card p-5">
            <span className="font-display text-5xl font-bold leading-none">{stats.rating.toFixed(1)}</span>
            <span>
              <span className="flex text-amber-400">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star key={i} className="size-4 fill-current" />
                ))}
              </span>
              <span className="mt-1 block text-sm text-muted-foreground">
                Average across {stats.reviews.toLocaleString("en-AU")} driver reviews
              </span>
            </span>
          </Reveal>
          <Reveal delay={80} className="rounded-2xl bg-ink p-6 text-ink-foreground">
            <MessageCircle className="size-6 text-primary" />
            <h3 className="mt-4 font-display text-xl font-bold">Still have questions?</h3>
            <p className="mt-1.5 text-sm text-white/60">Tell us about your car and our fitting team will recommend the right parts.</p>
            <Button asChild className="group mt-5 h-10 px-4">
              <Link href="/fitting">
                Talk to an expert <ArrowRight className="transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </Reveal>
        </div>

        <Reveal>
          <Accordion type="single" collapsible defaultValue={FAQS[0].q} className="space-y-2">
            {FAQS.map((f) => (
              <AccordionItem key={f.q} value={f.q} className="rounded-xl border bg-card px-5 last:border-b data-[state=open]:border-primary/40">
                <AccordionTrigger className="py-5 text-left text-base font-semibold hover:no-underline">{f.q}</AccordionTrigger>
                <AccordionContent className="pb-5 text-[15px] leading-relaxed text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  );
}
