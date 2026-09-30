import Link from "next/link";
import { CAR_BRANDS } from "@/lib/data";
import { cn } from "@/lib/utils";

const MODELS = CAR_BRANDS.flatMap((b) => b.models.map((m) => ({ id: m.id, label: `${b.name} ${m.name}` })));

/**
 * Oversized scrolling band of every supported model, alternating solid and outlined type.
 * Each name links to the parts that fit it. The second copy exists only for the seamless loop.
 */
export function ModelMarquee() {
  return (
    <section aria-label="Shop by vehicle model" className="overflow-clip border-y border-foreground/10 bg-card py-8 sm:py-10">
      <p className="label-mono mx-auto mb-6 flex max-w-[1600px] items-center gap-3 px-4 text-muted-foreground sm:px-6 lg:px-8">
        <span className="size-1.5 rounded-full bg-primary" />
        Matched to {MODELS.length} models from {CAR_BRANDS.length} makes. Pick yours.
      </p>
      <div className="group flex w-max animate-marquee [animation-duration:110s] hover:[animation-play-state:paused] focus-within:[animation-play-state:paused]">
        {[0, 1].map((copy) => (
          <ul key={copy} aria-hidden={copy === 1} className="flex shrink-0 items-center">
            {MODELS.map((m, i) => (
              <li key={m.id} className="flex items-center">
                <Link
                  href={`/shop?model=${m.id}`}
                  tabIndex={copy === 1 ? -1 : undefined}
                  className={cn(
                    "whitespace-nowrap px-5 font-display text-5xl font-extrabold leading-none transition-colors duration-300 sm:px-7 sm:text-7xl",
                    i % 2
                      ? "text-transparent [-webkit-text-stroke:1.5px_var(--foreground)] hover:text-primary hover:[-webkit-text-stroke-color:var(--primary)]"
                      : "text-foreground hover:text-primary",
                  )}
                >
                  {m.label}
                </Link>
                <span aria-hidden className="size-2.5 shrink-0 rotate-45 bg-primary sm:size-3" />
              </li>
            ))}
          </ul>
        ))}
      </div>
    </section>
  );
}
