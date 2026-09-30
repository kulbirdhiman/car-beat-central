import { CarFront, PackageCheck, ShoppingCart, Wrench } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "./SectionHeading";

const STEPS = [
  { icon: CarFront, title: "Tell us your car", body: "Pick your make and model once. We'll only show parts that fit, and remember it next time." },
  { icon: ShoppingCart, title: "Choose your upgrade", body: "Compare prices, today's deals and ratings from drivers with the same car." },
  { icon: PackageCheck, title: "Fast, free delivery", body: "Free shipping over $99, same-day dispatch from Sydney and Melbourne." },
  { icon: Wrench, title: "Fit it or we will", body: "DIY with our guides, or book a certified installer in any capital city." },
];

/** Four steps on a shared rule, like stops on a route; no boxes. */
export function HowItWorks() {
  return (
    <section className="pb-14 sm:pb-16">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <SectionHeading index="06" eyebrow="How it works" title="Upgrade in four steps" description="No car-audio jargon, no guessing if it fits." />
        <ol className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ icon: Icon, title, body }, i) => (
            <Reveal as="li" key={title} delay={i * 100} className="group">
              <div className="flex items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-md bg-card text-primary shadow-sm ring-1 ring-foreground/[0.07] transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="size-5" />
                </span>
                <span className="h-px flex-1 bg-foreground/15" />
                <span className="label-mono text-muted-foreground">Step {i + 1}</span>
              </div>
              <h3 className="mt-6 font-display text-xl font-bold">{title}</h3>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">{body}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
