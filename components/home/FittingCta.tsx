import { ArrowRight, CalendarCheck, MapPin, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/Reveal";

const POINTS = [
  { icon: MapPin, value: "8", label: "Capital cities with partner installers" },
  { icon: CalendarCheck, value: "Mon–Sat", label: "Bookings, confirmed in one business day" },
  { icon: ShieldCheck, value: "2 yrs", label: "Workmanship guarantee on every install" },
];

export function FittingCta() {
  return (
    <section className="px-4 pb-20 sm:px-6 sm:pb-28 lg:px-8">
      <Reveal className="grain relative mx-auto grid max-w-[1536px] overflow-clip rounded-3xl bg-ink text-ink-foreground lg:grid-cols-[1.1fr_1fr]">
        <div className="relative min-h-72 lg:order-2 lg:min-h-full">
          <Image src="/images/trunk-audio.jpg" alt="Custom audio install in a car boot" fill sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/10 to-transparent lg:bg-gradient-to-r" />
        </div>
        <div className="relative z-10 px-6 py-12 sm:px-12 sm:py-16 lg:py-20">
          <p className="label-mono text-primary">Professional fitting</p>
          <h2 className="mt-4 max-w-lg font-display text-4xl font-bold leading-[1.02] sm:text-5xl">
            Don&apos;t own a crimper? <span className="text-white/45">No worries.</span>
          </h2>
          <p className="mt-5 max-w-md leading-relaxed text-white/65">
            Buy online, then drop your car at a local CarBeat partner. Most stereo and speaker installs are done in under three hours.
          </p>
          <dl className="mt-10 grid gap-px overflow-hidden rounded-lg bg-white/10 sm:grid-cols-3">
            {POINTS.map(({ icon: Icon, value, label }) => (
              <div key={label} className="bg-ink p-4">
                <dt className="sr-only">{label}</dt>
                <dd>
                  <Icon className="size-4 text-primary" />
                  <p className="mt-3 font-display text-2xl font-bold">{value}</p>
                  <p className="mt-1 text-xs leading-snug text-white/55">{label}</p>
                </dd>
              </div>
            ))}
          </dl>
          <Button asChild size="xl" className="group mt-10">
            <Link href="/fitting">
              Book a fitting <ArrowRight className="transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
      </Reveal>
    </section>
  );
}
