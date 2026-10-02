import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import { CATEGORY_IMAGES, CATEGORY_LABELS } from "@/lib/data";
import type { Category } from "@/lib/types";
import { SectionHeading } from "./SectionHeading";

const CATEGORIES = Object.keys(CATEGORY_LABELS) as Category[];

/** Every department as an equal tile: image, name and live product count. */
export function CategoryGrid({ counts }: { counts: Partial<Record<Category, number>> }) {
  return (
    <section id="categories" className="mx-auto max-w-[1440px] scroll-mt-32 px-4 pt-16 sm:px-6 sm:pt-24 lg:px-8">
      <SectionHeading
        eyebrow="Shop by category"
        title="Everything your car's missing"
        action={
          <Link href="/shop" className="group inline-flex items-center gap-1.5 text-sm font-semibold hover:text-primary">
            View all products <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>
        }
      />
      <ul className="grid grid-cols-4 gap-2 sm:gap-3 lg:grid-cols-8">
        {CATEGORIES.map((c, i) => {
          const count = counts[c] ?? 0;
          return (
            <Reveal as="li" key={c} delay={i * 50}>
              <Link href={`/shop?category=${c}`} className="group block h-full rounded-xl border bg-card p-1.5 transition-[border-color,box-shadow] sm:rounded-2xl sm:p-2 hover:border-primary/40 hover:shadow-[0_16px_32px_-20px_oklch(0.25_0.01_25/0.35)]">
                <span className="relative block aspect-square overflow-hidden rounded-lg bg-muted sm:rounded-xl">
                  <Image src={CATEGORY_IMAGES[c]} alt="" fill sizes="(min-width: 1024px) 12vw, 25vw" className="object-cover transition-transform duration-700 group-hover:scale-110" />
                </span>
                <span className="block px-0.5 pb-1 pt-2 sm:px-1.5 sm:pt-3">
                  <span className="block text-[11px] font-semibold leading-tight group-hover:text-primary sm:text-sm">{CATEGORY_LABELS[c]}</span>
                  <span className="mt-0.5 hidden text-xs text-muted-foreground sm:block">
                    {count} {count === 1 ? "product" : "products"}
                  </span>
                </span>
              </Link>
            </Reveal>
          );
        })}
      </ul>
    </section>
  );
}
