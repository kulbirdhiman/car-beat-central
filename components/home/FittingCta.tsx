import { ArrowRight, CalendarCheck, MapPin, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/Reveal";

const POINTS = [
  { icon: MapPin, label: "Installers in all 8 capital cities" },
  { icon: CalendarCheck, label: "Bookings Monday to Saturday" },
  { icon: ShieldCheck, label: "Workmanship guaranteed for 2 years" },
];

export function FittingCta() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal className="relative isolate grid overflow-clip rounded-3xl bg-ink text-ink-foreground lg:grid-cols-2">
          <div className="relative min-h-72 lg:order-2">
            <Image src="/images/trunk-audio.jpg" alt="Custom audio install in a car boot" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent lg:bg-gradient-to-r" />
          </div>
          <div className="relative p-8 sm:p-12">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">Professional fitting</p>
            <h2 className="mt-2 font-display text-5xl font-bold uppercase leading-none tracking-tight">Don&apos;t own a crimper? No worries.</h2>
            <p className="mt-4 max-w-md text-white/70">
              Buy online, then drop your car at a local CarBeat partner. Most stereo and speaker installs are done in under three hours.
            </p>
            <ul className="mt-6 space-y-3">
              {POINTS.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-3 text-sm">
                  <Icon className="size-5 text-primary" /> {label}
                </li>
              ))}
            </ul>
            <Button asChild size="lg" className="group mt-8 h-12 rounded-full px-6 text-base">
              <Link href="/fitting">
                Book a fitting <ArrowRight className="transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
