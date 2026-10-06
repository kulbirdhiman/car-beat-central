"use client";

import { ArrowRight, CalendarCheck, ChevronDown, LayoutGrid, Menu, ShoppingBag, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useCartCount } from "@/lib/cart";
import { FITTING_CITIES } from "@/lib/data";
import type { StoreDepartment } from "@/lib/types";
import { cn } from "@/lib/utils";
import { SearchBox } from "../search/SearchBox";
import { Logo } from "./Logo";

const productsLabel = (n: number) => `${n} ${n === 1 ? "product" : "products"}`;

/**
 * Floating glass header: one rounded bar with logo, the "All products" mega menu, Deals, search,
 * booking and cart. It lifts with a deeper shadow once the page scrolls. On phones search drops
 * to a second row inside the same bar.
 */
export function SiteHeader({ departments, total }: { departments: StoreDepartment[]; total: number }) {
  const cartCount = useCartCount();
  const scrolled = useScrolled();

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-b from-background from-25% to-transparent px-3 pt-3 sm:px-6 lg:px-8">
      <div
        className={cn(
          "mx-auto max-w-[1440px] rounded-2xl border border-white/60 bg-white/80 backdrop-blur-xl backdrop-saturate-150 transition-shadow duration-300",
          scrolled ? "shadow-[0_18px_40px_-18px_oklch(0.2_0.01_25/0.35)]" : "shadow-[0_2px_10px_-4px_oklch(0.2_0.01_25/0.12)]",
        )}
      >
        <div className="flex h-16 items-center gap-2 px-3 sm:px-4 lg:h-[68px] lg:gap-3">
          <MobileMenu departments={departments} />

          <Link href="/" aria-label="CarBeat home" className="mr-1 shrink-0 rounded-md lg:mr-3">
            <Logo />
          </Link>

          <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
            <AllProductsMenu departments={departments} total={total} />
            <Suspense fallback={<DealsLink />}>
              <DealsLinkWithState />
            </Suspense>
          </nav>

          <SearchBox departments={departments} className="mx-1 hidden min-w-0 flex-1 md:block lg:mx-3" />

          <div className="ml-auto flex shrink-0 items-center gap-1.5 md:ml-0">
            <Link
              href="/fitting"
              aria-label="Book a fitting"
              className="flex h-10 items-center gap-2 rounded-full px-3 text-sm font-semibold transition-colors hover:bg-secondary"
            >
              <CalendarCheck className="size-5" />
              <span className="hidden xl:inline">Book a fitting</span>
            </Link>

            <Link
              href="/cart"
              aria-label={`Cart, ${cartCount} items`}
              className="flex h-10 items-center gap-2 rounded-full bg-ink pl-3 pr-3 text-sm font-semibold text-ink-foreground transition-colors hover:bg-[color-mix(in_oklch,var(--ink),white_14%)] sm:pr-2"
            >
              <ShoppingBag className="size-[18px]" />
              <span className="hidden sm:inline">Cart</span>
              <span
                key={cartCount}
                className={cn(
                  "grid h-6 min-w-6 place-items-center rounded-full px-1.5 text-xs font-bold animate-in zoom-in",
                  cartCount > 0 ? "bg-primary text-primary-foreground" : "hidden bg-white/15 sm:grid",
                )}
              >
                {cartCount}
              </span>
            </Link>
          </div>
        </div>

        {/* Phones and small tablets: search gets the full width of the bar. */}
        <div className="px-3 pb-3 md:hidden">
          <SearchBox departments={departments} />
        </div>
      </div>
    </header>
  );
}

function DealsLinkWithState() {
  const pathname = usePathname();
  const params = useSearchParams();
  return <DealsLink active={pathname === "/shop" && params.has("sale")} />;
}

function DealsLink({ active = false }: { active?: boolean }) {
  return (
    <Link
      href="/shop?sale=1"
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-10 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-colors hover:bg-primary/10 hover:text-primary",
        active && "bg-primary/10 text-primary",
      )}
    >
      <Zap className="size-4 fill-primary text-primary" /> Deals
    </Link>
  );
}

