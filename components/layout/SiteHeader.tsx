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

  return (
    <header
      className={cn(
        "fixed inset-x-0 z-40 transition-all duration-500",
        solid ? "border-b bg-background/85 text-foreground shadow-sm backdrop-blur-xl" : "text-white",
        scrolled ? "top-0" : "top-9",
      )}
    >
      <div className={cn("mx-auto flex max-w-7xl items-center gap-4 px-4 transition-all sm:px-6", scrolled ? "h-16" : "h-20")}>
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
            <nav className="grid gap-1 px-4 pb-6">
              {LINKS.map((l) => (
                <SheetClose asChild key={l.href}>
                  <Link href={l.href} className="rounded-lg px-3 py-2.5 font-medium hover:bg-muted">
                    {l.label}
                  </Link>
                </SheetClose>
              ))}
              <Separator className="my-3" />
              <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Categories</p>
              {(Object.keys(CATEGORY_LABELS) as Category[]).map((c) => (
                <SheetClose asChild key={c}>
                  <Link href={`/shop?category=${c}`} className="rounded-lg px-3 py-2 text-sm hover:bg-muted">
                    {CATEGORY_LABELS[c]}
                  </Link>
                </SheetClose>
              ))}
            </nav>
          </SheetContent>
        </Sheet>

        <Link href="/" aria-label="CarBeat home">
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
                <ul className="grid w-[560px] grid-cols-3 gap-2 p-2">
                  {FEATURED.map((c) => (
                    <li key={c}>
                      <NavigationMenuLink asChild className="group/cat block p-1.5">
                        <Link href={`/shop?category=${c}`}>
                          <span className="relative block aspect-[4/3] w-full overflow-hidden rounded-md">
                            <Image src={CATEGORY_IMAGES[c]!} alt="" fill sizes="180px" className="object-cover transition-transform duration-500 group-hover/cat:scale-110" />
                          </span>
                          <span className="block px-1 pb-1 pt-2 text-sm font-medium">{CATEGORY_LABELS[c]}</span>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            {LINKS.slice(1).map((l) => (
              <NavigationMenuItem key={l.href}>
                <NavigationMenuLink asChild className={cn("bg-transparent", onDark)}>
                  <Link href={l.href}>{l.label}</Link>
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
              "h-10 rounded-full px-3 md:w-60 md:justify-start",
              !solid && "border-white/25 bg-white/10 text-white backdrop-blur hover:bg-white/20 hover:text-white",
            )}
            aria-label="Search products"
          >
            <Search />
            <span className={cn("hidden md:inline", solid ? "text-muted-foreground" : "text-white/70")}>Search parts or car…</span>
            <kbd className="ml-auto hidden rounded border px-1.5 font-mono text-[10px] opacity-70 md:inline">⌘K</kbd>
          </Button>

          {car ? (
            <Button asChild variant="ghost" className={cn("hidden h-10 rounded-full md:inline-flex", onDark)}>
              <Link href={`/shop?model=${car.model.id}`} title="Parts for my car">
                <CarFront className="text-primary" />
                {car.model.name}
              </Link>
            </Button>
          ) : (
            <Button asChild variant="ghost" size="icon-lg" className={cn("hidden rounded-full md:inline-flex xl:hidden", onDark)}>
              <Link href="/fitting" aria-label="Book a fitting">
                <Wrench />
              </Link>
            </Button>
          )}

          <Button asChild variant="ghost" size="icon-lg" className={cn("relative rounded-full", onDark)}>
            <Link href="/cart" aria-label={`Cart, ${cartCount} items`}>
              <ShoppingBag />
              {cartCount > 0 && (
                <span key={cartCount} className="absolute -right-0.5 -top-0.5 grid size-5 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground animate-in zoom-in">
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
