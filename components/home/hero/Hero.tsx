"use client";

import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { useEffect, useState, type CSSProperties } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SLIDE_MS, SLIDES } from "./slides";
import { VehicleFinder } from "./VehicleFinder";

type Stats = { rating: number; reviews: number; cities: number };

export function Hero({ fitCounts, stats }: { fitCounts: Record<string, number>; stats: Stats }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const slide = SLIDES[index];

  useEffect(() => {
    if (paused) return;
    const id = setTimeout(() => setIndex((i) => (i + 1) % SLIDES.length), SLIDE_MS);
    return () => clearTimeout(id);
  }, [index, paused]);

  return (
    <section className="grain relative isolate overflow-clip bg-ink text-ink-foreground" aria-roledescription="carousel" aria-label="Featured">
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
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/70 to-ink/10" />
        <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-ink via-ink/60 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-ink/70 to-transparent" />
      </div>

      <div
        className="mx-auto grid min-h-[min(100dvh,860px)] max-w-[1600px] items-center gap-12 px-4 pb-36 pt-40 sm:px-6 lg:px-8 lg:grid-cols-[1.35fr_1fr] lg:pb-40"
        onPointerEnter={() => setPaused(true)}
        onPointerLeave={() => setPaused(false)}
      >
        <div>
          <div key={index} aria-live="polite">
            <p className="intro label-mono flex items-center gap-3 text-white/60" style={{ "--delay": "0ms" } as CSSProperties}>
              <span className="text-primary">
                {String(index + 1).padStart(2, "0")} / {String(SLIDES.length).padStart(2, "0")}
              </span>
              <span className="h-px w-8 bg-white/30" />
              {slide.eyebrow}
            </p>
            <h1 className="mt-6 font-display text-5xl font-extrabold leading-[0.95] sm:text-7xl xl:text-[6.25rem] 2xl:text-[7rem]">
              {slide.title.map((line, i) => (
                <span key={line} className="intro block" style={{ "--delay": `${100 + i * 110}ms` } as CSSProperties}>
                  {i === 1 ? <span className="text-primary">{line}</span> : line}
                </span>
              ))}
            </h1>
            <p className="intro mt-7 max-w-md text-lg leading-relaxed text-white/70" style={{ "--delay": "340ms" } as CSSProperties}>
              {slide.body}
            </p>
            <div className="intro mt-9 flex flex-wrap items-center gap-x-6 gap-y-3" style={{ "--delay": "440ms" } as CSSProperties}>
              <Button asChild size="xl" className="group">
                <a href={slide.cta.href}>
                  {slide.cta.label}
                  <ArrowRight className="transition-transform group-hover:translate-x-1" />
                </a>
              </Button>
              <a href="#deals" className="text-[15px] font-medium text-white/80 underline decoration-white/30 underline-offset-[6px] transition-colors hover:text-white hover:decoration-primary">
                See today&apos;s deals
              </a>
            </div>
          </div>

          {/* Proof row: computed from the live catalogue, so it stays static across slides. */}
          <dl className="intro mt-14 grid max-w-xl grid-cols-3 border-t border-white/15" style={{ "--delay": "560ms" } as CSSProperties}>
            {[
              { value: stats.rating.toFixed(1), label: "Average rating", star: true },
              { value: stats.reviews.toLocaleString("en-AU"), label: "Driver reviews" },
              { value: String(stats.cities), label: "Fitting cities" },
            ].map((s) => (
              <div key={s.label} className="flex flex-col-reverse border-r border-white/15 pr-4 pt-4 last:border-r-0 [&:not(:first-child)]:pl-4 sm:[&:not(:first-child)]:pl-6">
                <dt className="label-mono mt-1 text-white/45">{s.label}</dt>
                <dd className="font-display text-2xl font-bold sm:text-3xl">
                  {s.value}
                  {s.star && <span className="ml-1 text-primary">★</span>}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="intro lg:justify-self-end" style={{ "--delay": "300ms" } as CSSProperties}>
          <div className="w-full lg:w-[400px]">
            <VehicleFinder fitCounts={fitCounts} />
          </div>
        </div>
      </div>

      {/* Slide controls */}
      <div className="absolute inset-x-0 bottom-0 z-10">
        <div className="mx-auto flex max-w-[1600px] items-end justify-between gap-6 px-4 pb-8 sm:px-6 lg:px-8">
          <div className="flex flex-1 gap-4 sm:max-w-lg">
            {SLIDES.map((s, i) => (
              <button
                key={s.alt}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show slide ${i + 1}: ${s.eyebrow}`}
                aria-current={i === index}
                className="group flex-1 py-2 text-left"
              >
                <span className="relative block h-0.5 overflow-hidden rounded-full bg-white/20">
                  {i === index && (
                    <span
                      key={`${index}-${paused}`}
                      className="absolute inset-0 origin-left bg-primary"
                      style={{ animation: paused ? "none" : `fill ${SLIDE_MS}ms linear both` }}
                    />
                  )}
                  {i < index && <span className="absolute inset-0 bg-white/60" />}
                </span>
                <span className={cn("label-mono mt-3 hidden transition-colors sm:block", i === index ? "text-white" : "text-white/40 group-hover:text-white/70")}>
                  {s.eyebrow}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
