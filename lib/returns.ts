/**
 * Cancellations, returns and refunds, shared by the store and the admin panel.
 *
 * A customer cancels an unpaid order straight away. For a paid order they send a request: a cancellation before it ships,
 * or a return of some items within RETURN_WINDOW_DAYS of shipping. An admin approves or rejects it; approving a
 * cancellation refunds the order in full, and an approved return is refunded once the items come back.
 * Admins can also refund any paid order directly. Refunds are only recorded here (amount, reason, restock)
 * and change the order's status; the admin pays the money back themselves in PayPal, Afterpay or by bank transfer.
 */

export type ReturnKind = "cancel" | "return";

export const RETURN_REASONS = {
  changed_mind: "Changed my mind",
  doesnt_fit: "Doesn't fit my vehicle",
  faulty: "Faulty or not working",
  damaged: "Arrived damaged",
  wrong_item: "Wrong item sent",
  other: "Something else",
} as const;

export type ReturnReason = keyof typeof RETURN_REASONS;

/** "requested" and "approved" are open: the customer is waiting on us, or we're waiting on the parcel. */
export type ReturnStatus = "requested" | "approved" | "rejected" | "refunded";

export const RETURN_STATUS_LABEL: Record<ReturnStatus, string> = {
  requested: "Requested",
  approved: "Approved",
  rejected: "Declined",
  refunded: "Refunded",
};

export const RETURN_KIND_LABEL: Record<ReturnKind, string> = { cancel: "Cancellation", return: "Return" };

/** Days after an order ships (or is picked up) that the customer can start a return. Matches the returns policy. */
export const RETURN_WINDOW_DAYS = 30;

export type ReturnItem = { productId: string; name: string; qty: number };

export type ReturnRequest = {
  id: string;
  createdAt: string;
  kind: ReturnKind;
  status: ReturnStatus;
  reason: ReturnReason;
  /** What the customer wrote. */
  details: string;
  /** The items being returned; every item for a cancellation. */
  items: ReturnItem[];
  /** Our reply to the customer: return instructions, or why it was declined. Empty for none. */
  response: string;
  resolvedAt?: string;
};

/** Always "manual" now; "paypal" and "afterpay" are kept for the column type in case refunds are ever sent through them. */
export type RefundMethod = "paypal" | "afterpay" | "manual";

export type Refund = {
  id: string;
  createdAt: string;
  /** Cents. */
  amount: number;
  method: RefundMethod;
  reason: string;
  /** Items put back into stock with this refund. */
  restocked: { productId: string; qty: number }[];
  /** The return request this refund settled, if any. */
  returnId?: string;
};

export const isOpenReturn = (r: Pick<ReturnRequest, "status">) => r.status === "requested" || r.status === "approved";

/** The last day a shipped order can be returned, or null if it hasn't shipped. */
export function returnDeadline(shippedAt: string | null | undefined) {
  if (!shippedAt) return null;
  return new Date(new Date(shippedAt).getTime() + RETURN_WINDOW_DAYS * 24 * 60 * 60 * 1000);
}

/** How many of each product can still be returned: what was ordered, less what's in returns that weren't declined. */
export function returnableQty(items: { productId: string; qty: number }[], returns: Pick<ReturnRequest, "status" | "items">[]) {
  const left = new Map<string, number>();
  for (const i of items) left.set(i.productId, (left.get(i.productId) ?? 0) + i.qty);
  for (const r of returns) {
    if (r.status === "rejected") continue;
    for (const i of r.items) left.set(i.productId, (left.get(i.productId) ?? 0) - i.qty);
  }
  return left;
}

/**
 * A suggested refund for returned items: their price, less the same share of the order's discount, in cents.
 * Shipping isn't included; an admin can add it (e.g. for a faulty item) when they refund.
 */
export function suggestedRefund(order: { subtotal: number; discount: number; items: { productId: string; unitPrice: number }[] }, items: { productId: string; qty: number }[]) {
  const gross = items.reduce((n, i) => n + (order.items.find((o) => o.productId === i.productId)?.unitPrice ?? 0) * i.qty, 0);
  if (!order.subtotal) return gross;
  return Math.round(gross - (gross * order.discount) / order.subtotal);
}
