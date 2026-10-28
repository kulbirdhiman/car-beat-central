import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import type { RefundInput } from "../admin/model";
import { isOpenReturn, returnDeadline, returnableQty, type ReturnItem, type ReturnKind, type ReturnReason } from "../returns";
import type { OrderStatus } from "../types";
import { AdminError } from "./admin/validate";
import type { Customer } from "./customer";
import { db, transaction, type Tx } from "./db";
import { getOrder, moveOrderStock, setOrderStatus } from "./orders";
import { orderItems, orderRefunds, orderReturns, orders, products } from "./schema";

/** Cancellations, returns and refunds. See lib/returns.ts for how they fit together. */

/** A problem with a customer's request whose message is safe to show them. */
export class ReturnError extends Error {}

const isMine = (customer: Customer, order: { userId: string | null; email: string }) =>
  order.userId === customer.id || customer.emails.includes(order.email.toLowerCase());

/** The order, if it belongs to this customer. */
export async function getCustomerOrder(customer: Customer, orderId: string) {
  const order = await getOrder(orderId);
  return order && isMine(customer, order) ? order : null;
}

/** Locks the order row for the rest of the transaction, so requests and refunds on it run one at a time. */
async function lockOrder(tx: Tx, orderId: string) {
  const [order] = await tx.select().from(orders).where(eq(orders.id, orderId)).for("update");
  return order ?? null;
}

// Customers ------------------------------------------------------------------------------------

/** A customer cancelling their own unpaid order. Nothing to refund, so it's immediate and puts the stock back. */
export async function cancelUnpaidOrder(customer: Customer, orderId: string) {
  const order = await getCustomerOrder(customer, orderId);
  if (!order) throw new ReturnError("We couldn't find that order in your account.");
  if (order.status !== "pending_payment") throw new ReturnError("This order is already paid, so it needs a cancellation request instead.");
  try {
    await setOrderStatus(order.id, "cancelled", undefined, ["pending_payment"]);
  } catch (error) {
    // Paid in another tab a moment ago.
    if (error instanceof AdminError) throw new ReturnError("This order was just paid. Refresh the page to request a cancellation instead.");
    throw error;
  }
}

export type ReturnRequestInput = { kind: ReturnKind; reason: ReturnReason; details: string; items: { productId: string; qty: number }[] };

/**
 * A customer asking to cancel a paid order that hasn't shipped (every item), or to return items from a shipped one within
 * the return window. One open request per order at a time. Returns the new request's id.
 */
export async function requestReturn(customer: Customer, orderId: string, input: ReturnRequestInput) {
  return transaction(async (tx) => {
    const order = await lockOrder(tx, orderId);
    if (!order || !isMine(customer, order)) throw new ReturnError("We couldn't find that order in your account.");
    const [items, existing] = await Promise.all([
      tx.select({ productId: orderItems.productId, name: orderItems.name, qty: orderItems.qty }).from(orderItems).where(eq(orderItems.orderId, orderId)),
      tx.select({ status: orderReturns.status, items: orderReturns.items }).from(orderReturns).where(eq(orderReturns.orderId, orderId)),
    ]);
    if (existing.some(isOpenReturn)) throw new ReturnError("You already have a request open for this order. We'll be in touch about it soon.");

    const left = returnableQty(items, existing);
    const nameOf = (productId: string) => items.find((i) => i.productId === productId)?.name ?? "Item";
    let chosen: ReturnItem[];
    if (input.kind === "cancel") {
      if (!["processing", "paid", "confirmed", "preparing"].includes(order.status)) throw new ReturnError(order.status === "fulfilled" || order.status === "completed" ? "This order has already shipped. You can return it once it arrives." : "This order can't be cancelled.");
      chosen = [...left].filter(([, qty]) => qty > 0).map(([productId, qty]) => ({ productId, name: nameOf(productId), qty }));
    } else {
      if (order.status !== "fulfilled" && order.status !== "completed") throw new ReturnError("Returns open once your order has shipped.");
      const deadline = returnDeadline(order.shippedAt);
      if (deadline && deadline.getTime() < Date.now()) throw new ReturnError("The return window for this order has closed. For faulty items, contact us about a warranty claim.");
      chosen = input.items.filter((i) => i.qty > 0).map((i) => ({ productId: i.productId, name: nameOf(i.productId), qty: i.qty }));
      if (chosen.length === 0) throw new ReturnError("Choose at least one item to return.");
      const tooMany = chosen.find((i) => i.qty > (left.get(i.productId) ?? 0));
      if (tooMany) throw new ReturnError(`You can return at most ${Math.max(0, left.get(tooMany.productId) ?? 0)} of ${tooMany.name}.`);
    }
    if (chosen.length === 0) throw new ReturnError("Everything on this order has already been returned.");

    const id = randomUUID();
    await tx.insert(orderReturns).values({ id, orderId, kind: input.kind, status: "requested", reason: input.reason, details: input.details, items: chosen });
    return id;
  });
}

// Admin ----------------------------------------------------------------------------------------

/**
 * An admin answering a request. Approving a cancellation refunds the order in full, cancels it and restocks it.
 * Approving a return tells the customer to send it back (`response` carries the instructions); it's refunded once it arrives.
 * Declining needs a reason for the customer. Returns the order id.
 */
