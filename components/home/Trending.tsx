import { ArrowUpRight, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { AddToCartButton } from "@/components/product/AddToCartButton";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/Reveal";
import { CATEGORY_LABELS, discountPercent, formatPrice } from "@/lib/data";
import { getTrending } from "@/lib/server/queries";
import type { Product } from "@/lib/types";
import { SectionHeading } from "./SectionHeading";

const rank = (i: number) => String(i + 1).padStart(2, "0");
const priceOf = (p: Product) => p.deal?.price ?? p.price;

/** Editorial chart: the No.1 product as a large feature, the rest as a ranked list. */
export function Trending() {
  const [top, ...rest] = getTrending();
  if (!top) return null;

  return (
    <section id="trending" className="scroll-mt-20 pb-20 sm:pb-28">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <SectionHeading
          index="05"
          eyebrow="Trending this week"
          title="What Aussies are bolting in"
          description="Ranked by orders from the last 7 days."
          action={
            <Button asChild variant="outline" className="h-10 bg-card px-4">
              <Link href="/shop">Shop all parts</Link>
            </Button>
          }
        />

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.05fr_1fr] lg:gap-6">
          <Reveal>
            <article className="group relative flex h-full min-h-[440px] flex-col justify-end overflow-clip rounded-xl bg-ink text-white sm:min-h-[560px]">
              <Image
                src={top.image}
                alt={top.name}
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
              <span className="absolute left-5 top-3 font-display text-[7rem] font-extrabold leading-none text-white/90 sm:left-7 sm:text-[9rem]">
                01
              </span>
              <span className="label-mono absolute right-5 top-5 rounded-sm bg-primary px-2 py-1 text-primary-foreground">
                Best seller this week
              </span>
              <div className="relative flex flex-wrap items-end justify-between gap-6 p-5 sm:p-7">
                <div className="max-w-md">
                  <p className="label-mono text-white/60">
                    {top.brand} · {CATEGORY_LABELS[top.category]}
                  </p>
                  <h3 className="mt-2 font-display text-3xl font-bold leading-tight sm:text-4xl">
                    <Link href={`/products/${top.slug}`} className="after:absolute after:inset-0 after:content-['']">
                      {top.name}
                    </Link>
                  </h3>
                  <p className="mt-3 flex items-center gap-1.5 text-sm text-white/70">
                    <Star className="size-4 fill-primary text-primary" />
                    <span className="font-medium text-white">{top.rating}</span> from {top.reviews.toLocaleString("en-AU")} reviews
                  </p>
                </div>
                <div className="relative z-10 flex items-center gap-3 [&_button]:border-transparent [&_button]:text-foreground">
                  <div className="text-right">
                    <p className="font-display text-4xl font-bold leading-none">{formatPrice(priceOf(top))}</p>
                    <p className="mt-1 text-xs text-white/50">
                      RRP <span className="line-through">{formatPrice(top.rrp)}</span>
                    </p>
                  </div>
                  <AddToCartButton productId={top.id} name={top.name} />
                </div>
              </div>
            </article>
          </Reveal>

          <ol className="flex min-w-0 flex-col border-t border-foreground/15">
            {rest.slice(0, 6).map((p, i) => (
              <Reveal as="li" key={p.id} delay={i * 60} className="border-b border-foreground/10">
                <div className="group relative flex items-center gap-4 py-3.5 sm:gap-5">
                  <span className="w-9 shrink-0 font-display text-2xl font-bold text-muted-foreground/50 transition-colors group-hover:text-primary sm:w-11 sm:text-3xl">
                    {rank(i + 1)}
                  </span>
                  <span className="relative size-16 shrink-0 overflow-hidden rounded-md bg-muted sm:size-[72px]">
                    <Image src={p.image} alt="" fill sizes="72px" className="object-cover transition-transform duration-500 group-hover:scale-110" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="label-mono truncate text-muted-foreground">{CATEGORY_LABELS[p.category]}</p>
                    <h3 className="mt-0.5 truncate font-medium">
                      <Link href={`/products/${p.slug}`} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">
                        {p.name}
                      </Link>
                    </h3>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <Star className="size-3 fill-primary text-primary" /> {p.rating}
                      <span className="hidden sm:inline">· {p.reviews.toLocaleString("en-AU")} reviews</span>
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-display text-lg font-bold leading-none tabular-nums sm:text-xl">{formatPrice(priceOf(p))}</p>
                    <p className="mt-1 font-mono text-[11px] text-primary">−{discountPercent(priceOf(p), p.rrp)}%</p>
                  </div>
                  <ArrowUpRight className="hidden size-5 shrink-0 text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground sm:block" />
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
