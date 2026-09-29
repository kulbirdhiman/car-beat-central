import { CarFront, PackageCheck, ShoppingCart, Wrench } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "./SectionHeading";

const STEPS = [
  { icon: CarFront, title: "Tell us your car", body: "Pick your make and model once. We'll only show parts that fit, and remember it next time." },
  { icon: ShoppingCart, title: "Choose your upgrade", body: "Compare prices, today's deals and ratings from drivers with the same car." },
  { icon: PackageCheck, title: "Fast, free delivery", body: "Free shipping over $99, same-day dispatch from Sydney and Melbourne." },
  { icon: Wrench, title: "Fit it or we will", body: "DIY with our guides, or book a certified installer in any capital city." },
];

export function HowItWorks() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading eyebrow="How it works" title="Upgrade in four easy steps" description="No car-audio jargon, no guessing if it fits." />
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ icon: Icon, title, body }, i) => (
            <Reveal as="li" key={title} delay={i * 100} className="group relative overflow-clip rounded-2xl border bg-card p-6 transition-shadow hover:shadow-lg">
              <span className="absolute -right-2 -top-6 font-display text-[7rem] font-extrabold leading-none text-muted transition-colors group-hover:text-primary/15">
                {i + 1}
              </span>
              <span className="relative grid size-12 place-items-center rounded-xl bg-primary text-primary-foreground transition-transform group-hover:-rotate-6 group-hover:scale-110">
                <Icon className="size-6" />
              </span>
              <h3 className="relative mt-5 font-display text-2xl font-bold uppercase">{title}</h3>
              <p className="relative mt-2 text-sm text-muted-foreground">{body}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
