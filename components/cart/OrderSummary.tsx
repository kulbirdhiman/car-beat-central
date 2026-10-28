import type { ReactNode } from "react";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCents } from "@/lib/data";
import { type Totals } from "@/lib/pricing";
import { cn } from "@/lib/utils";

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

  return (
    <div className={cn("space-y-3 text-sm transition-opacity", stale && "opacity-60")}>
      <Row label="Subtotal" value={formatCents(totals.subtotal)} />
      {totals.discount > 0 && <Row label={`Discount (${totals.coupon})`} value={`−${formatCents(totals.discount)}`} className="text-success" />}
      <Row label="Shipping" value={totals.shipping === 0 ? "Free" : formatCents(totals.shipping)} />
      {children}
      <Separator />
      <Row label="Total" value={formatCents(totals.total)} className="font-display text-xl font-bold" />
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
