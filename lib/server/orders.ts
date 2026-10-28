import "server-only";
import { and, count, desc, eq, gte, inArray, isNull, lt, ne, notInArray, or, sql, sum } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import type { AdminOrder, InvoiceInput } from "../admin/model";
import { DEFAULT_PAYMENT_METHODS } from "../payment";
import { priceCart, unitPriceCents, type Delivery, type Totals } from "../pricing";
import type { Shipment } from "../shipping";
import type { Refund, ReturnRequest } from "../returns";
import type { CartLine, OrderStatus } from "../types";
import { selectedOptionSummary, selectedProductPrice } from "../product-options";
import { getCouponByCode } from "./admin/promos";
import { AdminError } from "./admin/validate";
import { db, transaction, type Tx } from "./db";
import { listProducts } from "./queries";
import { bookings, coupons, orderItems, orderRefunds, orderReturns, orders, products, subscribers } from "./schema";
import type { BookingInput, CheckoutInput } from "./validate";

// Cancelled orders don't count, so a shopper whose first order fell through keeps first-order codes.
async function isFirstOrder(email: string | undefined) {
  if (!email) return true;
  const [prior] = await db
    .select({ id: orders.id })
    .from(orders)
    .where(and(eq(orders.email, email.toLowerCase()), ne(orders.status, "cancelled")))
    .limit(1);
  return !prior;
}

/** Prices a cart from database prices. Unknown product ids are dropped. */
export async function quoteCart(lines: CartLine[], opts: { coupon?: string; delivery: Delivery; email?: string }) {
  const found = await listProducts({ ids: lines.map((l) => l.productId) });
  let invalidSelection = false;
  const priced = lines.flatMap((l) => {
    const product = found.find((p) => p.id === l.productId);
    if (!product) {
      invalidSelection = true;
      return [];
    }
    const selectedPrice = selectedProductPrice(product, l.variantValues);
    if (selectedPrice === null) {
      invalidSelection = true;
      return [];
    }
    return [{ product, qty: l.qty, selectedPrice, variantValues: l.variantValues }];
  });
  if (invalidSelection || priced.length !== lines.length) return { lines: [], totals: priceCart([], { delivery: opts.delivery }), error: "Some product options have changed. Please review your cart and choose again." };
  const coupon = opts.coupon?.trim() ? await getCouponByCode(opts.coupon) : null;
  const totals = priceCart(priced, { couponCode: opts.coupon, coupon, delivery: opts.delivery, isFirstOrder: await isFirstOrder(opts.email) });
  return { lines: priced, totals };
}

/** `userId`: the signed-in customer placing it, if any, so it shows in their account. */
export async function createOrder(
  input: CheckoutInput,
  cart: CartLine[],
  userId: string | null = null,
): Promise<{ id: string; totals: Totals } | { error: string; field?: "coupon" }> {
  const quote = await quoteCart(cart, { coupon: input.coupon, delivery: input.delivery, email: input.email });
  if ("error" in quote && quote.error) return { error: quote.error };
  const { lines, totals } = quote;
  if (lines.length === 0) return { error: "Your cart is empty." };
  if (lines.length !== cart.length) return { error: "Some items in your cart are no longer available. Please review your cart." };
  if (input.coupon && totals.couponError) return { error: totals.couponError, field: "coupon" };

  const soldOut = lines.find((l) => l.product.stock < l.qty);
  if (soldOut) return { error: stockMessage(soldOut.product.name, soldOut.product.stock) };

  const id = randomUUID();
  try {
    await transaction(async (tx) => {
      // Stock and coupon usage are re-checked by conditional updates (which lock the rows), so two shoppers can't buy the last unit.
      for (const l of lines) {
        const taken = await tx
          .update(products)
          .set({ stock: sql`${products.stock} - ${l.qty}` })
          .where(and(eq(products.id, l.product.id), gte(products.stock, l.qty)))
          .returning({ id: products.id });
        if (taken.length === 0) throw new AdminError(stockMessage(l.product.name, 0));
      }
      if (totals.coupon) {
        const counted = await tx
          .update(coupons)
          .set({ used: sql`${coupons.used} + 1` })
          .where(and(eq(coupons.code, totals.coupon), or(isNull(coupons.usageLimit), lt(coupons.used, coupons.usageLimit))))
          .returning({ id: coupons.id });
        if (counted.length === 0) throw new AdminError("That code has just reached its usage limit.");
      }
      await tx.insert(orders)
        .values({
          id,
          status: "pending_payment",
          email: input.email,
          userId,
          name: input.name,
          phone: input.phone,
          address: input.address,
          suburb: input.suburb,
          state: input.state,
          postcode: input.postcode,
          delivery: input.delivery,
          coupon: totals.coupon,
          subtotal: totals.subtotal,
          discount: totals.discount,
          shipping: totals.shipping,
          total: totals.total,
          paymentMethods: [input.payment],
        });
      await tx
        .insert(orderItems)
        .values(lines.map((l) => {
          const options = selectedOptionSummary(l.product, l.variantValues);
          return { orderId: id, productId: l.product.id, name: options ? `${l.product.name} (${options})` : l.product.name, unitPrice: unitPriceCents(l.product, l.selectedPrice), qty: l.qty };
        }));
    });
  } catch (error) {
    if (error instanceof AdminError) return { error: error.message };
    throw error;
  }
  return { id, totals };
}

