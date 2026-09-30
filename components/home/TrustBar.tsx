import { CreditCard, RotateCcw, ShieldCheck, Truck, Wrench } from "lucide-react";

const ITEMS = [
  { icon: Truck, title: "Free shipping", body: "Australia-wide over $99" },
  { icon: Wrench, title: "Pro fitting", body: "Installers in every capital" },
  { icon: ShieldCheck, title: "Fitment guarantee", body: "Or we pay return postage" },
  { icon: CreditCard, title: "No surprises", body: "Prices include GST" },
  { icon: RotateCcw, title: "30-day returns", body: "Change of mind is fine" },
];

/** Spec strip directly under the hero: five promises separated by hairlines. */
export function TrustBar() {
  return (
    <section aria-label="Why shop with CarBeat" className="border-b bg-card">
      <ul className="no-scrollbar mx-auto flex max-w-[1600px] snap-x overflow-x-auto sm:px-6 lg:px-8 lg:grid lg:grid-cols-5">
        {ITEMS.map(({ icon: Icon, title, body }) => (
          <li key={title} className="flex shrink-0 snap-start items-center gap-3 border-r px-5 py-5 last:border-r-0 lg:px-6">
            <Icon className="size-5 shrink-0 text-primary" />
            <span>
              <span className="block text-sm font-semibold">{title}</span>
              <span className="block text-xs text-muted-foreground">{body}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