function useScrolled() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return scrolled;
}

/** Mega menu: every department as a photo tile, with deals and shop-all on the side. */
function AllProductsMenu({ departments, total }: { departments: StoreDepartment[]; total: number }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors hover:bg-secondary",
            open && "bg-secondary",
          )}
        >
          <LayoutGrid className="size-4" />
          All products
          <ChevronDown className={cn("size-4 text-muted-foreground transition-transform duration-200", open && "rotate-180")} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={18} className="w-[min(860px,calc(100vw-2rem))] rounded-2xl p-3">
        <div className="grid gap-3 lg:grid-cols-[1fr_220px]">
          <ul className="grid grid-cols-2 gap-1 sm:grid-cols-4">
            {departments.map((d) => (
              <li key={d.id}>
                <Link href={`/shop?dept=${d.slug}`} onClick={close} className="group block rounded-xl p-1.5 transition-colors hover:bg-secondary">
                  <span className="relative block aspect-[4/3] overflow-hidden rounded-lg bg-muted">
                    <Image src={d.image} alt="" fill sizes="160px" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                  </span>
                  <span className="mt-2 block px-1 text-sm font-semibold">{d.name}</span>
                  <span className="block px-1 pb-1 text-xs text-muted-foreground">{productsLabel(d.count)}</span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-2">
            <Link href="/shop?sale=1" onClick={close} className="group relative isolate flex flex-1 flex-col justify-end overflow-clip rounded-xl bg-ink p-4 text-ink-foreground">
              <div className="absolute -right-10 -top-10 -z-10 size-36 rounded-full bg-primary/50 blur-2xl" />
              <Zap className="mb-auto size-6 fill-primary text-primary" />
              <p className="mt-6 font-display text-xl font-extrabold leading-tight">Today&apos;s deals</p>
              <p className="mt-1 text-sm text-white/65">Price drops, gone at midnight.</p>
              <span className="mt-3 flex items-center gap-1 text-sm font-semibold text-primary">
                Shop deals <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
            <Button asChild className="h-11 rounded-xl">
              <Link href="/shop" onClick={close}>
                Shop all {total} products <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function MobileMenu({ departments }: { departments: StoreDepartment[] }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon-lg" className="rounded-full md:hidden" aria-label="Open menu">
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
            <Link href="/shop" className="mb-2 flex items-center gap-3 rounded-xl bg-primary px-4 py-3 text-primary-foreground">
              <LayoutGrid className="size-5" />
              <span className="flex-1 font-semibold">All products</span>
              <ArrowRight className="size-4" />
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <Link href="/shop?sale=1" className="flex items-center gap-2 rounded-md px-3 py-2.5 font-semibold text-primary hover:bg-muted">
              <Zap className="size-4 fill-primary" /> Today&apos;s deals
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <Link href="/fitting" className="flex items-center gap-2 rounded-md px-3 py-2.5 font-medium hover:bg-muted">
              <CalendarCheck className="size-4" /> Book a fitting
              <span className="ml-auto text-xs text-muted-foreground">{FITTING_CITIES.length} cities</span>
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <Link href="/#offers" className="rounded-md px-3 py-2.5 font-medium hover:bg-muted">
              Offers &amp; codes
            </Link>
          </SheetClose>
          {departments.length > 0 && (
            <>
              <Separator className="my-3" />
              <p className="label-mono px-3 pb-1 text-muted-foreground">Categories</p>
            </>
          )}
          {departments.map((d) => (
            <SheetClose asChild key={d.id}>
              <Link href={`/shop?dept=${d.slug}`} className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-muted">
                <span className="relative size-8 shrink-0 overflow-hidden rounded-md bg-muted">
                  <Image src={d.image} alt="" fill sizes="32px" className="object-cover" />
                </span>
                <span className="flex-1">{d.name}</span>
                <span className="text-xs text-muted-foreground">{d.count}</span>
              </Link>
            </SheetClose>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
