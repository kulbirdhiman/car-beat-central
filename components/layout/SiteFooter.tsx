import { Mail, MapPin, Wrench } from "lucide-react";
import Link from "next/link";
import { FITTING_CITIES } from "@/lib/data";
import type { StoreDepartment } from "@/lib/types";
import credits from "@/public/images/credits.json";
import { Logo } from "./Logo";
import { NewsletterForm } from "./NewsletterForm";

const COLUMNS = [
  {
    title: "Deals",
    links: [
      { label: "Today's deals", href: "/shop?sale=1" },
      { label: "Offers & codes", href: "/#offers" },
      { label: "Top rated", href: "/shop?sort=rating" },
      { label: "All products", href: "/shop" },
    ],
  },
  {
    title: "Help",
    links: [
      { label: "Book a fitting", href: "/fitting" },
      { label: "Your cart", href: "/cart" },
      { label: "Returns & refunds", href: "/returns" },
      { label: "Warranty", href: "/warranty" },
      { label: "Fitment guarantee", href: "/returns#fitment" },
      { label: "FAQs", href: "/#faq" },
    ],
  },
];

const photographers = [...new Set(Object.values(credits).map((c) => c.photographer))];

export function SiteFooter({ departments }: { departments: StoreDepartment[] }) {
  const shop = { title: "Shop", links: departments.map((d) => ({ label: d.name, href: `/shop?dept=${d.slug}` })) };
  return (
    <footer className="bg-ink text-ink-foreground">
      {/* Newsletter band */}
      <div className="border-b border-white/10">
        <div className="mx-auto grid max-w-[1440px] gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-center lg:px-8">
          <div className="flex items-start gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
              <Mail className="size-5" />
            </span>
            <div>
              <h2 className="font-display text-2xl font-bold">Get price-drop alerts</h2>
              <p className="mt-1 text-sm text-white/60">Exclusive codes and deal reminders. No spam, unsubscribe any time.</p>
            </div>
          </div>
          <NewsletterForm className="w-full lg:w-[420px] lg:max-w-none" />
        </div>
      </div>

      <div className="mx-auto grid max-w-[1440px] gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-8">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/55">
            Car audio and accessories matched to your make and model, fitted by certified installers across Australia.
          </p>
          <ul className="mt-6 space-y-2.5 text-sm text-white/70">
            <li className="flex items-center gap-2.5">
              <Wrench className="size-4 text-primary" /> Fitting Monday to Saturday
            </li>
            <li className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 size-4 shrink-0 text-primary" /> {FITTING_CITIES.join(", ")}
            </li>
          </ul>
        </div>
        {[shop, ...COLUMNS].map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h3 className="text-sm font-semibold">{col.title}</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-white/60">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="transition-colors hover:text-primary">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-2 px-4 py-6 text-xs text-white/40 sm:px-6 md:flex-row md:justify-between lg:px-8">
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
