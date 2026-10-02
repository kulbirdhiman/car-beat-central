"use client";

import { ArrowRight, ArrowUpLeft, CarFront, Clock, Loader2, Search, TrendingUp, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { CAR_BRANDS, CATEGORY_IMAGES, CATEGORY_LABELS, formatPrice } from "@/lib/data";
import type { Category, Product } from "@/lib/types";
import { cn } from "@/lib/utils";

const POPULAR = ["CarPlay stereo", "Dash cam", "Subwoofer", "LED headlights", "Speakers", "Amplifier"];
const VEHICLES = CAR_BRANDS.flatMap((b) => b.models.map((m) => ({ id: m.id, label: `${b.name} ${m.name}` })));
const CATEGORIES = Object.keys(CATEGORY_LABELS) as Category[];
const RECENT_KEY = "carbeat:recent-searches";

function readRecent(): string[] {
  try {
    const value = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
    return Array.isArray(value) ? value.filter((v) => typeof v === "string").slice(0, 5) : [];
  } catch {
    return [];
  }
}

function saveRecent(term: string, previous: string[]) {
  const next = [term, ...previous.filter((t) => t.toLowerCase() !== term.toLowerCase())].slice(0, 5);
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable (private mode); recent searches just won't persist.
  }
  return next;
}

/** Bolds the part of `text` that matches the query, so shoppers see why a result appeared. */
function Highlight({ text, query }: { text: string; query: string }) {
  const i = query ? text.toLowerCase().indexOf(query.toLowerCase()) : -1;
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className="bg-transparent font-semibold text-primary">{text.slice(i, i + query.length)}</mark>
      {text.slice(i + query.length)}
    </>
  );
}

type Option = { key: string; href: string; term?: string; render: () => ReactNode };

/**
 * Inline header search. Focus shows popular and recent searches; typing shows live product,
 * category and vehicle suggestions. Arrow keys move, Enter opens, Escape closes,
 * and Enter with nothing highlighted goes to the full results page.
 */
