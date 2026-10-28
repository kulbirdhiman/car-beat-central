"use client";

import { Loader2, PackageX, RotateCcw, XCircle } from "lucide-react";
import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import { toast } from "sonner";
import type { FormState } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatCents } from "@/lib/data";
import { RETURN_KIND_LABEL, RETURN_REASONS, type Refund, type ReturnKind, type ReturnRequest, type ReturnStatus } from "@/lib/returns";
import { cn } from "@/lib/utils";
import { cancelOrderAction, requestReturnAction } from "./actions";

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-AU", { dateStyle: "medium", timeZone: "Australia/Sydney" });

/** What each request status means to the customer. */
const STATUS_TEXT: Record<ReturnStatus, { label: string; tone: string; body: (kind: ReturnKind) => string }> = {
  requested: { label: "Under review", tone: "text-amber-700 dark:text-amber-400", body: () => "We'll reply within one business day." },
  approved: { label: "Approved", tone: "text-sky-700 dark:text-sky-400", body: () => "Send the items back as described below. We'll refund you once they arrive and we've checked them." },
  rejected: { label: "Declined", tone: "text-muted-foreground", body: () => "Questions? Reply to any of our emails." },
  refunded: { label: "Refunded", tone: "text-success", body: (kind) => (kind === "cancel" ? "Your order was cancelled and refunded." : "Your refund is on its way.") },
};


export type HelpProps = {
  orderId: string;
  /** "guest": not signed in; "other": signed in, but it isn't their order. */
  viewer: "owner" | "guest" | "other";
  email: string;
  /** Can cancel straight away (unpaid). */
  canCancel: boolean;
  /** Can ask us to cancel (paid, not shipped). */
  canRequestCancel: boolean;
  /** Items they can still return, when the return window is open. */
  returnable: { productId: string; name: string; max: number }[];
  /** Last day to return, when shipped. */
  returnBy: string | null;
  /** Shipped, and the return window has passed. */
  windowClosed: boolean;
  returns: ReturnRequest[];
  refunds: Refund[];
};

