import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import { CATEGORY_IMAGES, CATEGORY_LABELS } from "@/lib/data";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";
import { SectionHeading } from "./SectionHeading";

// Bento layout: one tall feature tile, a wide tile, then three regular ones.
const TILES: { category: Category; className: string; blurb?: string }[] = [
  { category: "stereo", className: "lg:col-span-2 lg:row-span-2", blurb: "Wireless CarPlay & Android Auto head units, with dash kits for your model." },
  { category: "subwoofer", className: "col-span-2" },
  { category: "speaker", className: "" },
  { category: "dashcam", className: "" },
  { category: "lighting", className: "col-span-2 lg:col-span-4", blurb: "LED headlights, fogs and ambient kits. Road-legal where it matters." },
];

export function CategoryGrid({ counts }: { counts: Partial<Record<Category, number>> }) {
  return (
    <section id="categories" className="scroll-mt-24 pb-20 pt-16 sm:pb-28 sm:pt-24">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <SectionHeading
          index="02"
          eyebrow="Shop by category"
          title="Everything your car's missing"
          description="Stereos, sound, cameras and lighting. Every product is checked against the cars it fits."
        />
        <div className="grid auto-rows-[200px] grid-cols-2 gap-2 sm:auto-rows-[240px] sm:gap-3 lg:grid-cols-4">
          {TILES.map(({ category, className, blurb }, i) => {
            const count = counts[category] ?? 0;
            const feature = i === 0;
            return (
              <Reveal key={category} delay={i * 70} className={cn(feature ? "col-span-2 row-span-2" : "", className)}>
                <Link href={`/shop?category=${category}`} className="group relative block size-full overflow-clip rounded-xl bg-muted">
                  <Image
                    src={CATEGORY_IMAGES[category]!}
                    alt={CATEGORY_LABELS[category]}
                    fill
                    sizes={className.includes("lg:col-span-4") ? "100vw" : feature || className.includes("col-span-2") ? "(min-width: 1024px) 50vw, 100vw" : "(min-width: 1024px) 25vw, 50vw"}
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/20 to-transparent transition-opacity duration-500 group-hover:from-ink/95" />
                  <span className="label-mono absolute left-4 top-4 rounded-sm bg-black/35 px-2 py-1 text-white/85 backdrop-blur-md">
                    {count} {count === 1 ? "product" : "products"}
                  </span>
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 text-white sm:p-5">
                    <div>
                      <h3 className={cn("font-display font-bold leading-none", feature ? "text-3xl sm:text-5xl" : "text-xl sm:text-2xl")}>
                        {CATEGORY_LABELS[category]}
                      </h3>
                      {blurb && <p className="mt-2 hidden max-w-sm text-sm text-white/70 sm:block">{blurb}</p>}
                    </div>
                    <span className="grid size-9 shrink-0 place-items-center rounded-md bg-white text-foreground transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                      <ArrowUpRight className="size-[18px] transition-transform duration-300 group-hover:rotate-45" />
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
