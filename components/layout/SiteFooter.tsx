import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { CATEGORY_LABELS } from "@/lib/data";
import type { Category } from "@/lib/types";
import credits from "@/public/images/credits.json";
import { Logo } from "./Logo";
import { NewsletterForm } from "./NewsletterForm";

const COLUMNS = [
  {
    title: "Shop",
    links: (Object.keys(CATEGORY_LABELS) as Category[]).slice(0, 5).map((c) => ({ label: CATEGORY_LABELS[c], href: `/shop?category=${c}` })),
  },
  {
    title: "Help",
    links: [
      { label: "Book a fitting", href: "/fitting" },
      { label: "Your cart", href: "/cart" },
      { label: "Delivery & returns", href: "/#faq" },
      { label: "Fitment guarantee", href: "/#faq" },
    ],
  },
  {
    title: "Deals",
    links: [
      { label: "Today's deals", href: "/shop?sale=1" },
      { label: "Offers & codes", href: "/#offers" },
      { label: "Top rated", href: "/shop?sort=rating" },
    ],
  },
];

const photographers = [...new Set(Object.values(credits).map((c) => c.photographer))];

export function SiteFooter() {
  return (
    <footer className="grain overflow-clip bg-ink text-ink-foreground">
      <div className="relative z-10 mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        {/* Closing statement + the two actions people most often come back for. */}
        <div className="grid gap-10 border-b border-white/10 pb-14 pt-20 lg:grid-cols-[1.4fr_1fr] lg:items-end">
          <h2 className="font-display text-4xl font-bold leading-[1.02] sm:text-6xl">
            Parts that fit.
            <br />
            <span className="text-white/45">Fitted by people who know cars.</span>
          </h2>
          <div className="flex flex-col gap-2 sm:flex-row lg:justify-end">
            <Link
              href="/fitting"
              className="group flex items-center justify-between gap-6 rounded-md bg-primary px-5 py-4 font-medium text-primary-foreground transition-colors hover:bg-[color-mix(in_oklch,var(--primary),black_10%)]"
            >
              Book a fitting
              <ArrowUpRight className="size-5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/shop"
              className="group flex items-center justify-between gap-6 rounded-md border border-white/15 px-5 py-4 font-medium transition-colors hover:border-white/40 hover:bg-white/5"
            >
              Shop all parts
              <ArrowUpRight className="size-5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>

        <div className="grid gap-12 py-14 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/55">
              Car audio and accessories matched to your model, fitted by certified installers across Australia.
            </p>
            <p className="label-mono mt-8 text-white/40">Price-drop alerts</p>
            <NewsletterForm className="mt-3" />
          </div>
          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h3 className="label-mono text-white/40">{col.title}</h3>
              <ul className="mt-4 space-y-2.5 text-sm text-white/70">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="transition-colors hover:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="flex flex-col gap-2 border-t border-white/10 py-6 text-xs text-white/40 md:flex-row md:justify-between">
          <p>© {new Date().getFullYear()} CarBeat. All prices in AUD incl. GST.</p>
          <p className="max-w-3xl md:text-right">
            Photos from{" "}
            <a href="https://unsplash.com" className="underline underline-offset-2 hover:text-white">
              Unsplash
            </a>{" "}
            by {photographers.slice(0, -1).join(", ")} and {photographers.at(-1)}.
          </p>
        </div>
      </div>
    </footer>
  );
}