/** Cancel, return and refund options for an order, and how earlier requests went. */
export function OrderHelp(props: HelpProps) {
  const { orderId, viewer, returns, refunds, returnBy } = props;
  const signInHref = `/sign-in?redirect_url=${encodeURIComponent(`/order/${orderId}`)}`;
  const canReturn = props.returnable.length > 0;
  const hasActions = props.canCancel || props.canRequestCancel || canReturn;

  return (
    <Card id="help" className="mt-8 scroll-mt-24">
      <CardHeader>
        <CardTitle className="font-display text-2xl font-bold">Cancellations &amp; returns</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 text-sm">
        {refunds.length > 0 && (
          <ul className="space-y-2 rounded-lg bg-success/10 p-4">
            {refunds.map((r) => (
              <li key={r.id} className="flex flex-wrap justify-between gap-x-4">
                <span>Refunded on {fmtDate(r.createdAt)}</span>
                <span className="font-semibold tabular-nums">{formatCents(r.amount)}</span>
              </li>
            ))}
            <li className="text-xs text-muted-foreground">Refunds usually show in your account within 3–5 business days.</li>
          </ul>
        )}

        {returns.length > 0 && (
          <ul className="space-y-3">
            {returns.toReversed().map((r) => {
              const status = STATUS_TEXT[r.status];
              return (
                <li key={r.id} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="font-medium">{RETURN_KIND_LABEL[r.kind]} request</span>
                    <span className={cn("font-medium", status.tone)}>{status.label}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{fmtDate(r.createdAt)}</span>
                  </div>
                  {r.kind === "return" && (
                    <p className="mt-1 text-muted-foreground">
                      {r.items.map((i) => `${i.qty} × ${i.name}`).join(", ")} · {RETURN_REASONS[r.reason]}
                    </p>
                  )}
                  <p className="mt-2 text-muted-foreground">{status.body(r.kind)}</p>
                  {r.response && (
                    <div className="mt-3 rounded-md border-l-2 border-primary bg-muted p-3">
                      <p className="mb-1 text-xs font-semibold text-foreground">Reply from CarBeat</p>
                      <p className="whitespace-pre-line text-muted-foreground">{r.response}</p>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {viewer === "owner" ? (
          hasActions ? (
            <div className="flex flex-wrap gap-2">
              {props.canCancel && <CancelUnpaidButton orderId={orderId} />}
              {props.canRequestCancel && <RequestDialog orderId={orderId} kind="cancel" items={[]} />}
              {canReturn && <RequestDialog orderId={orderId} kind="return" items={props.returnable} />}
            </div>
          ) : (
            returns.length === 0 &&
            refunds.length === 0 && (
              <p className="text-muted-foreground">
                {props.windowClosed
                  ? "The 30-day return window for this order has closed. If something's faulty, contact us about a warranty claim."
                  : "Nothing to do here. If you need help with this order, reply to any of our emails."}
              </p>
            )
          )
        ) : viewer === "guest" ? (
          <p className="text-muted-foreground">
            Need to cancel or return something?{" "}
            <Link href={signInHref} className="font-medium text-foreground underline underline-offset-4">
              Sign in
            </Link>{" "}
            with {props.email} to start a request.
          </p>
        ) : (
          <p className="text-muted-foreground">This order isn&apos;t linked to your account. Sign in with the email it was placed with to cancel or return it.</p>
        )}

        {viewer === "owner" && canReturn && returnBy && (
          <p className="text-xs text-muted-foreground">You can start a return until {fmtDate(returnBy)}.</p>
        )}
        <p className="text-xs text-muted-foreground">
          See our{" "}
          <Link href="/returns" className="underline underline-offset-4">
            returns &amp; refunds policy
          </Link>{" "}
          for what can be returned.
        </p>
      </CardContent>
    </Card>
  );
}

function CancelUnpaidButton({ orderId }: { orderId: string }) {
  const [pending, start] = useTransition();
  return (
    <Button
      variant="outline"
      disabled={pending}
      onClick={() => {
        if (!confirm("Cancel this order? You haven't been charged, and the items will be released.")) return;
        start(async () => {
          const result = await cancelOrderAction(orderId);
          if (result.ok) toast.success("Order cancelled.");
          else toast.error(result.message ?? "Couldn't cancel the order.");
        });
      }}
    >
      {pending ? <Loader2 className="animate-spin" /> : <XCircle />} Cancel order
    </Button>
  );
}

/** A cancellation request (paid, not shipped) or a return request (shipped). The form lives in the dialog, so it starts fresh each time. */
function RequestDialog({ orderId, kind, items }: { orderId: string; kind: ReturnKind; items: HelpProps["returnable"] }) {
  const [open, setOpen] = useState(false);
  const cancel = kind === "cancel";
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={cancel ? "outline" : "default"}>{cancel ? <PackageX /> : <RotateCcw />} {cancel ? "Request cancellation" : "Return items"}</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{cancel ? "Cancel this order" : "Start a return"}</DialogTitle>
          <DialogDescription>
            {cancel
              ? "If we haven't packed it yet, we'll cancel it and refund you in full to your original payment method."
              : "Tell us what you're sending back. Please don't post anything until we've replied with return instructions."}
          </DialogDescription>
        </DialogHeader>
        <RequestForm
          orderId={orderId}
          kind={kind}
          items={items}
          onSent={() => {
            setOpen(false);
            toast.success(cancel ? "Cancellation requested. We'll be in touch shortly." : "Return requested. We'll reply within one business day.");
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

function RequestForm({ orderId, kind, items, onSent }: { orderId: string; kind: ReturnKind; items: HelpProps["returnable"]; onSent: () => void }) {
  const [state, action, pending] = useActionState<FormState, FormData>(async (prev, form) => {
    const result = await requestReturnAction(prev, form);
    if (result.ok) onSent();
    return result;
  }, {});
  const errors = state.errors ?? {};
  const [reason, setReason] = useState(state.values?.reason ?? "");

  return (
    <form action={action} noValidate className="grid gap-4">
      <input type="hidden" name="orderId" value={orderId} />
      <input type="hidden" name="kind" value={kind} />
      {state.message && !state.ok && (
        <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm font-medium text-destructive">
          {state.message}
        </p>
      )}

      {kind === "return" && (
        <fieldset className="grid gap-2">
          <legend className="mb-1 text-sm font-medium">Items to return</legend>
          {items.map((i) => (
            <div key={i.productId} className="flex items-center justify-between gap-3 text-sm">
              <Label htmlFor={`qty-${i.productId}`} className="min-w-0 font-normal">
                {i.name}
              </Label>
              <Input
                id={`qty-${i.productId}`}
                name={`qty-${i.productId}`}
                type="number"
                min={0}
                max={i.max}
                defaultValue={items.length === 1 ? i.max : 0}
                className="w-20 shrink-0 tabular-nums"
                aria-label={`How many ${i.name} to return (up to ${i.max})`}
              />
            </div>
          ))}
        </fieldset>
      )}

      <div className="grid gap-1.5">
        <Label htmlFor="reason">Reason</Label>
        <Select name="reason" value={reason} onValueChange={setReason}>
          <SelectTrigger id="reason" className="w-full" aria-invalid={!!errors.reason}>
            <SelectValue placeholder="Choose a reason" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(RETURN_REASONS)
              // Can't arrive damaged or wrong if it hasn't shipped.
              .filter(([key]) => kind === "return" || key === "changed_mind" || key === "other")
              .map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        {errors.reason && <p className="text-xs text-destructive">{errors.reason}</p>}
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="details">
          Details{reason === "changed_mind" && <span className="font-normal text-muted-foreground"> (optional)</span>}
        </Label>
        <Textarea
          id="details"
          name="details"
          defaultValue={state.values?.details}
          maxLength={1000}
          rows={3}
          aria-invalid={!!errors.details}
          placeholder={kind === "return" ? "e.g. which vehicle you selected, or what's wrong with it" : "Anything we should know"}
        />
        {errors.details && <p className="text-xs text-destructive">{errors.details}</p>}
      </div>

      <Button type="submit" size="lg" disabled={pending}>
        {pending && <Loader2 className="animate-spin" />}
        {kind === "cancel" ? "Request cancellation" : "Request return"}
      </Button>
    </form>
  );
}
