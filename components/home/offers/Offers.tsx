import Image from "next/image";
import { Reveal } from "@/components/ui/Reveal";
import { OFFERS } from "@/lib/data";
import { SectionHeading } from "../SectionHeading";
import { CopyCodeButton } from "./CopyCodeButton";

/** Coupon tickets: photo stub on the left, perforation, then the offer and its code. */
export function Offers() {
  return (
    <section id="offers" className="mx-auto max-w-[1440px] scroll-mt-32 px-4 pt-16 sm:px-6 sm:pt-24 lg:px-8">
      <SectionHeading eyebrow="Offers & codes" title="Stack the savings" description="Copy a code and apply it at checkout. One code per order." />
      <ul className="grid gap-3 sm:gap-4 lg:grid-cols-3">
        {OFFERS.map((offer, i) => (
          <Reveal as="li" key={offer.id} delay={i * 90}>
            <article className="relative grid h-full grid-cols-[112px_1fr] overflow-clip rounded-2xl border bg-card sm:grid-cols-[140px_1fr]">
              <div className="relative">
                <Image src={offer.image} alt="" fill sizes="140px" className="object-cover" />
                <div className="absolute inset-0 bg-ink/35" />
              </div>
              {/* Perforation between stub and body. */}
              <span aria-hidden className="absolute -top-2.5 left-[102px] size-5 rounded-full border bg-background sm:left-[130px]" />
              <span aria-hidden className="absolute -bottom-2.5 left-[102px] size-5 rounded-full border bg-background sm:left-[130px]" />
              <div className="flex flex-col gap-3 border-l border-dashed p-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{offer.title}</p>
                  <p className="mt-1 font-display text-3xl font-extrabold leading-none text-primary">{offer.highlight}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{offer.subtitle}</p>
                </div>
                <div className="mt-auto">
                  <CopyCodeButton code={offer.code} />
                </div>
              </div>
            </article>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}
