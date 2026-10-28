"use client";

import { Check, Loader2, RotateCcw, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAdminStore } from "@/components/admin/AdminStore";
import { fmtDateTime } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { orderSubtotal, orderTotal, orderWasPaid, type AdminOrder } from "@/lib/admin/model";
import { formatCents } from "@/lib/data";
import {
  RETURN_KIND_LABEL,
  RETURN_REASONS,
  RETURN_STATUS_LABEL,
  isOpenReturn,
  suggestedRefund,
  type ReturnRequest,
  type ReturnStatus,
} from "@/lib/returns";
import { cn } from "@/lib/utils";

const toCents = (dollars: string) => (/^\d+(\.\d{1,2})?$/.test(dollars.trim()) ? Math.round(Number(dollars) * 100) : NaN);
const toDollars = (cents: number) => (cents / 100).toFixed(2);

const RETURN_STATUS_STYLE: Record<ReturnStatus, string> = {
  requested: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  approved: "bg-sky-500/15 text-sky-700 dark:text-sky-400",
  rejected: "bg-muted text-muted-foreground",
  refunded: "bg-violet-500/15 text-violet-700 dark:text-violet-400",
};

export function ReturnStatusBadge({ status }: { status: ReturnStatus }) {
  return <Badge className={cn("border-transparent", RETURN_STATUS_STYLE[status])}>{RETURN_STATUS_LABEL[status]}</Badge>;
}

/** What's left to refund on an order, in cents. */
export const refundable = (order: AdminOrder) => (orderWasPaid(order) ? Math.max(0, orderTotal(order) - order.refunded) : 0);

/** Preset for the refund dialog when it settles a return request. */
export type ReturnRefundPreset = { returnId: string; amount: number; reason: string; restock: Record<string, number> };

/** The customer's cancellation and return requests, with approve / decline / refund actions on the open ones. */
export function ReturnRequests({ order, onRefund }: { order: AdminOrder; onRefund: (preset: ReturnRefundPreset) => void }) {
  if (order.returns.length === 0) return null;
  return (
    <section className="rounded-lg border p-4">
      <h3 className="mb-3 text-sm font-semibold">Cancellation &amp; return requests</h3>
      <ul className="space-y-4">
        {order.returns
          .toReversed()
          .map((r) => (
            <ReturnRow key={r.id} order={order} request={r} onRefund={onRefund} />
          ))}
      </ul>
    </section>
  );
}

