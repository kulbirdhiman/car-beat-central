"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useOptimistic, useTransition } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function SortSelect({ value, options }: { value: string; options: { value: string; label: string }[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useOptimistic(value);

  return (
    <Select
      value={selected}
      onValueChange={(v) => {
        const next = new URLSearchParams(searchParams);
        next.delete("page");
        if (v === "popular") next.delete("sort");
        else next.set("sort", v);
        startTransition(() => {
          setSelected(v);
          router.push(`${pathname}?${next}`, { scroll: false });
        });
      }}
    >
      <SelectTrigger className="h-10! w-48 bg-card" aria-label="Sort by" aria-busy={pending}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
