import { ArrowRight, Mail, type LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { SUPPORT_EMAIL } from "@/lib/data";

export type PolicyHighlight = { icon: LucideIcon; title: string; body: string };
export type PolicySection = { id: string; title: string; content: ReactNode };

/**
 * Shared layout for policy pages: "at a glance" cards, a sticky table of contents,
 * the numbered sections, then a help panel.
 */
export function PolicyPage({
  title,
  description,
  updated,
  highlights,
  sections,
  related,
}: {
  title: string;
  description: string;
  updated: string;
  highlights: PolicyHighlight[];
  sections: PolicySection[];
  related: { label: string; href: string };
}) {
  return (
    <PageShell crumbs={[{ label: "Home", href: "/" }, { label: "Help" }, { label: title }]} title={title} description={description}>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {highlights.map(({ icon: Icon, title, body }) => (
          <li key={title} className="flex items-start gap-3 rounded-2xl border bg-card p-5">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
              <Icon className="size-5" />
            </span>
            <span>
              <span className="block font-semibold">{title}</span>
              <span className="mt-0.5 block text-sm text-muted-foreground">{body}</span>
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-12 grid gap-10 lg:grid-cols-[240px_1fr] lg:gap-16">
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <p className="label-mono text-muted-foreground">On this page</p>
          <nav aria-label="On this page" className="mt-3">
            <ol className="space-y-0.5 border-l text-sm">
              {sections.map((s, i) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="-ml-px flex gap-2 border-l-2 border-transparent py-1.5 pl-4 text-muted-foreground transition-colors hover:border-primary hover:text-foreground">
                    <span className="font-mono text-xs leading-5 text-primary">{String(i + 1).padStart(2, "0")}</span>
                    {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
          <p className="mt-6 text-xs text-muted-foreground">Last updated {updated}</p>
        </aside>

        <div className="min-w-0 max-w-3xl">
          {sections.map((s, i) => (
            <section key={s.id} id={s.id} className="scroll-mt-28 border-b py-10 first:pt-0 last:border-b-0">
              <p className="font-mono text-xs font-semibold text-primary">{String(i + 1).padStart(2, "0")}</p>
              <h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl">{s.title}</h2>
              <div className="policy-prose mt-4">{s.content}</div>
            </section>
          ))}

          <div className="grain relative isolate mt-6 overflow-clip rounded-2xl bg-ink p-6 text-ink-foreground sm:p-8">
            <div className="absolute -right-16 -top-16 -z-10 size-56 rounded-full bg-primary/40 blur-3xl" />
            <span className="grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Mail className="size-5" />
            </span>
            <h2 className="mt-4 font-display text-2xl font-bold">Need a hand?</h2>
            <p className="mt-2 max-w-lg text-white/65">
              Email us with your order number and we&apos;ll reply within one business day, Monday to Saturday.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="xl">
                <a href={`mailto:${SUPPORT_EMAIL}`}>
                  {SUPPORT_EMAIL} <ArrowRight />
                </a>
              </Button>
              <Button asChild size="xl" variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white hover:text-foreground">
                <Link href={related.href}>{related.label}</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

/** Numbered process steps, e.g. how to start a return. */
export function PolicySteps({ steps }: { steps: { title: string; body: ReactNode }[] }) {
  return (
    <ol className="not-prose mt-5 grid gap-3 sm:grid-cols-2">
      {steps.map((step, i) => (
        <li key={step.title} className="rounded-xl border bg-card p-5">
          <span className="grid size-8 place-items-center rounded-full bg-primary font-mono text-sm font-bold text-primary-foreground">{i + 1}</span>
          <p className="mt-3 font-semibold text-foreground">{step.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
        </li>
      ))}
    </ol>
  );
}

/** Highlighted note inside a section. */
export function PolicyNote({ children }: { children: ReactNode }) {
  return <div className="not-prose mt-5 rounded-xl border-l-4 border-primary bg-primary/5 p-4 text-sm text-foreground">{children}</div>;
}
