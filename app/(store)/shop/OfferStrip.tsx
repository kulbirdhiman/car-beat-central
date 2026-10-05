"use client";

import { ArrowRight, BadgePercent, Check, ChevronRight, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { CopyCodeButton } from "@/components/home/offers/CopyCodeButton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { Offer } from "@/lib/types";

const HOW_TO = ["Add the parts you want to your cart", "Paste the code at checkout", "The discount comes off before you pay"];

/** Offer tiles above the grid. Each opens a detail sheet with the code, how to use it, and a shop link. */
export function OfferStrip({ offers, dealCount }: { offers: Offer[]; dealCount: number }) {
  return (
    <section aria-label="Current offers">
      <div className="mb-2.5 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <BadgePercent className="size-4 text-primary" /> Offers for you
        </h2>
        <p className="text-xs text-muted-foreground">Tap an offer for details</p>
      </div>
      <ul className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-2 sm:px-0 xl:grid-cols-4">
        <li className="w-[78%] shrink-0 snap-start sm:w-auto">
          <Link
            href="/shop?sale=1"
            className="group relative isolate flex h-full min-h-[104px] flex-col justify-between overflow-clip rounded-2xl bg-primary p-4 text-primary-foreground"
          >
            <div className="absolute -bottom-10 -right-10 -z-10 size-36 rounded-full bg-white/15 blur-2xl" />
            <Zap className="size-5 fill-current" />
            <div>
              <p className="font-display text-lg font-extrabold leading-tight">Today&apos;s deals</p>
              <p className="mt-0.5 flex items-center gap-1 text-sm text-white/85">
                {dealCount} price drops, ending midnight <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </p>
            </div>
          </Link>
        </li>
        {offers.map((offer) => (
          <li key={offer.id} className="w-[78%] shrink-0 snap-start sm:w-auto">
            <OfferTile offer={offer} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function OfferTile({ offer }: { offer: Offer }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="group relative isolate flex h-full min-h-[104px] w-full flex-col justify-between overflow-clip rounded-2xl bg-ink p-4 text-left text-white"
        >
          <Image src={offer.image} alt="" fill sizes="(min-width: 1280px) 22vw, (min-width: 640px) 45vw, 78vw" className="-z-10 object-cover opacity-50 transition-transform duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink via-ink/80 to-ink/30" />
          <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">{offer.title}</p>
          <div>
            <p className="font-display text-xl font-extrabold leading-none">{offer.highlight}</p>
            <p className="mt-2 flex items-center justify-between gap-2 text-xs">
              {offer.code ? (
                <span className="rounded border border-dashed border-white/50 px-1.5 py-0.5 font-mono font-semibold tracking-wider">{offer.code}</span>
              ) : (
                <span />
              )}
              <span className="flex items-center gap-0.5 font-semibold text-white/85 group-hover:text-white">
                View offer <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </p>
          </div>
        </button>
      </DialogTrigger>

      <DialogContent className="overflow-hidden p-0 sm:max-w-md">
        <div className="relative isolate h-40 bg-ink p-6 text-white">
          <Image src={offer.image} alt="" fill sizes="448px" className="-z-10 object-cover opacity-60" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/60 to-transparent" />
          <p className="absolute bottom-5 left-6 font-display text-4xl font-extrabold leading-none">{offer.highlight}</p>
        </div>
        <div className="p-6 pt-5">
          <DialogTitle className="font-display text-xl font-bold">{offer.title}</DialogTitle>
          <DialogDescription className="mt-1">{offer.subtitle}</DialogDescription>

          {offer.code && (
            <>
              <div className="mt-5 flex items-center justify-between gap-3 rounded-xl bg-secondary p-3">
                <span className="text-sm text-muted-foreground">Your code</span>
                <CopyCodeButton code={offer.code} />
              </div>

              <p className="mt-5 text-sm font-semibold">How to use it</p>
              <ol className="mt-2 space-y-2 text-sm text-muted-foreground">
                {HOW_TO.map((step, i) => (
                  <li key={step} className="flex items-center gap-2.5">
                    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary/10 font-mono text-[11px] font-bold text-primary">{i + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
              <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Check className="size-3.5 text-success" /> One code per order.
              </p>
            </>
          )}

          <DialogClose asChild>
            <Button asChild size="xl" className="mt-5 w-full">
              <Link href={offer.href}>
                Shop this offer <ArrowRight />
              </Link>
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
