import { CreditCard, RotateCcw, ShieldCheck, Truck, Wrench } from "lucide-react";

const ITEMS = [
  { icon: Truck, title: "Free shipping", body: "Australia-wide over $99" },
  { icon: ShieldCheck, title: "Fitment guarantee", body: "Or we pay return postage" },
  { icon: Wrench, title: "Pro installers", body: "In every capital city" },
  { icon: CreditCard, title: "No surprises", body: "Prices include GST" },
  { icon: RotateCcw, title: "30-day returns", body: "Change of mind is fine" },
];

export function TrustBar() {
  return (
    <section aria-label="Why shop with CarBeat" className="mx-auto max-w-[1440px] px-4 pt-3 sm:px-6 lg:px-8">
      <ul className="no-scrollbar flex gap-px overflow-x-auto rounded-2xl border bg-border lg:grid lg:grid-cols-5">
        {ITEMS.map(({ icon: Icon, title, body }) => (
          <li
            key={title}
            className="flex min-w-[220px] shrink-0 items-center gap-3 bg-card px-5 py-4 first:rounded-l-2xl last:rounded-r-2xl lg:min-w-0"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
              <Icon className="size-5" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold">{title}</span>
              <span className="block truncate text-xs text-muted-foreground">{body}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
