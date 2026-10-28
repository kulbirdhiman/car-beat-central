"use client";

import { ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

/** Compact product gallery with a vertical desktop thumbnail rail and a mobile strip. */
export function ProductGallery({ images, name, flags }: { images: string[]; name: string; flags: { label: string; tone: "deal" | "badge" }[] }) {
  const [index, setIndex] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const go = (delta: number) => setIndex((current) => (current + delta + images.length) % images.length);
  const selectedImage = images[index];

  return (
    <>
      <div className="w-full max-w-[760px] rounded-2xl border bg-card p-2.5 shadow-sm sm:rounded-3xl sm:p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[76px_minmax(0,1fr)] sm:gap-4">
          {images.length > 1 && (
            <ul className="order-2 no-scrollbar flex snap-x gap-2 overflow-x-auto py-0.5 sm:order-1 sm:max-h-[500px] sm:flex-col sm:overflow-x-hidden sm:overflow-y-auto sm:py-0">
              {images.map((src, imageIndex) => (
                <li key={`${src}-${imageIndex}`} className="shrink-0 snap-start">
                  <button
                    type="button"
                    onClick={() => setIndex(imageIndex)}
                    aria-label={`Show photo ${imageIndex + 1}`}
                    aria-current={imageIndex === index}
                    className={cn(
                      "relative size-[68px] overflow-hidden rounded-xl border-[3px] bg-muted/20 transition-colors sm:size-[76px]",
                      imageIndex === index ? "border-primary" : "border-border hover:border-primary/50",
                    )}
                  >
                    <Image src={src} alt="" fill sizes="76px" className="object-cover" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div
            className="group relative order-1 h-[300px] overflow-hidden rounded-xl bg-muted/20 sm:order-2 sm:h-[420px] lg:h-[500px]"
            tabIndex={0}
            aria-roledescription="carousel"
            aria-label={`${name} photos`}
            onKeyDown={(event) => {
              if (event.key === "ArrowLeft") go(-1);
              if (event.key === "ArrowRight") go(1);
            }}
          >
            {selectedImage && (
              <Image
                key={selectedImage}
                src={selectedImage}
                alt={name}
                fill
                preload={index === 0}
                sizes="(min-width: 1024px) 42vw, 100vw"
                className="object-contain p-2 sm:p-3"
              />
            )}

            {flags.length > 0 && (
              <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                {flags.map((flag) => (
                  <span key={flag.label} className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-sm", flag.tone === "deal" ? "bg-primary text-primary-foreground" : "bg-white/90 text-foreground backdrop-blur")}>
                    {flag.label}
                  </span>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => setZoomOpen(true)}
              aria-label="Enlarge product photo"
              className="absolute right-3 top-3 grid size-10 place-items-center rounded-full bg-white/90 text-foreground shadow-sm backdrop-blur transition hover:bg-white"
            >
              <ZoomIn className="size-5" />
            </button>

            {images.length > 1 && (
              <>
                <button type="button" onClick={() => go(-1)} aria-label="Previous photo" className="absolute left-3 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-foreground shadow-sm transition hover:bg-white sm:hidden">
                  <ChevronLeft className="size-5" />
                </button>
                <button type="button" onClick={() => go(1)} aria-label="Next photo" className="absolute right-3 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-foreground shadow-sm transition hover:bg-white sm:hidden">
                  <ChevronRight className="size-5" />
                </button>
                <span className="absolute bottom-3 right-3 rounded-full bg-ink/70 px-2.5 py-1 font-mono text-xs text-white" aria-live="polite">
                  {index + 1} / {images.length}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
        <DialogContent className="h-[min(90vh,900px)] w-[min(94vw,1200px)] max-w-none border-0 bg-black/95 p-3 sm:p-5" aria-describedby={undefined}>
          <DialogTitle className="sr-only">{name} photo</DialogTitle>
          {selectedImage && <div className="relative h-full min-h-0 w-full"> <Image src={selectedImage} alt={name} fill sizes="94vw" className="object-contain" /> </div>}
          {images.length > 1 && (
            <div className="absolute inset-x-3 top-1/2 flex -translate-y-1/2 justify-between">
              <button type="button" onClick={() => go(-1)} aria-label="Previous photo" className="grid size-10 place-items-center rounded-full bg-white/90 text-foreground shadow"><ChevronLeft className="size-5" /></button>
              <button type="button" onClick={() => go(1)} aria-label="Next photo" className="grid size-10 place-items-center rounded-full bg-white/90 text-foreground shadow"><ChevronRight className="size-5" /></button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
