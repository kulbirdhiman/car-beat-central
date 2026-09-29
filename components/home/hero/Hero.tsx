"use client";

import { ArrowRight, BadgeCheck, Truck, Wrench } from "lucide-react";
import Image from "next/image";
import { useEffect, useState, type CSSProperties } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SLIDE_MS, SLIDES } from "./slides";
import { VehicleFinder } from "./VehicleFinder";

const PERKS = [
  { icon: Truck, label: "Free shipping over $99" },
  { icon: Wrench, label: "Pro fitting, every capital" },
  { icon: BadgeCheck, label: "Guaranteed fitment" },
];

export function Hero({ fitCounts }: { fitCounts: Record<string, number> }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const slide = SLIDES[index];

  useEffect(() => {
    if (paused) return;
    const id = setTimeout(() => setIndex((i) => (i + 1) % SLIDES.length), SLIDE_MS);
    return () => clearTimeout(id);
  }, [index, paused]);

  return (
    <section className="relative isolate overflow-clip bg-ink text-ink-foreground" aria-roledescription="carousel" aria-label="Featured">
      {/* Photos: all mounted, only the active one visible, so switching is a crossfade. */}
      <div className="absolute inset-0 -z-10">
        {SLIDES.map((s, i) => (
          <div
            key={s.alt}
            className={cn("absolute inset-0 transition-opacity duration-1000", i === index ? "opacity-100" : "opacity-0")}
            aria-hidden={i !== index}
          >
            <Image
              src={s.image}
              alt={s.alt}
              fill
              sizes="100vw"
              placeholder="blur"
              preload={i === 0}
              className={cn("object-cover", i === index && "animate-kenburns")}
            />
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/10" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/70 to-transparent" />
      </div>

      <div
        className="mx-auto grid min-h-[min(80vh,760px)] max-w-7xl items-center gap-10 px-4 pb-24 pt-36 sm:px-6 lg:grid-cols-[1.25fr_1fr] lg:pb-32"
        onPointerEnter={() => setPaused(true)}
        onPointerLeave={() => setPaused(false)}
      >
        <div key={index} aria-live="polite">
          <Badge variant="outline" className="intro h-7 border-white/25 bg-white/10 px-3 text-white backdrop-blur" style={{ "--delay": "0ms" } as CSSProperties}>
            <span className="size-1.5 rounded-full bg-primary" /> {slide.eyebrow}
          </Badge>
          <h1 className="mt-5 font-display text-6xl font-extrabold uppercase leading-[0.88] tracking-tight sm:text-8xl">
            {slide.title.map((line, i) => (
              <span key={line} className="intro block" style={{ "--delay": `${100 + i * 110}ms` } as CSSProperties}>
                {i === 1 ? <span className="text-primary">{line}</span> : line}
              </span>
            ))}
          </h1>
          <p className="intro mt-6 max-w-lg text-lg text-white/75 text-pretty" style={{ "--delay": "340ms" } as CSSProperties}>
            {slide.body}
          </p>
          <div className="intro mt-8 flex flex-wrap gap-3" style={{ "--delay": "440ms" } as CSSProperties}>
            <Button asChild size="lg" className="group h-12 rounded-full px-6 text-base">
              <a href={slide.cta.href}>
                {slide.cta.label}
                <ArrowRight className="transition-transform group-hover:translate-x-1" />
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 rounded-full border-white/30 bg-white/5 px-6 text-base text-white backdrop-blur hover:bg-white hover:text-foreground">
              <a href="#deals">See today&apos;s deals</a>
            </Button>
          </div>
        </div>

        <div className="intro lg:justify-self-end" style={{ "--delay": "300ms" } as CSSProperties}>
          <div className="w-full lg:w-[400px]">
            <VehicleFinder fitCounts={fitCounts} />
          </div>
        </div>
      </div>

      {/* Slide controls */}
      <div className="absolute inset-x-0 bottom-0">
        <div className="mx-auto flex max-w-7xl items-end justify-between gap-6 px-4 pb-8 sm:px-6">
          <div className="flex flex-1 gap-3 sm:max-w-md">
            {SLIDES.map((s, i) => (
              <button
                key={s.alt}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show slide ${i + 1}: ${s.eyebrow}`}
                aria-current={i === index}
                className="group flex-1 text-left"
              >
                <span className="relative block h-0.5 overflow-hidden rounded-full bg-white/25">
                  {i === index && (
                    <span
                      key={`${index}-${paused}`}
                      className="absolute inset-0 origin-left bg-primary"
                      style={{ animation: paused ? "none" : `fill ${SLIDE_MS}ms linear both` }}
                    />
                  )}
                  {i < index && <span className="absolute inset-0 bg-white/70" />}
                </span>
                <span className={cn("mt-2 hidden text-xs transition-colors sm:block", i === index ? "text-white" : "text-white/50 group-hover:text-white/80")}>
                  {s.eyebrow}
                </span>
              </button>
            ))}
          </div>
          <ul className="hidden gap-6 text-sm text-white/75 lg:flex">
            {PERKS.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2">
                <Icon className="size-4 text-primary" /> {label}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
