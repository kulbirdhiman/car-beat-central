import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import { Reveal } from "@/components/ui/Reveal";
import Link from "next/link";
import { CATEGORY_IMAGES, CATEGORY_LABELS } from "@/lib/data";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";
import { SectionHeading } from "./SectionHeading";

// Bento layout: the first tile is large, the rest fill around it.
const TILES: { category: Category; className: string }[] = [
  { category: "stereo", className: "sm:col-span-2 sm:row-span-2" },
  { category: "subwoofer", className: "" },
  { category: "speaker", className: "" },
  { category: "dashcam", className: "" },
  { category: "lighting", className: "" },
];

export function CategoryGrid({ counts }: { counts: Partial<Record<Category, number>> }) {
  return (
    <section id="categories" className="scroll-mt-24 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading eyebrow="Shop by category" title="Everything your car's missing" />
        <div className="grid auto-rows-[220px] grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {TILES.map(({ category, className }, i) => {
            const count = counts[category] ?? 0;
            return (
              <Reveal key={category} delay={i * 80} className={cn("col-span-2 sm:col-span-1", className)}>
                <Link href={`/shop?category=${category}`} className="group relative block size-full overflow-clip rounded-2xl bg-muted">
                  <Image
                    src={CATEGORY_IMAGES[category]!}
                    alt={CATEGORY_LABELS[category]}
                    fill
                    sizes={i === 0 ? "(min-width: 1024px) 50vw, 100vw" : "(min-width: 1024px) 25vw, 50vw"}
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity group-hover:from-black/90" />
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5 text-white">
                    <div>
                      <h3 className={cn("font-display font-bold uppercase leading-none", i === 0 ? "text-4xl sm:text-5xl" : "text-2xl")}>
                        {CATEGORY_LABELS[category]}
                      </h3>
                      <p className="mt-1 text-sm text-white/70">{count} {count === 1 ? "product" : "products"}</p>
                    </div>
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white/15 backdrop-blur transition-all duration-300 group-hover:rotate-45 group-hover:bg-primary">
                      <ArrowUpRight className="size-5" />
                    </span>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
