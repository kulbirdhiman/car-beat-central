import type { ReactNode } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";

type Crumb = { label: string; href?: string };

/** Inner-page wrapper: clears the fixed header and renders breadcrumbs + title. */
export function PageShell({
  crumbs,
  title,
  description,
  children,
  className,
}: {
  crumbs?: Crumb[];
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto max-w-7xl px-4 pb-24 pt-36 sm:px-6", className)}>
      {crumbs && (
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            {crumbs.map((c, i) => (
              <span key={c.label} className="contents">
                {i > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem>
                  {c.href ? <BreadcrumbLink href={c.href}>{c.label}</BreadcrumbLink> : <BreadcrumbPage>{c.label}</BreadcrumbPage>}
                </BreadcrumbItem>
              </span>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      )}
      {title && (
        <header className="mb-10">
          <h1 className="font-display text-5xl font-bold uppercase leading-none tracking-tight sm:text-6xl">{title}</h1>
          {description && <p className="mt-3 max-w-2xl text-muted-foreground">{description}</p>}
        </header>
      )}
      {children}
    </div>
  );
}