/** Permanently removes pending orders only; cancelled orders may have offline payment history. */
export async function deleteUnpaidOrder(orderId: string) {
  await transaction(async (tx) => {
    const [order] = await tx.select({ status: orders.status, paidAt: orders.paidAt, refundedTotal: orders.refundedTotal }).from(orders).where(eq(orders.id, orderId)).for("update");
    if (!order) throw new AdminError("Order not found.", 404);
    if (order.paidAt || order.refundedTotal > 0 || order.status !== "pending_payment") {
      throw new AdminError("Only unpaid pending orders can be deleted.");
    }
    await moveOrderStock(tx, orderId, 1);
    const returns = await tx.select({ id: orderReturns.id }).from(orderReturns).where(eq(orderReturns.orderId, orderId));
    if (returns.length) await tx.delete(orderRefunds).where(inArray(orderRefunds.returnId, returns.map((r) => r.id)));
    await tx.delete(orderRefunds).where(eq(orderRefunds.orderId, orderId));
    await tx.delete(orderReturns).where(eq(orderReturns.orderId, orderId));
    await tx.delete(orderItems).where(eq(orderItems.orderId, orderId));
    await tx.delete(orders).where(eq(orders.id, orderId));
  });
}

/** A manual invoice raised by an admin: an order at the prices they set, paid through the customer's order page. Takes stock like a checkout order. */
export async function createInvoice(input: InvoiceInput): Promise<AdminOrder> {
  const found = await db
    .select({ id: products.id, name: products.name })
    .from(products)
    .where(inArray(products.id, input.items.map((i) => i.productId)));
  const lines = input.items.map((i) => {
    const product = found.find((p) => p.id === i.productId);
    if (!product) throw new AdminError("A product on this invoice no longer exists.");
    return { ...i, name: product.name };
  });
  const subtotal = lines.reduce((n, l) => n + l.unitPrice * l.qty, 0);
  if (input.discount > subtotal) throw new AdminError("The discount can't be more than the subtotal.");

  const id = randomUUID();
  await transaction(async (tx) => {
    for (const l of lines) {
      const taken = await tx
        .update(products)
        .set({ stock: sql`${products.stock} - ${l.qty}` })
        .where(and(eq(products.id, l.productId), gte(products.stock, l.qty)))
        .returning({ id: products.id });
      if (taken.length === 0) throw new AdminError(`Not enough stock of ${l.name}. Update its stock first.`);
    }
    await tx.insert(orders).values({
      id,
      source: "invoice",
      status: input.paid ? "paid" : "pending_payment",
      paidAt: input.paid ? new Date().toISOString() : null,
      email: input.customer.email,
      name: input.customer.name,
      phone: input.customer.phone,
      ...input.shipTo,
      delivery: input.delivery,
      subtotal,
      discount: input.discount,
      shipping: input.shipping,
      total: subtotal - input.discount + input.shipping,
      paymentMethods: input.paymentMethods,
      note: input.note || null,
    });
    await tx.insert(orderItems).values(lines.map((l) => ({ orderId: id, productId: l.productId, name: l.name, unitPrice: l.unitPrice, qty: l.qty })));
  });
  const [order] = await listAdminOrders({ id });
  return order;
}

function stockMessage(name: string, stock: number) {
  return stock === 0 ? `Sorry, ${name} has just sold out. Please remove it from your cart.` : `Only ${stock} of ${name} left. Please lower the quantity.`;
}

const itemColumns = { productId: orderItems.productId, name: orderItems.name, unitPrice: orderItems.unitPrice, qty: orderItems.qty };

export type OrderRecord = typeof orders.$inferSelect & { items: { productId: string; name: string; unitPrice: number; qty: number }[] };

