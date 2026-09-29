"use client";

import { ProductCard } from "@/components/product/ProductCard";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import type { Product } from "@/lib/types";

export function TrendingCarousel({ products }: { products: Product[] }) {
  return (
    <Carousel opts={{ align: "start", loop: true }} className="w-full">
      <CarouselContent className="-ml-4 pb-4">
        {products.map((p, i) => (
          <CarouselItem key={p.id} className="basis-[78%] pl-4 sm:basis-1/2 lg:basis-1/4">
            <div className="relative h-full">
              <span className="absolute -top-3 left-4 z-10 rounded-full bg-foreground px-2.5 py-1 font-display text-sm font-bold text-background">
                #{i + 1}
              </span>
              <ProductCard product={p} sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 78vw" />
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <div className="mt-4 flex justify-end gap-2">
        <CarouselPrevious className="static size-11 translate-y-0 rounded-full" />
        <CarouselNext className="static size-11 translate-y-0 rounded-full" />
      </div>
    </Carousel>
  );
}
