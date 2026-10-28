"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** A compact main photo with an easy-to-browse horizontal thumbnail row. */
export function ProductGallery({ images, name, flags }: { images: string[]; name: string; flags: { label: string; tone: "deal" | "badge" }[] }) {
  const [index, setIndex] = useState(0);
  const thumbnails = useRef<HTMLUListElement>(null);
  const go = (delta: number) => setIndex((current) => (current + delta + images.length) % images.length);
  const scrollThumbnails = (direction: -1 | 1) => {
    const list = thumbnails.current;
    if (list) list.scrollBy({ left: direction * list.clientWidth * 0.7, behavior: "smooth" });
  };

  return (
    <div className="space-y-3">
      <div
        className="group relative h-[240px] overflow-hidden rounded-2xl border bg-muted/20 sm:h-[300px]"
        tabIndex={0}
        aria-roledescription="carousel"
        aria-label={`${name} photos`}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") go(-1);
          if (event.key === "ArrowRight") go(1);
        }}
      >
        {images.map((src, imageIndex) => (
          <div key={src} className={cn("absolute inset-0 transition-opacity duration-200", imageIndex === index ? "opacity-100" : "pointer-events-none opacity-0")}>
            <Image
              src={src}
              alt={imageIndex === 0 ? name : `${name}, photo ${imageIndex + 1}`}
              fill
              preload={imageIndex === 0}
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="object-contain p-5 sm:p-7"
              aria-hidden={imageIndex !== index}
            />
          </div>
        ))}

        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {flags.map((flag) => (
            <span key={flag.label} className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-sm", flag.tone === "deal" ? "bg-primary text-primary-foreground" : "bg-white/90 text-foreground backdrop-blur")}>
              {flag.label}
            </span>
          ))}
        </div>

        {images.length > 1 && (
          <>
            <button type="button" onClick={() => go(-1)} aria-label="Previous photo" className="absolute left-3 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-foreground shadow-md hover:bg-white">
              <ChevronLeft className="size-5" />
            </button>
            <button type="button" onClick={() => go(1)} aria-label="Next photo" className="absolute right-3 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-foreground shadow-md hover:bg-white">
              <ChevronRight className="size-5" />
            </button>
            <span className="absolute bottom-3 right-3 rounded-full bg-ink/70 px-2.5 py-1 font-mono text-xs text-white" aria-live="polite">
              Photo {index + 1} of {images.length}
            </span>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => scrollThumbnails(-1)} aria-label="Scroll to previous thumbnails" className="grid size-8 shrink-0 place-items-center rounded-full border bg-card text-muted-foreground hover:text-foreground">
            <ChevronLeft className="size-4" />
          </button>
          <ul ref={thumbnails} className="no-scrollbar flex min-w-0 flex-1 snap-x gap-2 overflow-x-auto py-1">
            {images.map((src, imageIndex) => (
              <li key={src} className="shrink-0 snap-start">
                <button
                  type="button"
                  onClick={() => setIndex(imageIndex)}
                  aria-label={`Show photo ${imageIndex + 1}`}
                  aria-current={imageIndex === index}
                  className={cn("relative size-14 overflow-hidden rounded-lg border-2 bg-muted/20 transition-colors sm:size-16", imageIndex === index ? "border-primary" : "border-transparent hover:border-border")}
                >
                  <Image src={src} alt="" fill sizes="64px" className="object-contain p-1" />
                </button>
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => scrollThumbnails(1)} aria-label="Scroll to next thumbnails" className="grid size-8 shrink-0 place-items-center rounded-full border bg-card text-muted-foreground hover:text-foreground">
            <ChevronRight className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}
