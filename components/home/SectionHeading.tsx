import type { ReactNode } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/utils";

type Props = {
  /** Two-digit section number shown in the rule above the title, e.g. "02". */
  index?: string;
  eyebrow: string;
  title: ReactNode;
  description?: string;
  action?: ReactNode;
  tone?: "light" | "dark";
};

/** Index rule on top, then title left and description/action right on wide screens. */
export function SectionHeading({ index, eyebrow, title, description, action, tone = "light" }: Props) {
  const dark = tone === "dark";
  return (
    <Reveal className="mb-12">
      <div className={cn("flex items-center gap-3 border-t pt-4", dark ? "border-white/15 text-white/50" : "border-foreground/15 text-muted-foreground")}>
        {index && <span className="label-mono text-primary">{index}</span>}
        <span className="label-mono">{eyebrow}</span>
      </div>
      <div className="mt-6 grid gap-5 lg:grid-cols-[1.5fr_1fr] lg:items-end">
        <h2 className="font-display text-4xl font-bold leading-[1.02] sm:text-5xl">{title}</h2>
        {(description || action) && (
          <div className="flex flex-wrap items-end justify-between gap-4 lg:justify-self-end lg:text-right">
            {description && <p className={cn("max-w-sm", dark ? "text-white/60" : "text-muted-foreground")}>{description}</p>}
            {action}
          </div>
        )}
      </div>
    </Reveal>
  );
}
