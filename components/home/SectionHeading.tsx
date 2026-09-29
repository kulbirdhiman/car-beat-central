import type { ReactNode } from "react";
import { Reveal } from "@/components/ui/Reveal";

type Props = {
  eyebrow: string;
  title: ReactNode;
  description?: string;
  action?: ReactNode;
};

export function SectionHeading({ eyebrow, title, description, action }: Props) {
  return (
    <Reveal className="mb-10 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">{eyebrow}</p>
        <h2 className="mt-2 font-display text-4xl font-bold uppercase leading-none tracking-tight text-balance sm:text-5xl">
          {title}
        </h2>
        {description && <p className="mt-3 text-muted-foreground text-pretty">{description}</p>}
      </div>
      {action}
    </Reveal>
  );
}