export async function getOrder(id: string): Promise<OrderRecord | null> {
  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!order) return null;
  const items = await db.select(itemColumns).from(orderItems).where(eq(orderItems.orderId, id)).orderBy(orderItems.id);
  return { ...order, items };
}

type ReturnRow = typeof orderReturns.$inferSelect;
type RefundRow = typeof orderRefunds.$inferSelect;

const toReturn = (r: ReturnRow): ReturnRequest => ({
  id: r.id,
  createdAt: r.createdAt,
  kind: r.kind,
  status: r.status,
  reason: r.reason,
  details: r.details,
  items: r.items,
  response: r.response ?? "",
  resolvedAt: r.resolvedAt ?? undefined,
});

const toRefund = (r: RefundRow): Refund => ({
  id: r.id,
  createdAt: r.createdAt,
  amount: r.amount,
  method: r.method,
  reason: r.reason,
  restocked: r.restocked,
  returnId: r.returnId ?? undefined,
});

/** The return requests and refunds on these orders, oldest first, keyed by order id. */
export async function listReturnsAndRefunds(orderIds: string[]) {
  if (orderIds.length === 0) return { returns: new Map<string, ReturnRequest[]>(), refunds: new Map<string, Refund[]>() };
  const [returnRows, refundRows] = await Promise.all([
    db.select().from(orderReturns).where(inArray(orderReturns.orderId, orderIds)).orderBy(orderReturns.createdAt),
    db.select().from(orderRefunds).where(inArray(orderRefunds.orderId, orderIds)).orderBy(orderRefunds.createdAt),
  ]);
  const group = <R extends { orderId: string }, T>(rows: R[], map: (r: R) => T) =>
    new Map([...Map.groupBy(rows, (r) => r.orderId)].map(([id, list]) => [id, list.map(map)]));
  return { returns: group(returnRows, toReturn), refunds: group(refundRows, toRefund) };
}

/** Orders for the admin panel, newest first, with their items (two queries in total). Pass `id` for just that order. */
export async function listAdminOrders({ id = null, limit = 500 }: { id?: string | null; limit?: number } = {}): Promise<AdminOrder[]> {
  const rows = await db
    .select()
    .from(orders)
    .where(id ? eq(orders.id, id) : undefined)
    .orderBy(desc(orders.createdAt))
    .limit(limit);
  if (rows.length === 0) return [];
  const items = await db
    .select({ orderId: orderItems.orderId, ...itemColumns })
    .from(orderItems)
    .where(
      inArray(
        orderItems.orderId,
        rows.map((o) => o.id),
      ),
    )
    .orderBy(orderItems.id);
  const itemsByOrder = Map.groupBy(items, (i) => i.orderId);
  const history = await listReturnsAndRefunds(rows.map((o) => o.id));
  return rows.map((o) => ({
    id: o.id,
    number: o.source === "legacy" && o.id.startsWith("woo-") ? `WC-${o.id.slice(4)}` : `CB-${o.number}`,
    createdAt: o.createdAt,
    status: o.status,
    customer: { name: o.name, email: o.email, phone: o.phone },
    shipTo: { address: o.address, suburb: o.suburb, state: o.state, postcode: o.postcode },
    delivery: o.delivery,
    items: (itemsByOrder.get(o.id) ?? []).map((i) => ({ productId: i.productId, name: i.name, unitPrice: i.unitPrice, qty: i.qty })),
    shipping: o.shipping,
    discount: o.discount,
    coupon: o.coupon ?? undefined,
    payment: !o.paidAt
      ? undefined
      : o.paypalCaptureId
        ? { provider: "PayPal", transactionId: o.paypalCaptureId, paidAt: o.paidAt }
        : o.afterpayOrderId
          ? { provider: "Afterpay", transactionId: o.afterpayOrderId, paidAt: o.paidAt }
          : undefined,
    source: o.source,
    paymentMethods: o.paymentMethods ?? DEFAULT_PAYMENT_METHODS,
    note: o.note ?? "",
    shipment: o.shippingCarrier && o.trackingNumber ? { carrier: o.shippingCarrier, trackingNumber: o.trackingNumber } : undefined,
    shippedAt: o.shippedAt ?? undefined,
    paidAt: o.paidAt ?? undefined,
    refunded: o.refundedTotal,
    returns: history.returns.get(o.id) ?? [],
    refunds: history.refunds.get(o.id) ?? [],
  }));
}

/**
 * Puts an order's items back into stock (sign 1, when it's cancelled) or takes them out again (-1, when it's reinstated).
 * Items a refund already restocked are skipped, so they're never counted twice. Call with the order row locked.
 */