export async function respondToReturn(returnId: string, action: "approve" | "reject", response: string) {
  const [request] = await db.select().from(orderReturns).where(eq(orderReturns.id, returnId)).limit(1);
  if (!request) throw new AdminError("Request not found.", 404);
  if (!isOpenReturn(request)) throw new AdminError("This request has already been dealt with.");

  if (action === "approve" && request.kind === "cancel") {
    const order = await getOrder(request.orderId);
    if (!order) throw new AdminError("Order not found.", 404);
    await refundOrder(request.orderId, {
      amount: order.total - order.refundedTotal,
      reason: "Order cancelled at the customer's request",
      restock: [],
      returnId,
      cancel: true,
      response,
    });
    return request.orderId;
  }

  if (action === "reject" && !response) throw new AdminError("Tell the customer why it's declined.");
  if (action === "approve" && request.status === "approved") throw new AdminError("This return is already approved. Refund it once the items arrive.");
  const updated = await db
    .update(orderReturns)
    .set({ status: action === "approve" ? "approved" : "rejected", response: response || null, ...(action === "reject" && { resolvedAt: new Date().toISOString() }) })
    // Only if nobody else answered it in the meantime.
    .where(and(eq(orderReturns.id, returnId), eq(orderReturns.status, request.status)))
    .returning({ id: orderReturns.id });
  if (updated.length === 0) throw new AdminError("This request was just updated by someone else. Refresh to see it.", 409);
  return request.orderId;
}

/**
 * Records a refund on a paid order and updates its status. No money moves here: the admin pays the customer back
 * themselves (in PayPal, Afterpay, or by bank transfer). Optionally restocks items and settles a return request.
 * `cancel` also cancels the order (restocking everything); otherwise an order refunded in full becomes "refunded".
 * The order row is locked, so two admins can't record more than the order total between them.
 */
export async function refundOrder(orderId: string, input: RefundInput & { cancel?: boolean; response?: string }) {
  await transaction(async (tx) => {
    const order = await lockOrder(tx, orderId);
    if (!order) throw new AdminError("Order not found.", 404);
    const paid = !!order.paidAt || ["processing", "paid", "confirmed", "preparing", "fulfilled", "completed"].includes(order.status);
    if (!paid) throw new AdminError("This order hasn't been paid, so there's nothing to refund. Cancel it instead.");
    const remaining = order.total - order.refundedTotal;
    if (remaining <= 0) throw new AdminError("This order has already been refunded in full.");
    if (input.amount < 1 || input.amount > remaining) throw new AdminError(`The refund must be between $0.01 and ${(remaining / 100).toFixed(2)}, what's left of the order.`);
    if (input.cancel && !["processing", "paid", "confirmed", "preparing"].includes(order.status)) throw new AdminError("Only paid orders that haven't shipped can be cancelled this way.");

    if (input.returnId) {
      const [request] = await tx.select({ orderId: orderReturns.orderId, status: orderReturns.status }).from(orderReturns).where(eq(orderReturns.id, input.returnId));
      if (!request || request.orderId !== orderId) throw new AdminError("That request isn't on this order.");
      if (!isOpenReturn(request)) throw new AdminError("That request has already been dealt with.");
    }

    const restock = await checkRestock(tx, order.id, order.status, input.restock);

    await tx
      .insert(orderRefunds)
      .values({ id: randomUUID(), orderId, amount: input.amount, method: "manual", reason: input.reason, restocked: restock, returnId: input.returnId ?? null });
    for (const r of restock) {
      await tx
        .update(products)
        .set({ stock: sql`${products.stock} + ${r.qty}` })
        .where(eq(products.id, r.productId));
    }
    const full = input.amount === remaining;
    let status: OrderStatus = order.status;
    if (input.cancel) {
      status = "cancelled";
      // After the refund row is in, so moveOrderStock skips anything it restocked.
      if (order.status !== "cancelled") await moveOrderStock(tx, order.id, 1);
    } else if (full && order.status !== "cancelled") {
      status = "refunded";
    }
    await tx
      .update(orders)
      .set({ refundedTotal: order.refundedTotal + input.amount, status })
      .where(eq(orders.id, order.id));
    if (input.returnId) {
      await tx
        .update(orderReturns)
        .set({ status: "refunded", resolvedAt: new Date().toISOString(), ...(input.response && { response: input.response }) })
        .where(eq(orderReturns.id, input.returnId));
    }
  });
}

/** Checks the items to restock against what was ordered and what earlier refunds already restocked. */
async function checkRestock(tx: Tx, orderId: string, status: OrderStatus, restock: RefundInput["restock"]) {
  const wanted = restock.filter((r) => r.qty > 0);
  if (wanted.length === 0) return [];
  // A cancelled order's stock went back when it was cancelled.
  if (status === "cancelled") throw new AdminError("This order is cancelled, so its items are already back in stock.");
  const [items, earlier] = await Promise.all([
    tx.select({ productId: orderItems.productId, name: orderItems.name, qty: orderItems.qty }).from(orderItems).where(eq(orderItems.orderId, orderId)),
    tx.select({ restocked: orderRefunds.restocked }).from(orderRefunds).where(eq(orderRefunds.orderId, orderId)),
  ]);
  const merged = new Map<string, number>();
  for (const r of wanted) merged.set(r.productId, (merged.get(r.productId) ?? 0) + r.qty);
  for (const [productId, qty] of merged) {
    const ordered = items.filter((i) => i.productId === productId).reduce((n, i) => n + i.qty, 0);
    const already = earlier.flatMap((r) => r.restocked).reduce((n, r) => n + (r.productId === productId ? r.qty : 0), 0);
    const name = items.find((i) => i.productId === productId)?.name;
    if (!name) throw new AdminError("A product to restock isn't on this order.");
    if (qty > ordered - already) throw new AdminError(`Only ${ordered - already} of ${name} can still be restocked.`);
  }
  return [...merged].map(([productId, qty]) => ({ productId, qty }));
}
