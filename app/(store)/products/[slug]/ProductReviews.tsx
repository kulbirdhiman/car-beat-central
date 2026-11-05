import { MessageSquareText, Star } from "lucide-react";
import type { Product } from "@/lib/types";
import { listReviews } from "@/lib/server/reviews";
import { cn } from "@/lib/utils";
import { ReviewForm } from "./ReviewForm";

/** Reviews stream separately so a database read cannot hold up the gallery or buy controls. */
export async function ProductReviews({ product }: { product: Product }) {
  const reviews = await listReviews(product.id);
  return (
<section id="reviews" className="mt-20 scroll-mt-28">
        <div className="grid gap-6 xl:grid-cols-[320px_1fr] 2xl:gap-14 2xl:grid-cols-[360px_1fr]">
          <div className="space-y-4 xl:sticky xl:top-28 xl:self-start">
            <h2 className="font-display text-3xl font-bold">Customer reviews</h2>
            <div className="rounded-2xl border bg-card p-6">
              <div className="flex items-center gap-4">
                <p className="font-display text-6xl font-bold leading-none">{product.rating}</p>
                <div>
                  <span className="flex">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star key={i} className={cn("size-5", i < Math.round(product.rating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30")} />
                    ))}
                  </span>
                  <p className="mt-1 text-sm text-muted-foreground">From {product.reviews.toLocaleString("en-AU")} ratings</p>
                </div>
              </div>
              <p className="mt-4 border-t pt-4 text-sm text-muted-foreground">Bought this? Help other drivers by sharing how it fits and performs in your car.</p>
              <div className="mt-4">
                <ReviewForm productId={product.id} slug={product.slug} />
              </div>
            </div>
          </div>

          <div>
            {reviews.length === 0 ? (
              <div className="grid place-items-center rounded-2xl border border-dashed bg-card px-6 py-16 text-center">
                <MessageSquareText className="size-8 text-muted-foreground" />
                <p className="mt-3 font-display text-xl font-bold">No written reviews yet</p>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">Be the first to tell other drivers what you think.</p>
              </div>
            ) : (
              <ul className="grid gap-3">
                {reviews.map((r) => (
                  <li key={r.id} className="rounded-2xl border bg-card p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="flex">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star key={i} className={cn("size-4", i < r.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30")} />
                        ))}
                      </span>
                      <time className="text-xs text-muted-foreground" dateTime={r.createdAt}>
                        {new Date(`${r.createdAt}Z`).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
                      </time>
                    </div>
                    <p className="mt-3 font-semibold">{r.title}</p>
                    <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{r.body}</p>
                    <p className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                      <span className="grid size-6 place-items-center rounded-full bg-ink text-[11px] font-bold uppercase text-ink-foreground">{r.name.charAt(0)}</span>
                      <span className="font-semibold">{r.name}</span>
                      {r.vehicle && <span className="rounded-full bg-secondary px-2 py-0.5 text-muted-foreground">{r.vehicle}</span>}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
  );
}
