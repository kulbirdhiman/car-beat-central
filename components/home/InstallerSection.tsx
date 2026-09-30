import { ArrowRight, CalendarCheck, CheckCircle2, MapPin, ShieldCheck, Sparkles, Wrench } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/Reveal";
import { FITTING_CITIES } from "@/lib/data";

const POINTS = [
  { icon: ShieldCheck, title: "Certified installers", body: "Trained to fit to manufacturer spec" },
  { icon: Sparkles, title: "Clean factory finish", body: "No cut wires, no rattles" },
  { icon: CalendarCheck, title: "Quick turnaround", body: "Most installs done in 3 hours" },
  { icon: Wrench, title: "2-year guarantee", body: "On workmanship, every install" },
];

/** Installer finder: benefits, the cities we cover, and one clear booking action. */
export function InstallerSection() {
  return (
    <section className="mx-auto max-w-[1440px] px-4 pt-16 sm:px-6 sm:pt-24 lg:px-8">
      <Reveal className="grain relative grid overflow-clip rounded-3xl bg-ink text-ink-foreground lg:grid-cols-[1fr_1.1fr]">
        <div className="relative min-h-72 lg:min-h-full">
          <Image src="/images/trunk-audio.jpg" alt="Custom audio install in a car boot" fill sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/10 to-transparent lg:bg-gradient-to-l" />
        </div>

        <div className="relative z-10 p-6 sm:p-10 lg:p-14">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            <span className="h-0.5 w-5 rounded-full bg-primary" /> Professional installation
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold leading-[1.05] sm:text-4xl">Find a CarBeat installer near you</h2>
          <p className="mt-4 max-w-lg text-white/65">Buy online, then drop your car at a local partner. Fast, clean and hassle-free.</p>

          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {POINTS.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex gap-3 rounded-xl bg-white/[0.06] p-4 ring-1 ring-white/10">
                <Icon className="mt-0.5 size-5 shrink-0 text-primary" />
                <span>
                  <span className="block text-sm font-semibold">{title}</span>
                  <span className="block text-xs text-white/55">{body}</span>
                </span>
              </li>
            ))}
          </ul>

          <p className="mt-8 flex items-center gap-2 text-sm font-medium">
            <MapPin className="size-4 text-primary" /> Installing in {FITTING_CITIES.length} cities
          </p>
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {FITTING_CITIES.map((city) => (
              <li key={city} className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs">
                <CheckCircle2 className="size-3 text-success" /> {city}
              </li>
            ))}
          </ul>

          <Button asChild size="xl" className="group mt-8">
            <Link href="/fitting">
              Book an installer <ArrowRight className="transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
      </Reveal>
    </section>
  );
}
