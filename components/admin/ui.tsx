import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ORDER_STATUS_LABEL, PROMO_STATUS_LABEL, type PromoStatus } from "@/lib/admin/mock-data";
import type { OrderStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl font-bold sm:text-4xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

const STATUS_STYLE: Record<OrderStatus, string> = {
  pending_payment: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  paid: "bg-sky-500/15 text-sky-700 dark:text-sky-400",
  fulfilled: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  cancelled: "bg-muted text-muted-foreground line-through",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge className={cn("border-transparent", STATUS_STYLE[status])}>{ORDER_STATUS_LABEL[status]}</Badge>;
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-12 text-center text-sm text-muted-foreground">{children}</p>;
}

export const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short", timeZone: "Australia/Sydney" });

export function Field({ id, label, error, className, children }: { id?: string; label: string; error?: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric", timeZone: "Australia/Sydney" });

const PROMO_STYLE: Record<PromoStatus, string> = {
  live: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  scheduled: "bg-sky-500/15 text-sky-700 dark:text-sky-400",
  expired: "bg-muted text-muted-foreground",
  used_up: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  off: "bg-muted text-muted-foreground",
};

export function PromoStatusBadge({ status }: { status: PromoStatus }) {
  return <Badge className={cn("border-transparent", PROMO_STYLE[status])}>{PROMO_STATUS_LABEL[status]}</Badge>;
}

const fmtDay = (ymd: string) =>
  new Date(`${ymd}T00:00:00`).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });

/** "1 Aug 2026 – 31 Dec 2026", "From 1 Sept 2026", "Until …", or "Always on". */
export function fmtSchedule(startsAt: string | null, endsAt: string | null) {
  if (startsAt && endsAt) return `${fmtDay(startsAt)} – ${fmtDay(endsAt)}`;
  if (startsAt) return `From ${fmtDay(startsAt)}`;
  if (endsAt) return `Until ${fmtDay(endsAt)}`;
  return "Always on";
}
