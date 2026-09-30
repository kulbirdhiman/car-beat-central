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
    <div className={cn("mx-auto max-w-[1600px] px-4 pb-24 pt-36 sm:px-6 lg:px-8", className)}>
      {crumbs && (
        <Breadcrumb className="mb-8 [&_a]:transition-colors">
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
        <header className="mb-10 border-b pb-8">
          <h1 className="font-display text-4xl font-bold leading-[1.02] sm:text-6xl">{title}</h1>
          {description && <p className="mt-4 max-w-2xl text-muted-foreground">{description}</p>}
        </header>
      )}
      {children}
    </div>
  );
}
