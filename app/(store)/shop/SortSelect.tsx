"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function SortSelect({ value, options }: { value: string; options: { value: string; label: string }[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <Select
      value={value}
      onValueChange={(v) => {
        const next = new URLSearchParams(searchParams);
        if (v === "popular") next.delete("sort");
        else next.set("sort", v);
        router.push(`${pathname}?${next}`, { scroll: false });
      }}
    >
      <SelectTrigger className="h-10! w-48" aria-label="Sort by">
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
