"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Wheel = { id: string; name: string; slug: string; image: string };

export function SteeringWheelGallery({ wheels, colours }: { wheels: Wheel[]; colours: string[] }) {
  const [selected, setSelected] = useState(wheels[0]);
  if (!selected) return null;

  return (
    <div className="flex min-w-0 flex-col rounded-2xl border bg-white p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-widest text-neutral-500">
        <span>Explore the collection</span>
        <span className="rounded-full bg-neutral-100 px-3 py-1.5 text-neutral-700">{wheels.length} designs</span>
      </div>
      <Link href={`/products/${selected.slug}`} className="group relative my-3 block aspect-[5/4]">
        <Image src={selected.image} alt={selected.name} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-contain p-3 transition-transform duration-500 group-hover:scale-105" />
        <span className="absolute bottom-0 right-0 rounded-full border bg-white p-3 text-neutral-900"><ArrowUpRight className="size-5" /></span>
      </Link>
      <div className="mb-4 flex items-start justify-between gap-3">
        <p aria-live="polite" className="text-sm font-semibold text-neutral-900">{selected.name}</p>
        <Link href={`/products/${selected.slug}`} className="shrink-0 text-xs font-semibold text-primary underline underline-offset-4">View details</Link>
      </div>
      <p className="mb-3 text-xs text-neutral-500">Select a design to preview</p>
      <div role="group" aria-label="Steering wheel designs" className="grid max-h-48 grid-cols-[repeat(auto-fill,minmax(64px,1fr))] gap-2 overflow-y-auto p-1 sm:grid-cols-[repeat(auto-fill,minmax(80px,1fr))]">
        {wheels.map((wheel) => (
          <button key={wheel.id} type="button" title={wheel.name} aria-label={wheel.name} aria-pressed={selected.id === wheel.id} onClick={() => setSelected(wheel)} className={cn("relative aspect-square w-full overflow-hidden rounded-xl border-2 bg-white transition-colors focus-visible:outline-2 focus-visible:outline-primary", selected.id === wheel.id ? "border-primary bg-primary/5" : "border-neutral-100 hover:border-neutral-300")}>
            <Image src={wheel.image} alt="" fill sizes="80px" className="object-contain p-1.5" />
          </button>
        ))}
      </div>
      {colours.length > 0 && <div className="mt-4 border-t border-neutral-100 pt-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">Colours across the collection</p>
        <ul className="flex flex-wrap gap-2">{colours.map((colour) => <li key={colour} className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs text-neutral-700">{colour}</li>)}</ul>
      </div>}
    </div>
  );
}
