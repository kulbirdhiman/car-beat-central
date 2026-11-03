import type { ReactNode } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/utils";

type Props = {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  tone?: "light" | "dark";
  className?: string;
};

/** Eyebrow, title and description on the left; a "view all" style action on the right. */
export function SectionHeading({ eyebrow, title, description, action, tone = "light", className }: Props) {
  const dark = tone === "dark";
  return (
    <Reveal className={cn("mb-5 flex min-w-0 flex-wrap items-end justify-between gap-x-6 gap-y-3 sm:mb-8", className)}>
      <div className="max-w-2xl">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          <span className="h-0.5 w-5 rounded-full bg-primary" />
          {eyebrow}
        </p>
        <h2 className="mt-2 font-display text-2xl font-bold leading-[1.05] sm:text-4xl lg:text-[2.75rem]">{title}</h2>
        {description && <p className={cn("mt-2 max-w-xl text-sm sm:text-base", dark ? "text-white/65" : "text-muted-foreground")}>{description}</p>}
      </div>
      {action}
    </Reveal>
  );
}
