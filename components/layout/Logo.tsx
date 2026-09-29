import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
        <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden="true">
          <rect x="4" y="10" width="3" height="8" rx="1" />
          <rect x="10.5" y="5" width="3" height="13" rx="1" />
          <rect x="17" y="8" width="3" height="10" rx="1" />
        </svg>
      </span>
      <span className="font-display text-2xl font-bold uppercase tracking-tight">
        Car<span className="text-primary">Beat</span>
      </span>
    </span>
  );
}