function ReturnRow({ order, request, onRefund }: { order: AdminOrder; request: ReturnRequest; onRefund: (preset: ReturnRefundPreset) => void }) {
  const { respondToReturn } = useAdminStore();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState<"approve" | "reject" | null>(null);
  const open = isOpenReturn(request);
  const cancel = request.kind === "cancel";
  const left = refundable(order);

  async function respond(action: "approve" | "reject") {
    if (!message.trim()) return toast.error("Write a message for the customer before responding.");
    if (action === "approve" && cancel && !confirm(`Cancel this order and record a ${formatCents(left)} refund? Pay the customer back yourself.`)) return;
    setBusy(action);
    try {
      await respondToReturn(request.id, action, message.trim());
      toast.success(action === "reject" ? "Request declined." : cancel ? "Order cancelled and refund recorded." : "Return approved. Refund it once the items arrive.");
      setMessage("");
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <li className="space-y-2 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">{RETURN_KIND_LABEL[request.kind]}</span>
        <ReturnStatusBadge status={request.status} />
        <span className="ml-auto text-xs text-muted-foreground">{fmtDateTime(request.createdAt)}</span>
      </div>
      <p>
        <span className="text-muted-foreground">Reason:</span> {RETURN_REASONS[request.reason]}
      </p>
      {request.details && <p className="whitespace-pre-line rounded-md bg-muted p-2.5">{request.details}</p>}
      {!cancel && (
        <ul className="text-muted-foreground">
          {request.items.map((i) => (
            <li key={i.productId}>
              {i.qty} × {i.name}
            </li>
          ))}
        </ul>
      )}
      {request.response && (
        <p className="text-muted-foreground">
          <span className="font-medium text-foreground">Our reply:</span> {request.response}
        </p>
      )}

      {open && (
        <div className="space-y-2 rounded-md border border-dashed p-3">
          <Label htmlFor={`reply-${request.id}`} className="text-xs text-muted-foreground">
            Message to the customer (required for approval or decline)
          </Label>
          <Textarea id={`reply-${request.id}`} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={1000} rows={2} />
          <div className="flex flex-wrap gap-2">
            {request.status === "requested" && (
              <Button size="sm" disabled={!!busy} onClick={() => respond("approve")}>
                {busy === "approve" ? <Loader2 className="animate-spin" /> : <Check />}
                {cancel ? `Approve & refund ${formatCents(left)}` : "Approve return"}
              </Button>
            )}
            {!cancel && left > 0 && (
              <Button
                size="sm"
                variant={request.status === "approved" ? "default" : "outline"}
                disabled={!!busy}
                onClick={() =>
                  onRefund({
                    returnId: request.id,
                    amount: Math.min(left, suggestedRefund({ subtotal: orderSubtotal(order), discount: order.discount, items: order.items }, request.items)),
                    reason: `Return: ${RETURN_REASONS[request.reason].toLowerCase()}`,
                    restock: Object.fromEntries(request.items.map((i) => [i.productId, i.qty])),
                  })
                }
              >
                <RotateCcw /> Refund return
              </Button>
            )}
            <Button size="sm" variant="outline" disabled={!!busy} onClick={() => respond("reject")}>
              {busy === "reject" ? <Loader2 className="animate-spin" /> : <X />} Decline
            </Button>
          </div>
        </div>
      )}
    </li>
  );
}

/** Refunds made so far, and the button to make one. */
export function Refunds({ order, onRefund }: { order: AdminOrder; onRefund: () => void }) {
  const left = refundable(order);
  if (!orderWasPaid(order) && order.refunds.length === 0) return null;
  const restockedName = (productId: string) => order.items.find((i) => i.productId === productId)?.name ?? productId;

  return (
    <section className="rounded-lg border p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">Refunds</h3>
        {left > 0 && (
          <Button size="sm" variant="outline" onClick={onRefund}>
            <RotateCcw /> Refund
          </Button>
        )}
      </div>
      {order.refunds.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing refunded yet.</p>
      ) : (
        <ul className="space-y-3 text-sm">
          {order.refunds.map((r) => (
            <li key={r.id} className="space-y-0.5">
              <div className="flex justify-between gap-3">
                <span className="font-medium">Refund</span>
                <span className="tabular-nums font-medium">−{formatCents(r.amount)}</span>
              </div>
              <p className="text-muted-foreground">{r.reason}</p>
              {r.restocked.length > 0 && (
                <p className="text-xs text-muted-foreground">Restocked {r.restocked.map((x) => `${x.qty} × ${restockedName(x.productId)}`).join(", ")}</p>
              )}
              <p className="text-xs text-muted-foreground">{fmtDateTime(r.createdAt)}</p>
            </li>
          ))}
          <li className="flex justify-between border-t pt-2 text-muted-foreground">
            <span>Refunded of {formatCents(orderTotal(order))}</span>
            <span className="tabular-nums">{formatCents(order.refunded)}</span>
          </li>
        </ul>
      )}
    </section>
  );
}

/**
 * Records a refund: the amount (any part of what's left), a reason, and which items go back into stock.
 * No money moves: the admin pays the customer back themselves. Refunding in full sets the order to "Refunded".
 */
