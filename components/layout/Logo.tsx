import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground shadow-[inset_0_1px_0_oklch(1_0_0/0.2)]">
        <svg viewBox="0 0 24 24" className="size-[18px]" fill="currentColor" aria-hidden="true">
          <rect x="4" y="10" width="3" height="8" rx="1" />
          <rect x="10.5" y="5" width="3" height="13" rx="1" />
          <rect x="17" y="8" width="3" height="10" rx="1" />
        </svg>
      </span>
      <span className="font-display text-[1.35rem] font-extrabold leading-none">
        Car<span className="text-primary">Beats</span>
      </span>
    </span>
  );
}
