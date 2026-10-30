import { ArrowRight, Gauge, Package } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import type { StoreDepartment } from "@/lib/types";
import { SectionHeading } from "./SectionHeading";

const CATEGORY_ORDER = [
  { name: "Digital Clusters", match: /digital.*cluster|instrument.*cluster|digital.*dash/i, icon: Gauge },
  { name: "Stereos", match: /stereo|satnav|head.?unit|carplay/i, icon: Gauge },
  { name: "Steering Wheels", match: /steering.*wheel/i, icon: Gauge },
  { name: "Accessories & Add-ons", match: /accessor|add.?on|extras/i, icon: Package },
];

/** Main upgrade categories in shopping order, followed by accessories. */
export function CategoryGrid({ departments }: { departments: StoreDepartment[] }) {
  if (departments.length === 0) return null;
  const all = departments.flatMap((d) => [d, ...d.children]);
  const categories = CATEGORY_ORDER.map((category) => ({ ...category, department: all.find((d) => category.match.test(`${d.name} ${d.slug}`)) }));

  return (
    <section id="categories" className="mx-auto max-w-[1440px] scroll-mt-32 px-4 pt-16 sm:px-6 sm:pt-24 lg:px-8">
      <SectionHeading
        eyebrow="Shop by category"
        title="Everything your car's missing"
        action={
          <Link href="/shop" className="group inline-flex items-center gap-1.5 text-sm font-semibold hover:text-primary">
            View all products <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>
        }
      />
      <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {categories.map(({ name, department: d, icon: Icon }, i) => d ? (
          <Reveal as="li" key={name} delay={i * 50}>
            <Link href={`/shop?dept=${d.slug}`} className="group block h-full rounded-xl border bg-card p-1.5 transition-[border-color,box-shadow] sm:rounded-2xl sm:p-2 hover:border-primary/40 hover:shadow-[0_16px_32px_-20px_oklch(0.25_0.01_25/0.35)]">
              <span className="relative block aspect-square overflow-hidden rounded-lg bg-muted sm:rounded-xl">
                <Image src={d.image} alt="" fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover transition-transform duration-700 group-hover:scale-110" />
              </span>
              <span className="block px-0.5 pb-1 pt-2 sm:px-1.5 sm:pt-3">
                <span className="block text-sm font-semibold leading-tight group-hover:text-primary">{name}</span>
                <span className="mt-0.5 hidden text-xs text-muted-foreground sm:block">
                  {d.count} {d.count === 1 ? "product" : "products"}
                </span>
              </span>
            </Link>
          </Reveal>
        ) : (
          <Reveal as="li" key={name} delay={i * 50}>
            <div className="h-full rounded-2xl border bg-card p-2">
              <div className="grid aspect-square place-items-center rounded-xl bg-muted"><Icon className="size-16 text-muted-foreground/40" strokeWidth={1} /></div>
              <div className="px-1.5 pb-1 pt-3">
                <p className="text-sm font-semibold">{name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Coming soon</p>
              </div>
            </div>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}
