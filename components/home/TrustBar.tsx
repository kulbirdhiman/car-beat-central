import { CreditCard, RotateCcw, ShieldCheck, Truck, Wrench } from "lucide-react";

const ITEMS = [
  { icon: Truck, title: "$31 standard shipping", body: "Australia-wide delivery" },
  { icon: ShieldCheck, title: "Fitment guarantee", body: "Or we pay return postage" },
  { icon: Wrench, title: "Pro installers", body: "In every capital city" },
  { icon: CreditCard, title: "No surprises", body: "Prices include GST" },
  { icon: RotateCcw, title: "30-day returns", body: "Change of mind is fine" },
];

export function TrustBar() {
  return (
    <section aria-label="Why shop with CarBeat" className="mx-auto max-w-[1440px] px-4 pt-3 sm:px-6 lg:px-8">
      <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-3 xl:grid-cols-5">
        {ITEMS.map(({ icon: Icon, title, body }) => (
          <li
            key={title}
            className="flex min-w-0 items-center gap-2 bg-card px-3 py-3 last:col-span-2 sm:last:col-span-1 xl:gap-3 xl:px-5 xl:py-4"
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
              <Icon className="size-5" />
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-semibold sm:text-sm">{title}</span>
              <span className="block text-[11px] sm:text-xs text-muted-foreground">{body}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
