import Image from "next/image";
import { Reveal } from "@/components/ui/Reveal";
import { OFFERS } from "@/lib/data";
import type { Offer } from "@/lib/types";
import { cn } from "@/lib/utils";
import { SectionHeading } from "../SectionHeading";
import { CopyCodeButton } from "./CopyCodeButton";

export function Offers() {
  const [feature, ...rest] = OFFERS;

  return (
    <section id="offers" className="scroll-mt-20 pb-20 sm:pb-28">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <SectionHeading
          index="04"
          eyebrow="This week's offers"
          title="Save on your next upgrade"
          description="Copy a code and apply it at checkout. One code per order."
        />
        <div className="grid gap-2 sm:gap-3 lg:grid-cols-5 lg:grid-rows-2">
          <Reveal className="lg:col-span-3 lg:row-span-2">
            <OfferCard offer={feature} large />
          </Reveal>
          {rest.map((offer, i) => (
            <Reveal key={offer.id} delay={(i + 1) * 120} className="lg:col-span-2">
              <OfferCard offer={offer} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function OfferCard({ offer, large }: { offer: Offer; large?: boolean }) {
  return (
    <article className={cn("group relative flex h-full flex-col justify-between overflow-clip rounded-xl bg-ink text-white", large ? "min-h-[480px]" : "min-h-[240px]")}>
      <Image
        src={offer.image}
        alt=""
        fill
        sizes={large ? "(min-width: 1024px) 60vw, 100vw" : "(min-width: 1024px) 40vw, 100vw"}
        className="object-cover opacity-90 transition-transform duration-1000 ease-out group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-ink/10" />
      <p className="label-mono relative p-5 text-white/80 sm:p-6">{offer.title}</p>
      <div className="relative flex flex-wrap items-end justify-between gap-5 p-5 sm:p-6">
        <div>
          <p className={cn("font-display font-extrabold leading-[0.9]", large ? "text-6xl sm:text-8xl" : "text-5xl")}>{offer.highlight}</p>
          <p className="mt-3 max-w-sm text-sm text-white/75 sm:text-base">{offer.subtitle}</p>
        </div>
        <CopyCodeButton code={offer.code} />
      </div>
    </article>
  );
}
