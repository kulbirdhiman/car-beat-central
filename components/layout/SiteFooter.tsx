import Link from "next/link";
import { Separator } from "@/components/ui/separator";
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
    <footer className="bg-ink text-ink-foreground">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.3fr_2fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-sm text-sm text-white/60">
            Car audio and accessories matched to your model, fitted by certified installers across Australia.
          </p>
          <NewsletterForm className="mt-6" />
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="font-display text-lg font-semibold uppercase tracking-wide">{col.title}</h3>
              <ul className="mt-4 space-y-2.5 text-sm text-white/60">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="transition-colors hover:text-primary">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <Separator className="bg-white/10" />
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-xs text-white/40 sm:px-6 md:flex-row md:justify-between">
        <p>© {new Date().getFullYear()} CarBeat. All prices in AUD incl. GST.</p>
        <p className="max-w-3xl md:text-right">
          Photos from{" "}
          <a href="https://unsplash.com" className="underline hover:text-white">
            Unsplash
          </a>{" "}
          by {photographers.slice(0, -1).join(", ")} and {photographers.at(-1)}.
        </p>
      </div>
    </footer>
  );
}