export async function moveOrderStock(tx: Tx, orderId: string, sign: 1 | -1) {
  const [lines, refunds] = await Promise.all([
    tx
      .select({ productId: orderItems.productId, qty: sum(orderItems.qty).mapWith(Number) })
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId))
      .groupBy(orderItems.productId),
    tx.select({ restocked: orderRefunds.restocked }).from(orderRefunds).where(eq(orderRefunds.orderId, orderId)),
  ]);
  for (const l of lines) {
    const already = refunds.flatMap((r) => r.restocked).reduce((n, r) => n + (r.productId === l.productId ? r.qty : 0), 0);
    const qty = l.qty - already;
    if (qty <= 0) continue;
    await tx
      .update(products)
      .set({ stock: sql`GREATEST(0, ${products.stock} + ${sign * qty})` })
      .where(eq(products.id, l.productId));
  }
}

/**
 * Cancelling an order puts its stock back; reinstating a cancelled order takes it out again.
 * `shipment`: the carrier and tracking number to save with it (null clears them, undefined leaves them).
 * `from`: the statuses it may change from; anything else is refused (e.g. a customer cancelling an order that was just paid).
 */
export async function setOrderStatus(id: string, status: OrderStatus, shipment?: Shipment | null, from?: OrderStatus[]) {
  await transaction(async (tx) => {
    // Locks the order, so two status changes at once can't both restock it.
    const [order] = await tx.select({ status: orders.status, shippedAt: orders.shippedAt }).from(orders).where(eq(orders.id, id)).for("update");
    if (!order) throw new AdminError("Order not found.", 404);
    if (from && !from.includes(order.status)) throw new AdminError("This order has changed. Refresh the page and try again.", 409);
    if (order.status === status && shipment === undefined) return;
    // Refunded is set by refunding the order in full, and is final.
    if (order.status === "refunded" || status === "refunded") throw new AdminError("Refunded orders are changed by refunding them, not by changing their status.");
    const next: Partial<Record<OrderStatus, OrderStatus[]>> = {
      pending_payment: ["paid", "cancelled"],
      processing: ["confirmed", "cancelled"],
      paid: ["confirmed", "cancelled"],
      confirmed: ["preparing", "cancelled"],
      preparing: ["fulfilled", "cancelled"],
      fulfilled: ["completed"],
      cancelled: ["pending_payment", "processing", "paid"],
    };
    if (status !== order.status && !next[order.status]?.includes(status)) {
      throw new AdminError("Move this order through the dispatch steps in order.");
    }
    const sign = status === "cancelled" ? 1 : order.status === "cancelled" ? -1 : 0;
    if (sign) await moveOrderStock(tx, id, sign);
    await tx
      .update(orders)
      .set({
        status,
        ...(shipment !== undefined && { shippingCarrier: shipment?.carrier ?? null, trackingNumber: shipment?.trackingNumber ?? null }),
        ...((status === "fulfilled" || status === "completed") && !order.shippedAt && { shippedAt: new Date().toISOString() }),
      })
      .where(eq(orders.id, id));
  });
}

export async function createBooking(input: BookingInput) {
  const id = randomUUID();
  await db
    .insert(bookings)
    .values({ id, name: input.name, email: input.email, phone: input.phone, city: input.city, vehicle: input.vehicle, preferredDate: input.date, notes: input.notes || null });
  return id;
}

export function listBookings(limit = 100) {
  return db.select().from(bookings).orderBy(desc(bookings.createdAt)).limit(limit);
}

/** Returns false if the email was already subscribed. */
export async function addSubscriber(email: string) {
  const added = await db.insert(subscribers).values({ email: email.toLowerCase() }).onConflictDoNothing().returning({ email: subscribers.email });
  return added.length > 0;
}

export function listSubscribers(limit = 200) {
  return db.select().from(subscribers).orderBy(desc(subscribers.createdAt)).limit(limit);
}

export async function getStats() {
  const [[sales], [booked], [subscribed]] = await Promise.all([
    db
      .select({ n: count(), revenue: sql<number>`COALESCE(SUM(${orders.total} - ${orders.refundedTotal}), 0)`.mapWith(Number) })
      .from(orders)
      .where(notInArray(orders.status, ["cancelled", "refunded"])),
    db.select({ n: count() }).from(bookings),
    db.select({ n: count() }).from(subscribers),
  ]);
  return { orders: sales.n, revenue: sales.revenue, bookings: booked.n, subscribers: subscribed.n };
}