export function SearchBox({ className }: { className?: string }) {
  const router = useRouter();
  const listId = useId();
  const root = useRef<HTMLFormElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [recent, setRecent] = useState<string[]>([]);
  const [results, setResults] = useState<{ q: string; products: Product[] } | null>(null);
  const q = query.trim();
  const loading = q.length > 0 && results?.q !== q;

  // Live product results: debounced, and stale requests are cancelled.
  useEffect(() => {
    if (!q) return;
    const controller = new AbortController();
    const id = setTimeout(async () => {
      try {
        const res = await fetch(`/api/products?${new URLSearchParams({ q, limit: "5" })}`, { signal: controller.signal });
        const data = (await res.json()) as { products: Product[] };
        setResults({ q, products: data.products });
      } catch {
        if (!controller.signal.aborted) setResults({ q, products: [] });
      }
    }, 150);
    return () => {
      clearTimeout(id);
      controller.abort();
    };
  }, [q]);

  // ⌘K / Ctrl+K or "/" jumps to the search box from anywhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && (e.target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName));
      if (((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") || (e.key === "/" && !typing)) {
        e.preventDefault();
        input.current?.focus();
      }
    };
    const onPointer = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, []);

  const go = (href: string, term?: string) => {
    if (term) setRecent((prev) => saveRecent(term, prev));
    setOpen(false);
    setActive(-1);
    input.current?.blur();
    router.push(href);
  };

  const lower = q.toLowerCase();
  const products = q && results?.q === q ? results.products : [];
  const categories = q ? CATEGORIES.filter((c) => CATEGORY_LABELS[c].toLowerCase().includes(lower) || c.includes(lower)).slice(0, 3) : [];
  // Every typed word must start a word of the vehicle name: "toy hi" finds Toyota HiLux, "sub" finds nothing.
  const vehicles = q
    ? VEHICLES.filter((v) => {
        const words = v.label.toLowerCase().split(/[\s-]+/);
        return lower.split(/\s+/).every((t) => words.some((w) => w.startsWith(t) || w.replace(/[^a-z0-9]/g, "").startsWith(t)));
      }).slice(0, 3)
    : [];

  // Flat option list, so arrow keys walk every group in on-screen order.
  const groups: { title: string; options: Option[] }[] = q
    ? [
        {
          title: "Vehicles",
          options: vehicles.map((v) => ({
            key: `v-${v.id}`,
            href: `/shop?model=${v.id}`,
            term: v.label,
            render: () => (
              <>
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <CarFront className="size-5" />
                </span>
                <span className="flex-1">
                  Parts for <Highlight text={v.label} query={q} />
                </span>
              </>
            ),
          })),
        },
        {
          title: "Categories",
          options: categories.map((c) => ({
            key: `c-${c}`,
            href: `/shop?category=${c}`,
            term: CATEGORY_LABELS[c],
            render: () => (
              <>
                <span className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-muted">
                  <Image src={CATEGORY_IMAGES[c]} alt="" fill sizes="40px" className="object-cover" />
                </span>
                <span className="flex-1">
                  <Highlight text={CATEGORY_LABELS[c]} query={q} />
                  <span className="block text-xs text-muted-foreground">Category</span>
                </span>
              </>
            ),
          })),
        },
        {
          title: "Products",
          options: products.map((p) => ({
            key: `p-${p.id}`,
            href: `/products/${p.slug}`,
            term: q,
            render: () => (
              <>
                <span className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-muted">
                  <Image src={p.image} alt="" fill sizes="40px" className="object-cover" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate">
                    <Highlight text={p.name} query={q} />
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {p.brand} · {CATEGORY_LABELS[p.category]}
                  </span>
                </span>
                <span className="text-right">
                  <span className={cn("block font-semibold", p.deal && "text-destructive")}>{formatPrice(p.deal?.price ?? p.price)}</span>
                  {p.deal && <span className="block text-[11px] text-muted-foreground line-through">{formatPrice(p.rrp)}</span>}
                </span>
              </>
            ),
          })),
        },
      ]
    : [
        {
          title: "Recent searches",
          options: recent.map((term) => ({
            key: `r-${term}`,
            href: `/shop?q=${encodeURIComponent(term)}`,
            term,
            render: () => (
              <>
                <Clock className="size-4 text-muted-foreground" />
                <span className="flex-1">{term}</span>
                <ArrowUpLeft className="size-4 text-muted-foreground" />
              </>
            ),
          })),
        },
      ];

  const options = groups.flatMap((g) => g.options);
  const allHref = `/shop?q=${encodeURIComponent(q)}`;

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      if (options.length === 0) return;
      // Cycles through the options and back to the input (-1).
      const last = options.length - 1;
      setActive((i) => (e.key === "ArrowDown" ? (i >= last ? -1 : i + 1) : i <= -1 ? last : i - 1));
    } else if (e.key === "Escape") {
      if (open) setOpen(false);
      else input.current?.blur();
    }
  };

  // -1 = nothing highlighted. Clamped because the option list can shrink while typing.
  const activeIndex = active >= options.length ? -1 : active;
  const activeOption = activeIndex >= 0 ? options[activeIndex] : undefined;
  let index = -1;

  return (
    <form
      ref={root}
      role="search"
      className={cn("relative", className)}
      onSubmit={(e) => {
        e.preventDefault();
        if (activeOption) go(activeOption.href, activeOption.term);
        else if (q) go(allHref, q);
        else input.current?.focus();
      }}
    >
      <div
        className={cn(
          "flex h-11 items-center gap-2 rounded-full border pl-4 pr-1 text-foreground transition-[background-color,border-color,box-shadow]",
          open
            ? "border-primary bg-white shadow-[0_0_0_4px_color-mix(in_oklch,var(--primary),transparent_82%)]"
            : "border-transparent bg-secondary hover:border-border",
        )}
      >
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <input
          ref={input}
          type="search"
          name="q"
          value={query}
          autoComplete="off"
          enterKeyHint="search"
          placeholder="Search parts, brands or your car…"
          aria-label="Search products"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activeOption ? `${listId}-${activeOption.key}` : undefined}
          className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(-1);
            setOpen(true);
          }}
          onFocus={() => {
            setRecent(readRecent());
            setOpen(true);
          }}
          onKeyDown={onKeyDown}
        />
        {query ? (
          <button
            type="button"
            aria-label="Clear search"
            className="grid size-7 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={() => {
              setQuery("");
              setActive(-1);
              input.current?.focus();
            }}
          >
            <X className="size-4" />
          </button>
        ) : (
          <kbd className="hidden shrink-0 rounded-md border bg-card px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground lg:block">⌘K</kbd>
        )}
        <button type="submit" className="h-9 shrink-0 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-[color-mix(in_oklch,var(--primary),black_10%)]">
          Search
        </button>
      </div>

      {open && (
        <div className="absolute inset-x-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-2xl border bg-popover text-popover-foreground shadow-[0_24px_60px_-20px_oklch(0.2_0.01_25/0.4)] animate-in fade-in slide-in-from-top-1 duration-150">
          <div id={listId} role="listbox" aria-label="Search suggestions" className="max-h-[min(70vh,560px)] overflow-y-auto p-2">
            {groups.map(
              (g) =>
                g.options.length > 0 && (
                  <div key={g.title} role="group" aria-label={g.title} className="mb-1">
                    <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{g.title}</p>
                    {g.options.map((o) => {
                      index++;
                      const i = index;
                      return (
                        <div
                          key={o.key}
                          id={`${listId}-${o.key}`}
                          role="option"
                          aria-selected={i === activeIndex}
                          onPointerEnter={() => setActive(i)}
                          onPointerDown={(e) => e.preventDefault()}
                          onClick={() => go(o.href, o.term)}
                          className={cn("flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm", i === activeIndex && "bg-muted")}
                        >
                          {o.render()}
                        </div>
                      );
                    })}
                  </div>
                ),
            )}

            {!q && (
              <>
                <div className="px-3 pb-3 pt-2">
                  <p className="flex items-center gap-1.5 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <TrendingUp className="size-3.5" /> Popular searches
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {POPULAR.map((term) => (
                      <button
                        key={term}
                        type="button"
                        onPointerDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setQuery(term);
                          setOpen(true);
                          input.current?.focus();
                        }}
                        className="h-8 rounded-full border px-3 text-sm transition-colors hover:border-primary hover:text-primary"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="border-t px-3 pb-2 pt-3">
                  <p className="pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Browse categories</p>
                  <div className="grid grid-cols-2 gap-1 sm:grid-cols-4">
                    {CATEGORIES.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onPointerDown={(e) => e.preventDefault()}
                        onClick={() => go(`/shop?category=${c}`)}
                        className="flex items-center gap-2 rounded-lg p-1.5 text-left text-sm hover:bg-muted"
                      >
                        <span className="relative size-8 shrink-0 overflow-hidden rounded-md bg-muted">
                          <Image src={CATEGORY_IMAGES[c]} alt="" fill sizes="32px" className="object-cover" />
                        </span>
                        <span className="truncate">{CATEGORY_LABELS[c]}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {q && loading && options.length === 0 && (
              <p className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Searching…
              </p>
            )}
            {q && !loading && options.length === 0 && (
              <div className="px-3 py-8 text-center text-sm">
                <p className="font-medium">No matches for “{q}”</p>
                <p className="mt-1 text-muted-foreground">Try a product type like “speakers”, a brand, or your car model.</p>
              </div>
            )}
          </div>

          {q && (
            <button
              type="button"
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => go(allHref, q)}
              className="flex w-full items-center justify-between gap-3 border-t bg-muted/50 px-5 py-3 text-sm font-medium hover:bg-muted"
            >
              <span>
                See all results for <span className="text-primary">“{q}”</span>
              </span>
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                <kbd className="hidden rounded-sm border bg-card px-1.5 font-mono text-[10px] sm:block">Enter</kbd>
                <ArrowRight className="size-4" />
              </span>
            </button>
          )}
        </div>
      )}
    </form>
  );
}
