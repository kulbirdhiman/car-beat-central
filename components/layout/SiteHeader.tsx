"use client";

import { CarFront, Menu, Search, ShoppingBag, Wrench } from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useCartCount } from "@/lib/cart";
import { CATEGORY_IMAGES, CATEGORY_LABELS } from "@/lib/data";
import { useGarage } from "@/lib/garage";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";

// The search dialog (and cmdk) is only downloaded when first opened or hovered.
const loadSearch = () => import("../search/SearchDialog");
const SearchDialog = dynamic(loadSearch, { ssr: false });

const LINKS = [
  { href: "/shop", label: "All products" },
  { href: "/shop?sale=1", label: "Today's deals" },
  { href: "/#offers", label: "Offers" },
  { href: "/fitting", label: "Book fitting" },
];

const FEATURED = Object.keys(CATEGORY_IMAGES) as Category[];

export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const cartCount = useCartCount();
  const { car } = useGarage();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  // Transparent with light text only while over the home page hero.
  const solid = scrolled || pathname !== "/";
  const onDark = !solid && "text-white hover:bg-white/10 hover:text-white focus:bg-white/10 focus:text-white";
  // Only path-level links can be marked current without reading search params.
  const isCurrent = (href: string) => !href.includes("?") && !href.includes("#") && pathname.startsWith(href);

  return (
    <header
      className={cn(
        "fixed inset-x-0 z-40 transition-all duration-500",
        solid
          ? "border-b border-foreground/[0.06] bg-background/80 text-foreground shadow-[0_1px_12px_-6px_oklch(0.3_0.02_60/0.15)] backdrop-blur-xl backdrop-saturate-150"
          : "text-white",
        scrolled ? "top-0" : "top-9",
      )}
    >
      <div className={cn("mx-auto flex max-w-[1600px] items-center gap-4 px-4 transition-all sm:px-6 lg:px-8", scrolled ? "h-16" : "h-20")}>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon-lg" className={cn("-ml-2 lg:hidden", onDark)} aria-label="Open menu">
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
              {LINKS.map((l) => (
                <SheetClose asChild key={l.href}>
                  <Link
                    href={l.href}
                    aria-current={isCurrent(l.href) ? "page" : undefined}
                    className="rounded-md px-3 py-2.5 font-medium hover:bg-muted aria-[current=page]:bg-muted aria-[current=page]:text-primary"
                  >
                    {l.label}
                  </Link>
                </SheetClose>
              ))}
              <Separator className="my-3" />
              <p className="label-mono px-3 pb-1 text-muted-foreground">Categories</p>
              {(Object.keys(CATEGORY_LABELS) as Category[]).map((c) => (
                <SheetClose asChild key={c}>
                  <Link href={`/shop?category=${c}`} className="rounded-md px-3 py-2 text-sm hover:bg-muted">
                    {CATEGORY_LABELS[c]}
                  </Link>
                </SheetClose>
              ))}
            </nav>
          </SheetContent>
        </Sheet>

        <Link href="/" aria-label="CarBeat home" className="rounded-md">
          <Logo />
        </Link>

        <NavigationMenu viewport={false} className="ml-6 hidden lg:flex">
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger
                className={cn("bg-transparent", !solid && "text-white hover:bg-white/10 hover:text-white focus:bg-white/10 focus:text-white data-open:bg-white/15 data-open:text-white data-open:hover:bg-white/15 data-open:focus:bg-white/15")}
              >
                Shop
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="grid w-[640px] grid-cols-[1fr_180px] gap-2 p-2">
                  <ul className="grid grid-cols-3 gap-1">
                    {FEATURED.map((c) => (
                      <li key={c}>
                        <NavigationMenuLink asChild className="group/cat block p-1.5">
                          <Link href={`/shop?category=${c}`}>
                            <span className="relative block aspect-[4/3] w-full overflow-hidden rounded-sm">
                              <Image src={CATEGORY_IMAGES[c]!} alt="" fill sizes="140px" className="object-cover transition-transform duration-500 group-hover/cat:scale-110" />
                            </span>
                            <span className="block px-0.5 pb-0.5 pt-2 text-sm font-medium">{CATEGORY_LABELS[c]}</span>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-col justify-between rounded-md bg-muted p-4">
                    <div>
                      <p className="label-mono text-muted-foreground">Not sure what fits?</p>
                      <p className="mt-2 text-sm leading-snug">Search by your make and model and we&apos;ll only show compatible parts.</p>
                    </div>
                    <NavigationMenuLink asChild className="mt-4 p-0 text-sm font-medium text-primary hover:bg-transparent">
                      <Link href="/shop">Browse all parts →</Link>
                    </NavigationMenuLink>
                  </div>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>
            {LINKS.slice(1).map((l) => (
              <NavigationMenuItem key={l.href}>
                <NavigationMenuLink
                  asChild
                  className={cn(
                    "relative bg-transparent after:absolute after:inset-x-2.5 after:-bottom-0.5 after:h-0.5 after:scale-x-0 after:rounded-full after:bg-primary after:transition-transform aria-[current=page]:after:scale-x-100",
                    onDark,
                  )}
                >
                  <Link href={l.href} aria-current={isCurrent(l.href) ? "page" : undefined}>
                    {l.label}
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        <div className="ml-auto flex items-center gap-1.5">
          <Button
            variant="outline"
            onClick={() => setSearchOpen(true)}
            onPointerEnter={loadSearch}
            onFocus={loadSearch}
            className={cn(
              "h-10 px-3 md:w-64 md:justify-start",
              solid ? "bg-card/70" : "border-white/20 bg-white/10 text-white backdrop-blur hover:bg-white/20 hover:text-white",
            )}
            aria-label="Search products"
          >
            <Search />
            <span className={cn("hidden md:inline", solid ? "text-muted-foreground" : "text-white/70")}>Search parts or car…</span>
            <kbd className={cn("ml-auto hidden rounded-sm border px-1.5 font-mono text-[10px] md:inline", solid ? "bg-muted text-muted-foreground" : "border-white/20 text-white/60")}>⌘K</kbd>
          </Button>

          {car ? (
            <Button asChild variant="ghost" className={cn("hidden h-10 md:inline-flex", onDark)}>
              <Link href={`/shop?model=${car.model.id}`} title="Parts for my car">
                <CarFront className="text-primary" />
                {car.model.name}
              </Link>
            </Button>
          ) : (
            <Button asChild variant="ghost" size="icon-lg" className={cn("hidden size-10 md:inline-flex xl:hidden", onDark)}>
              <Link href="/fitting" aria-label="Book a fitting">
                <Wrench />
              </Link>
            </Button>
          )}

          <Button asChild variant="ghost" size="icon-lg" className={cn("relative size-10", onDark)}>
            <Link href="/cart" aria-label={`Cart, ${cartCount} items`}>
              <ShoppingBag />
              {cartCount > 0 && (
                <span key={cartCount} className="absolute -right-0.5 -top-0.5 grid size-5 place-items-center rounded-full bg-primary font-mono text-[10px] font-semibold text-primary-foreground ring-2 ring-background animate-in zoom-in">
                  {cartCount}
                </span>
              )}
            </Link>
          </Button>
        </div>
      </div>

      {searchOpen && <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />}
    </header>
  );
}
