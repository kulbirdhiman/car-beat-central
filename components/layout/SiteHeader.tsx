"use client";

import { CalendarCheck, Menu, ShoppingBag, Zap } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useCartCount } from "@/lib/cart";
import { CATEGORY_LABELS, FITTING_CITIES } from "@/lib/data";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";
import { SearchBox } from "../search/SearchBox";
import { Logo } from "./Logo";
import { VehiclePicker } from "./VehiclePicker";

const CATEGORIES = Object.keys(CATEGORY_LABELS) as Category[];

/**
 * Two-row graphite header. Row 1: logo, search, booking and cart. Row 2: departments on the
 * left, the shopper's vehicle on the right. On phones search drops to its own full-width row.
 */
export function SiteHeader({ fitCounts }: { fitCounts: Record<string, number> }) {
  const cartCount = useCartCount();

  return (
    <header className="sticky top-0 z-40 bg-ink text-ink-foreground shadow-[0_8px_24px_-16px_oklch(0.1_0.02_260/0.6)]">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-2 px-4 sm:gap-4 sm:px-6 lg:h-[72px] lg:gap-8 lg:px-8">
        <MobileMenu />

        <Link href="/" aria-label="CarBeat home" className="shrink-0 rounded-md">
          <Logo />
        </Link>

        <SearchBox className="hidden w-full max-w-3xl flex-1 md:block" />

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2 md:ml-0">
          <Button asChild className="h-11 gap-2 rounded-xl px-3 sm:px-4">
            <Link href="/fitting">
              <CalendarCheck className="size-[18px]" />
              <span className="text-sm font-semibold">
                Book<span className="hidden sm:inline"> a fitting</span>
              </span>
            </Link>
          </Button>

          <Link
            href="/cart"
            aria-label={`Cart, ${cartCount} items`}
            className="relative grid size-11 place-items-center rounded-xl text-white transition-colors hover:bg-white/10"
          >
            <ShoppingBag className="size-[22px]" />
            {cartCount > 0 && (
              <span key={cartCount} className="absolute right-1 top-1 grid size-[18px] place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground ring-2 ring-ink animate-in zoom-in">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Phones and small tablets: full-width search, then the vehicle control. */}
      <div className="grid gap-2 px-4 pb-3 sm:px-6 md:hidden">
        <SearchBox />
        <VehiclePicker fitCounts={fitCounts} className="w-full" />
      </div>

      <div className="hidden border-t border-white/10 md:block">
        <div className="mx-auto flex h-12 max-w-[1440px] items-center gap-4 px-4 sm:px-6 lg:px-8">
          <nav aria-label="Categories" className="no-scrollbar -ml-3 min-w-0 flex-1 overflow-x-auto">
            <Suspense fallback={<CategoryLinks />}>
              <CategoryLinksWithState />
            </Suspense>
          </nav>
          <VehiclePicker fitCounts={fitCounts} className="max-w-72 shrink-0" />
        </div>
      </div>
    </header>
  );
}

function MobileMenu() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon-lg" className="-ml-2 text-white hover:bg-white/10 hover:text-white md:hidden" aria-label="Open menu">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            <Logo />
          </SheetTitle>
        </SheetHeader>
        <nav className="grid gap-0.5 px-4 pb-6">
          <SheetClose asChild>
            <Link href="/fitting" className="mb-2 flex items-center gap-3 rounded-xl bg-primary px-4 py-3 text-primary-foreground">
              <CalendarCheck className="size-5" />
              <span>
                <span className="block font-semibold">Book a fitting</span>
                <span className="block text-xs opacity-80">Installers in {FITTING_CITIES.length} cities, Mon–Sat</span>
              </span>
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <Link href="/shop?sale=1" className="flex items-center gap-2 rounded-md px-3 py-2.5 font-semibold text-primary hover:bg-muted">
              <Zap className="size-4 fill-primary" /> Today&apos;s deals
            </Link>
          </SheetClose>
          {[
            { href: "/shop", label: "All products" },
            { href: "/#offers", label: "Offers & codes" },
          ].map((l) => (
            <SheetClose asChild key={l.href}>
              <Link href={l.href} className="rounded-md px-3 py-2.5 font-medium hover:bg-muted">
                {l.label}
              </Link>
            </SheetClose>
          ))}
          <Separator className="my-3" />
          <p className="label-mono px-3 pb-1 text-muted-foreground">Categories</p>
          {CATEGORIES.map((c) => (
            <SheetClose asChild key={c}>
              <Link href={`/shop?category=${c}`} className="rounded-md px-3 py-2 text-sm hover:bg-muted">
                {CATEGORY_LABELS[c]}
              </Link>
            </SheetClose>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}

function CategoryLinksWithState() {
  const pathname = usePathname();
  const params = useSearchParams();
  const onShop = pathname === "/shop";
  return <CategoryLinks current={onShop ? (params.get("sale") ? "sale" : (params.get("category") ?? "all")) : null} />;
}

function CategoryLinks({ current = null }: { current?: string | null }) {
  const item = (key: string) =>
    cn(
      "flex h-9 items-center whitespace-nowrap rounded-lg px-3 text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white",
      current === key && "bg-white/10 text-white",
    );

  return (
    <ul className="flex items-center gap-0.5">
      <li>
        <Link href="/shop?sale=1" className={cn(item("sale"), "gap-1.5 font-semibold text-white")}>
          <Zap className="size-4 fill-primary text-primary" /> Deals
        </Link>
      </li>
      <li aria-hidden className="mx-1 h-4 w-px bg-white/15" />
      {CATEGORIES.map((c) => (
        <li key={c}>
          <Link href={`/shop?category=${c}`} className={item(c)}>
            {CATEGORY_LABELS[c]}
          </Link>
        </li>
      ))}
      <li aria-hidden className="mx-1 h-4 w-px bg-white/15" />
      <li>
        <Link href="/shop" className={item("all")}>
          All products
        </Link>
      </li>
    </ul>
  );
}