export function RefundDialog({ order, preset, open, onOpenChange }: { order: AdminOrder; preset: ReturnRefundPreset | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {/* Keyed so it starts fresh for each preset. */}
        {open && <RefundForm key={preset?.returnId ?? "new"} order={order} preset={preset} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function RefundForm({ order, preset, onDone }: { order: AdminOrder; preset: ReturnRefundPreset | null; onDone: () => void }) {
  const { refundOrder } = useAdminStore();
  const left = refundable(order);
  const paidWith = order.payment?.provider;
  const [amount, setAmount] = useState(toDollars(preset?.amount ?? left));
  const [reason, setReason] = useState(preset?.reason ?? "");
  const [restock, setRestock] = useState<Record<string, string>>(
    Object.fromEntries(order.items.map((i) => [i.productId, String(preset?.restock[i.productId] ?? 0)])),
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const cancelled = order.status === "cancelled";

  // What earlier refunds already restocked, per product.
  const restocked = new Map<string, number>();
  for (const r of order.refunds) for (const x of r.restocked) restocked.set(x.productId, (restocked.get(x.productId) ?? 0) + x.qty);

  const cents = toCents(amount);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (Number.isNaN(cents) || cents < 1) return setError("Enter an amount like 49.95.");
    if (cents > left) return setError(`You can refund at most ${formatCents(left)}.`);
    if (!reason.trim()) return setError("Add a reason, e.g. \"Returned unused\".");
    const lines = order.items.map((i) => ({ productId: i.productId, qty: Number(restock[i.productId]) || 0 }));
    const over = lines.find((l, n) => l.qty < 0 || l.qty > order.items[n].qty - (restocked.get(l.productId) ?? 0));
    if (over) return setError(`Check the restock quantity for ${order.items.find((i) => i.productId === over.productId)?.name}.`);
    if (!confirm(`Record a refund of ${formatCents(cents)}?${cents === left ? " The order will be marked Refunded." : ""}`)) return;

    setError(null);
    setBusy(true);
    try {
      await refundOrder(order.id, { amount: cents, reason: reason.trim(), restock: lines.filter((l) => l.qty > 0), returnId: preset?.returnId });
      toast.success(`Refunded ${formatCents(cents)}.`);
      onDone();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <DialogHeader>
        <DialogTitle>Refund {order.number}</DialogTitle>
        <DialogDescription>
          {formatCents(left)} of {formatCents(orderTotal(order))} can still be refunded.
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-1.5">
        <Label htmlFor="refund-amount">Amount (AUD)</Label>
        <div className="flex gap-2">
          <Input id="refund-amount" value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" className="tabular-nums" aria-invalid={!!error && Number.isNaN(cents)} />
          <Button type="button" variant="outline" onClick={() => setAmount(toDollars(left))}>
            Full
          </Button>
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="refund-reason">Reason</Label>
        <Input id="refund-reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} placeholder="e.g. Returned unused, shipping refunded" />
      </div>

      {!cancelled && (
        <fieldset className="grid gap-2">
          <legend className="mb-1 text-sm font-medium">Put back into stock</legend>
          {order.items.map((i) => {
            const max = i.qty - (restocked.get(i.productId) ?? 0);
            return (
              <div key={i.productId} className="flex items-center justify-between gap-3 text-sm">
                <Label htmlFor={`restock-${i.productId}`} className="min-w-0 font-normal">
                  <span className="truncate">{i.name}</span>
                  <span className="shrink-0 text-muted-foreground">(up to {max})</span>
                </Label>
                <Input
                  id={`restock-${i.productId}`}
                  type="number"
                  min={0}
                  max={max}
                  disabled={max <= 0}
                  value={restock[i.productId]}
                  onChange={(e) => setRestock((r) => ({ ...r, [i.productId]: e.target.value }))}
                  className="w-20 tabular-nums"
                />
              </div>
            );
          })}
          <p className="text-xs text-muted-foreground">Only restock items that came back in resellable condition.</p>
        </fieldset>
      )}

      <p className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
        This only records the refund and updates the order. Pay the customer back yourself{paidWith ? ` in ${paidWith}` : ", e.g. by bank transfer"}.
      </p>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <DialogFooter>
        <Button type="submit" disabled={busy}>
          {busy ? <Loader2 className="animate-spin" /> : <RotateCcw />}
          Record refund {Number.isNaN(cents) ? "" : formatCents(cents)}
        </Button>
      </DialogFooter>
    </form>
  );
}
