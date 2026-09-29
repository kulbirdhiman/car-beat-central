import { CreditCard, RotateCcw, ShieldCheck, Truck, Wrench } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";

const ITEMS = [
  { icon: Truck, title: "Free shipping", body: "Australia-wide over $99" },
  { icon: Wrench, title: "Pro fitting", body: "Installers in every capital" },
  { icon: ShieldCheck, title: "Fitment guarantee", body: "Or we pay return postage" },
  { icon: CreditCard, title: "No surprises", body: "Prices include GST" },
  { icon: RotateCcw, title: "30-day returns", body: "Change of mind is fine" },
];

export function TrustBar() {
  return (
    <section className="border-b bg-background">
      <ul className="no-scrollbar mx-auto flex max-w-7xl gap-8 overflow-x-auto px-4 py-6 sm:px-6 lg:justify-between">
        {ITEMS.map(({ icon: Icon, title, body }, i) => (
          <Reveal as="li" key={title} delay={i * 60} className="flex shrink-0 items-center gap-3">
            <span className="grid size-11 place-items-center rounded-full bg-primary/10 text-primary">
              <Icon className="size-5" />
            </span>
            <span>
              <span className="block text-sm font-semibold">{title}</span>
              <span className="text-xs text-muted-foreground">{body}</span>
            </span>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}
