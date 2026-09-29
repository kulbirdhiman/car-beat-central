import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/ui/Reveal";
import { OFFERS } from "@/lib/data";
import type { Offer } from "@/lib/types";
import { cn } from "@/lib/utils";
import { SectionHeading } from "../SectionHeading";
import { CopyCodeButton } from "./CopyCodeButton";

export function Offers() {
  const [feature, ...rest] = OFFERS;

  return (
    <section id="offers" className="scroll-mt-20 pb-20 pt-16 sm:pb-24 sm:pt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading eyebrow="This week's offers" title="Save on your next upgrade" description="Copy a code and apply it at checkout. One code per order." />
        <div className="grid gap-4 lg:grid-cols-5 lg:grid-rows-2">
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
    <article className={cn("group relative flex h-full flex-col justify-end overflow-clip rounded-3xl text-white", large ? "min-h-[460px]" : "min-h-[240px]")}>
      <Image
        src={offer.image}
        alt=""
        fill
        sizes={large ? "(min-width: 1024px) 60vw, 100vw" : "(min-width: 1024px) 40vw, 100vw"}
        className="object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/5" />
      <div className="relative flex flex-wrap items-end justify-between gap-5 p-6 sm:p-8">
        <div>
          <Badge className="mb-3">{offer.title}</Badge>
          <p className={cn("font-display font-extrabold uppercase leading-none", large ? "text-7xl sm:text-8xl" : "text-5xl")}>
            {offer.highlight}
          </p>
          <p className="mt-2 max-w-sm text-white/80">{offer.subtitle}</p>
        </div>
        <CopyCodeButton code={offer.code} />
      </div>
    </article>
  );
}
