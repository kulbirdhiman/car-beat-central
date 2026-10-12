"use client";

import { Loader2, MapPin } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import type { Locality } from "@/lib/types";
import { cn } from "@/lib/utils";

const cache = new Map<string, Locality[]>();

/**
 * The suburb field, with suggestions as the shopper types a suburb or postcode.
 * Picking one calls `onPick` so the form can fill in the state and postcode too. `state` narrows the suggestions.
 */
export function SuburbInput({
  id,
  name,
  value,
  state,
  onChange,
  onPick,
  invalid,
  className,
}: {
  id: string;
  name: string;
  value: string;
  state?: string;
  onChange: (value: string) => void;
  onPick: (locality: Locality) => void;
  invalid?: boolean;
  className?: string;
}) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [results, setResults] = useState<Locality[]>([]);
  const [loading, setLoading] = useState(false);
  // Only search after the shopper types, not for a prefilled or just-picked value.
  const [query, setQuery] = useState("");
  const blurTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    const key = `${state ?? ""}:${q.toLowerCase()}`;
    const hit = cache.get(key);
    const controller = new AbortController();
    const timer = setTimeout(
      async () => {
        if (hit) {
          setResults(hit);
          return;
        }
        setLoading(true);
        try {
          const params = new URLSearchParams({ q });
          if (state) params.set("state", state);
          const res = await fetch(`/api/localities?${params}`, { signal: controller.signal });
          const list: Locality[] = res.ok ? await res.json() : [];
          cache.set(key, list);
          setResults(list);
          setActive(0);
        } catch {
          // Aborted by a newer keystroke; that request will update the list.
        } finally {
          if (!controller.signal.aborted) setLoading(false);
        }
      },
      hit ? 0 : 150,
    );
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, state]);

  const pick = (l: Locality) => {
    onPick(l);
    setQuery("");
    setResults([]);
    setOpen(false);
  };

  const showList = open && query.trim().length >= 2;

  return (
    <div className="relative">
      <Input
        id={id}
        name={name}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          blurTimer.current = setTimeout(() => setOpen(false), 120);
        }}
        onKeyDown={(e) => {
          if (!showList || results.length === 0) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((i) => (i + 1) % results.length);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((i) => (i - 1 + results.length) % results.length);
          } else if (e.key === "Enter") {
            e.preventDefault();
            pick(results[active] ?? results[0]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showList && results[active] ? `${listId}-${active}` : undefined}
        aria-invalid={invalid}
        autoComplete="address-level2"
        placeholder="Type suburb or postcode"
        required
        className={cn("pr-9", className)}
      />
      {loading && <Loader2 className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-full z-50 mt-1 max-h-72 overflow-auto rounded-xl border bg-popover p-1 text-popover-foreground shadow-lg animate-in fade-in-0"
          onMouseDown={() => clearTimeout(blurTimer.current)}
        >
          {results.length === 0 ? (
            <li className="px-3 py-2.5 text-sm text-muted-foreground">{loading ? "Searching…" : "No matching suburbs — you can still type it in."}</li>
          ) : (
            results.map((l, i) => (
              <li
                key={`${l.suburb}-${l.state}-${l.postcode}`}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(l)}
                className={cn("flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm", i === active && "bg-muted")}
              >
                <MapPin className="size-4 shrink-0 text-muted-foreground" />
                <span className="flex-1 truncate font-medium">{l.suburb}</span>
                <span className="tabular-nums text-muted-foreground">
                  {l.state} {l.postcode}
                </span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
