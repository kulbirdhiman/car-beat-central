"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

/** Main photo with arrows and a counter, thumbnails underneath. Arrow keys work when focused. */
export function ProductGallery({ images, name, flags }: { images: string[]; name: string; flags: { label: string; tone: "deal" | "badge" }[] }) {
  const [index, setIndex] = useState(0);
  const go = (delta: number) => setIndex((i) => (i + delta + images.length) % images.length);

  return (
    <div>
      <div
        className="group relative aspect-square overflow-hidden rounded-2xl border bg-card sm:aspect-[4/3]"
        tabIndex={0}
        aria-roledescription="carousel"
        aria-label={`${name} photos`}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") go(-1);
          if (e.key === "ArrowRight") go(1);
        }}
      >
        {images.map((src, i) => (
          <Image
            key={src}
            src={src}
            alt={i === 0 ? name : `${name}, photo ${i + 1}`}
            fill
            preload={i === 0}
            sizes="(min-width: 1024px) 50vw, 100vw"
            className={cn("object-cover transition-[opacity,transform] duration-500 group-hover:scale-[1.03]", i === index ? "opacity-100" : "opacity-0")}
            aria-hidden={i !== index}
          />
        ))}

        <div className="absolute left-4 top-4 flex gap-2">
          {flags.map((f) => (
            <span
              key={f.label}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold",
                f.tone === "deal" ? "bg-primary text-primary-foreground" : "bg-white/90 text-foreground backdrop-blur",
              )}
            >
              {f.label}
            </span>
          ))}
        </div>

        {images.length > 1 && (
          <>
            <div className="absolute inset-x-4 top-1/2 flex -translate-y-1/2 justify-between opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-visible:opacity-100">
              <button type="button" onClick={() => go(-1)} aria-label="Previous photo" className="grid size-10 place-items-center rounded-full bg-white/90 text-foreground shadow-md backdrop-blur hover:bg-white">
                <ChevronLeft className="size-5" />
              </button>
              <button type="button" onClick={() => go(1)} aria-label="Next photo" className="grid size-10 place-items-center rounded-full bg-white/90 text-foreground shadow-md backdrop-blur hover:bg-white">
                <ChevronRight className="size-5" />
              </button>
            </div>
            <span className="absolute bottom-4 right-4 rounded-full bg-ink/70 px-2.5 py-1 font-mono text-xs text-white backdrop-blur" aria-live="polite">
              {index + 1} / {images.length}
            </span>
          </>
        )}
      </div>

      {images.length > 1 && (
        <ul className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
          {images.map((src, i) => (
            <li key={src} className="shrink-0">
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show photo ${i + 1}`}
                aria-current={i === index}
                className={cn(
                  "relative block size-16 overflow-hidden rounded-xl border-2 sm:size-[72px] bg-card transition-[border-color,opacity]",
                  i === index ? "border-primary" : "border-transparent opacity-70 hover:opacity-100",
                )}
              >
                <Image src={src} alt="" fill sizes="100px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
