"use client";

import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import { Button } from "@/components/ui/button";
import type { Offer } from "@/lib/types";
import { cn } from "@/lib/utils";
import { SLIDE_MS, type Slide } from "./slides";
import { VehicleSearchCard } from "./VehicleSearchCard";

/** Banner carousel on the left; on the right, the vehicle search tile above a promo tile. */
export function Hero({ slides, promo, fitCounts }: { slides: Slide[]; promo?: Offer; fitCounts: Record<string, number> }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const slide = slides[index];
  const go = (delta: number) => setIndex((i) => (i + delta + slides.length) % slides.length);

  useEffect(() => {
    if (paused) return;
    const id = setTimeout(() => setIndex((i) => (i + 1) % slides.length), SLIDE_MS);
    return () => clearTimeout(id);
  }, [index, paused, slides.length]);

  return (
    <section className="mx-auto grid max-w-[1440px] gap-3 px-4 pt-4 sm:px-6 sm:pt-6 lg:grid-cols-[2fr_1fr] lg:px-8">
      <div
        className="grain relative isolate flex min-h-[440px] items-center overflow-clip rounded-2xl bg-ink text-white sm:min-h-[480px]"
        aria-roledescription="carousel"
        aria-label="Featured"
        onPointerEnter={() => setPaused(true)}
        onPointerLeave={() => setPaused(false)}
      >
        {/* All photos mounted, only the active one visible, so switching is a crossfade. */}
        {slides.map((s, i) => (
          <div key={s.alt} className={cn("absolute inset-0 -z-10 transition-opacity duration-1000", i === index ? "opacity-100" : "opacity-0")} aria-hidden={i !== index}>
            <Image
              src={s.image}
              alt={s.alt}
              fill
              sizes="(min-width: 1024px) 66vw, 100vw"
              placeholder="blur"
              preload={i === 0}
              className={cn("object-cover", i === index && "animate-kenburns")}
            />
          </div>
        ))}
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink/95 via-ink/60 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-ink/80 to-transparent" />

        <div key={index} className="relative z-10 max-w-lg px-6 pb-24 pt-10 sm:px-10 lg:px-12" aria-live="polite">
          <p className="intro inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur" style={{ "--delay": "0ms" } as CSSProperties}>
            <span className="size-1.5 rounded-full bg-primary" /> {slide.eyebrow}
          </p>
          <h1 className="intro mt-5 font-display text-4xl font-extrabold leading-[1] sm:text-5xl lg:text-6xl" style={{ "--delay": "80ms" } as CSSProperties}>
            {slide.title}
          </h1>
          <p className="intro mt-4 text-base text-white/75 sm:text-lg" style={{ "--delay": "180ms" } as CSSProperties}>
            {slide.body}
          </p>
          <div className="intro mt-7 flex flex-wrap items-center gap-4" style={{ "--delay": "260ms" } as CSSProperties}>
            <Button asChild size="xl" className="group">
              <Link href={slide.cta.href}>
                {slide.cta.label}
                <ArrowRight className="transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            {slide.price && <span className="font-display text-xl font-bold text-primary">{slide.price}</span>}
          </div>
        </div>

        {/* Controls: arrows plus progress dots. */}
        <div className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-between gap-4 p-5 sm:px-10 lg:px-12">
          <div className="flex gap-2">
            {slides.map((s, i) => (
              <button
                key={s.alt}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show slide ${i + 1}: ${s.eyebrow}`}
                aria-current={i === index}
                className={cn("relative h-1.5 overflow-hidden rounded-full bg-white/25 transition-all", i === index ? "w-10" : "w-4 hover:bg-white/50")}
              >
                {i === index && (
                  <span
                    key={`${index}-${paused}`}
                    className="absolute inset-0 origin-left rounded-full bg-primary"
                    style={{ animation: paused ? "none" : `fill ${SLIDE_MS}ms linear both` }}
                  />
                )}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon-lg" className="rounded-full border-white/20 bg-white/10 text-white backdrop-blur hover:bg-white hover:text-foreground" onClick={() => go(-1)} aria-label="Previous slide">
              <ChevronLeft />
            </Button>
            <Button variant="outline" size="icon-lg" className="rounded-full border-white/20 bg-white/10 text-white backdrop-blur hover:bg-white hover:text-foreground" onClick={() => go(1)} aria-label="Next slide">
              <ChevronRight />
            </Button>
          </div>
        </div>
      </div>

      {/* The promo is hidden on phones so deals come sooner; its code is also in the Offers section. */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        <VehicleSearchCard fitCounts={fitCounts} />
        {promo && (
          <Link href="/#offers" className="group relative isolate hidden min-h-[200px] flex-col justify-end overflow-clip rounded-2xl bg-ink p-6 text-white sm:flex">
            <Image src={promo.image} alt="" fill sizes="(min-width: 1024px) 33vw, 50vw" className="-z-10 object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/95 via-ink/50 to-ink/10" />
            <p className="text-xs font-semibold uppercase tracking-wider text-white/70">{promo.title}</p>
            <p className="mt-1 font-display text-4xl font-extrabold leading-none">{promo.highlight}</p>
            <p className="mt-2 max-w-xs text-sm text-white/75">{promo.subtitle}</p>
            <p className="mt-4 flex items-center justify-between text-sm">
              {promo.code ? (
                <span>
                  Code <span className="rounded border border-dashed border-white/40 px-1.5 py-0.5 font-mono font-semibold tracking-wider">{promo.code}</span>
                </span>
              ) : (
                <span className="font-semibold">See the offer</span>
              )}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </p>
          </Link>
        )}
      </div>
    </section>
  );
}
