import type { Metadata } from "next";
import { Clock, MapPin, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { PageShell } from "@/components/layout/PageShell";
import { BookingForm } from "./BookingForm";

export const metadata: Metadata = {
  title: "Book a fitting · CarBeat",
  description: "Book a certified CarBeat installer in any Australian capital city.",
};

const PRICES = [
  { job: "Stereo / head unit", from: 149 },
  { job: "Front or rear speakers", from: 99 },
  { job: "Subwoofer + amplifier", from: 199 },
  { job: "Dash cam (hardwired)", from: 129 },
  { job: "LED headlights", from: 89 },
];

export default function FittingPage() {
  return (
    <PageShell
      crumbs={[{ label: "Home", href: "/" }, { label: "Book a fitting" }]}
      title="Book a fitting"
      description="Certified installers in every capital city. Tell us about your car and we'll confirm a time within one business day."
    >
      <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr]">
        <BookingForm />

        <aside className="space-y-6">
          <div className="relative aspect-[4/3] overflow-clip rounded-2xl">
            <Image src="/images/trunk-audio.jpg" alt="Finished custom audio install" fill sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover" />
          </div>
          <div className="rounded-2xl border bg-card p-6">
            <h2 className="font-display text-2xl font-bold uppercase">Fitting prices</h2>
            <p className="text-sm text-muted-foreground">Guide prices, confirmed before we start.</p>
            <ul className="mt-4 divide-y text-sm">
              {PRICES.map((p) => (
                <li key={p.job} className="flex justify-between py-2.5">
                  <span>{p.job}</span>
                  <span className="font-medium">from ${p.from}</span>
                </li>
              ))}
            </ul>
          </div>
          <ul className="space-y-3 text-sm">
            <li className="flex gap-3">
              <MapPin className="size-5 shrink-0 text-primary" /> Sydney, Melbourne, Brisbane, Perth, Adelaide, Hobart, Canberra and Darwin
            </li>
            <li className="flex gap-3">
              <Clock className="size-5 shrink-0 text-primary" /> Monday to Saturday. Most installs take 1-3 hours.
            </li>
            <li className="flex gap-3">
              <ShieldCheck className="size-5 shrink-0 text-primary" /> 2-year workmanship guarantee
            </li>
          </ul>
        </aside>
      </div>
    </PageShell>
  );
}
