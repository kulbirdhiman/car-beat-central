"use client";

import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { ProductCard } from "@/components/product/ProductCard";
import { Button } from "@/components/ui/button";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";
import { SectionHeading } from "./SectionHeading";

/** Tabbed product carousel: best sellers overall, then one department at a time, scroll-snapped, with arrow controls. */
export type RailGroup = { key: string; label: string; href: string; products: Product[] };

export function CategoryRail({ groups }: { groups: RailGroup[] }) {
  const [active, setActive] = useState(groups[0]?.key);
  const rail = useRef<HTMLUListElement>(null);
  const group = groups.find((g) => g.key === active) ?? groups[0];
  if (!group) return null;

  const scroll = (dir: 1 | -1) => rail.current?.scrollBy({ left: dir * rail.current.clientWidth * 0.8, behavior: "smooth" });

  return (
    <section className="mx-auto max-w-[1440px] px-4 pt-16 sm:px-6 sm:pt-24 lg:px-8">
      <SectionHeading
        eyebrow="Best sellers"
        title="Shop the range"
        description="Our most-bought parts in each department, ranked by driver reviews."
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="icon-lg" className="size-10 rounded-full bg-card" onClick={() => scroll(-1)} aria-label="Scroll left">
              <ChevronLeft />
            </Button>
            <Button variant="outline" size="icon-lg" className="size-10 rounded-full bg-card" onClick={() => scroll(1)} aria-label="Scroll right">
              <ChevronRight />
            </Button>
          </div>
        }
      />

      <div role="tablist" aria-label="Departments" className="no-scrollbar -mx-4 mb-6 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {groups.map((g) => (
          <button
            key={g.key}
            type="button"
            role="tab"
            aria-selected={g.key === group.key}
            onClick={() => {
              setActive(g.key);
              rail.current?.scrollTo({ left: 0 });
            }}
            className={cn(
              "h-10 shrink-0 rounded-full border px-4 text-sm font-medium transition-colors",
              g.key === group.key ? "border-foreground bg-foreground text-background" : "bg-card text-foreground/75 hover:border-foreground/30 hover:text-foreground",
            )}
          >
            {g.label}
            <span className={cn("ml-1.5 text-xs", g.key === group.key ? "text-background/60" : "text-muted-foreground")}>{g.products.length}</span>
          </button>
        ))}
      </div>

      <ul
        key={group.key}
        ref={rail}
        role="tabpanel"
        aria-label={group.label}
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-2 sm:mx-0 sm:scroll-px-0 sm:gap-4 sm:px-0"
      >
        {group.products.map((p, i) => (
          <li
            key={p.id}
            className="w-[70%] shrink-0 snap-start animate-in fade-in slide-in-from-right-4 fill-mode-both duration-500 sm:w-[calc((100%-2rem)/3)] lg:w-[calc((100%-4rem)/5)]"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <ProductCard product={p} sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 70vw" />
          </li>
        ))}
        <li className="w-[70%] shrink-0 snap-start sm:w-[calc((100%-2rem)/3)] lg:w-[calc((100%-4rem)/5)]">
          <Link
            href={group.href}
            className="group flex h-full min-h-64 flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card/50 p-6 text-center transition-colors hover:border-primary hover:bg-card"
          >
            <span className="grid size-12 place-items-center rounded-full bg-primary text-primary-foreground transition-transform group-hover:scale-110">
              <ArrowRight />
            </span>
            <span className="font-semibold">View all {group.label.toLowerCase()}</span>
          </Link>
        </li>
      </ul>
    </section>
  );
}
