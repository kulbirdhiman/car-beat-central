"use client";

import { ProductCard } from "@/components/product/ProductCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CATEGORY_LABELS } from "@/lib/data";
import type { Category, Product } from "@/lib/types";
import { SectionHeading } from "./SectionHeading";

const TABS: (Category | "all")[] = ["all", "stereo", "speaker", "subwoofer", "dashcam", "lighting"];

/** `products` must already be ranked (best first). */
export function TopProducts({ products }: { products: Product[] }) {
  return (
    <section id="top" className="scroll-mt-20 bg-secondary/60 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading eyebrow="Top rated" title="Five-star fitted" description="Highest rated by drivers who installed them." />
        <Tabs defaultValue="all">
          <TabsList className="no-scrollbar mb-8 h-11! max-w-full justify-start overflow-x-auto bg-background p-1">
            {TABS.map((t) => (
              <TabsTrigger key={t} value={t} className="px-4 data-[state=active]:bg-foreground data-[state=active]:text-background">
                {t === "all" ? "All" : CATEGORY_LABELS[t]}
              </TabsTrigger>
            ))}
          </TabsList>
          {TABS.map((t) => (
            <TabsContent key={t} value={t}>
              <ul className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
                {products.filter((p) => t === "all" || p.category === t)
                  .slice(0, 8)
                  .map((p, i) => (
                    <li key={p.id} className="animate-in fade-in slide-in-from-bottom-4 fill-mode-both duration-500" style={{ animationDelay: `${i * 60}ms` }}>
                      <ProductCard product={p} />
                    </li>
                  ))}
              </ul>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
}
