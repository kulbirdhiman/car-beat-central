import { Truck } from "lucide-react";
import type { ReactNode } from "react";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCents } from "@/lib/data";
import { DELIVERY_OPTIONS, type Totals } from "@/lib/pricing";
import { cn } from "@/lib/utils";

const FREE_OVER = DELIVERY_OPTIONS.standard.freeOver;

export function OrderSummary({ totals, stale, children }: { totals: Totals | null; stale?: boolean; children?: ReactNode }) {
  if (!totals) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-5 w-full" />
        ))}
      </div>
    );
  }

  const goods = totals.subtotal - totals.discount;
  const toFree = FREE_OVER - goods;

  return (
    <div className={cn("space-y-3 text-sm transition-opacity", stale && "opacity-60")}>
      {toFree > 0 ? (
        <div className="rounded-xl bg-primary/10 p-3">
          <p className="flex items-center gap-2 font-medium">
            <Truck className="size-4 text-primary" /> {formatCents(toFree)} away from free shipping
          </p>
          <Progress value={(goods / FREE_OVER) * 100} className="mt-2 h-1.5" />
        </div>
      ) : (
        <p className="flex items-center gap-2 rounded-xl bg-success/10 p-3 font-medium text-success">
          <Truck className="size-4" /> You&apos;ve unlocked free standard shipping
        </p>
      )}
      <Row label="Subtotal" value={formatCents(totals.subtotal)} />
      {totals.discount > 0 && <Row label={`Discount (${totals.coupon})`} value={`−${formatCents(totals.discount)}`} className="text-success" />}
      <Row label="Shipping" value={totals.shipping === 0 ? "Free" : formatCents(totals.shipping)} />
      {children}
      <Separator />
      <Row label="Total" value={formatCents(totals.total)} className="text-lg font-semibold" />
      <p className="text-right text-xs text-muted-foreground">Includes {formatCents(totals.gst)} GST</p>
    </div>
  );
}

function Row({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={cn("flex justify-between gap-4", className)}>
      <span className={className ? undefined : "text-muted-foreground"}>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
