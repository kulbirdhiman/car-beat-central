import "server-only";
import { and, count, desc, eq, gte, inArray, isNull, lt, ne, or, sql, sum } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import type { AdminOrder } from "../admin/model";
import { priceCart, unitPriceCents, type Delivery, type Totals } from "../pricing";
import type { CartLine, OrderStatus } from "../types";
import { getCouponByCode } from "./admin/promos";
import { AdminError } from "./admin/validate";
import { db, transaction } from "./db";
import { listProducts } from "./queries";
import { bookings, coupons, orderItems, orders, products, subscribers } from "./schema";
import type { BookingInput, CheckoutInput } from "./validate";

// Cancelled orders don't count, so a shopper whose first order fell through keeps first-order codes.
const priorOrder = db
  .select({ id: orders.id })
  .from(orders)
  .where(and(eq(orders.email, sql.placeholder("email")), ne(orders.status, "cancelled")))
  .limit(1)
  .prepare();

function isFirstOrder(email: string | undefined) {
  return !email || !priorOrder.get({ email: email.toLowerCase() });
}

/** Prices a cart from database prices. Unknown product ids are dropped. */
export function quoteCart(lines: CartLine[], opts: { coupon?: string; delivery: Delivery; email?: string }) {
  const found = listProducts({ ids: lines.map((l) => l.productId) });
  const priced = lines.flatMap((l) => {
    const product = found.find((p) => p.id === l.productId);
    return product ? [{ product, qty: l.qty }] : [];
  });
  const coupon = opts.coupon?.trim() ? getCouponByCode(opts.coupon) : null;
  const totals = priceCart(priced, { couponCode: opts.coupon, coupon, delivery: opts.delivery, isFirstOrder: isFirstOrder(opts.email) });
  return { lines: priced, totals };
}

export function createOrder(
  input: CheckoutInput,
  cart: CartLine[],
): { id: string; totals: Totals } | { error: string; field?: "coupon" } {
  const { lines, totals } = quoteCart(cart, { coupon: input.coupon, delivery: input.delivery, email: input.email });
  if (lines.length === 0) return { error: "Your cart is empty." };
  if (lines.length !== cart.length) return { error: "Some items in your cart are no longer available. Please review your cart." };
  if (input.coupon && totals.couponError) return { error: totals.couponError, field: "coupon" };

  const soldOut = lines.find((l) => l.product.stock < l.qty);
  if (soldOut) return { error: stockMessage(soldOut.product.name, soldOut.product.stock) };

  const id = randomUUID();
  try {
    transaction((tx) => {
      // Stock and coupon usage are re-checked inside the write lock, so two shoppers can't buy the last unit.
      for (const l of lines) {
        const taken = tx
          .update(products)
          .set({ stock: sql`${products.stock} - ${l.qty}` })
          .where(and(eq(products.id, l.product.id), gte(products.stock, l.qty)))
          .run();
        if (taken.changes === 0) throw new AdminError(stockMessage(l.product.name, 0));
      }
      if (totals.coupon) {
        const counted = tx
          .update(coupons)
          .set({ used: sql`${coupons.used} + 1` })
          .where(and(eq(coupons.code, totals.coupon), or(isNull(coupons.usageLimit), lt(coupons.used, coupons.usageLimit))))
          .run();
        if (counted.changes === 0) throw new AdminError("That code has just reached its usage limit.");
      }
      tx.insert(orders)
        .values({
          id,
          status: "pending_payment",
          email: input.email,
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
        })
        .run();
      tx.insert(orderItems)
        .values(lines.map((l) => ({ orderId: id, productId: l.product.id, name: l.product.name, unitPrice: unitPriceCents(l.product), qty: l.qty })))
        .run();
    });
  } catch (error) {
    if (error instanceof AdminError) return { error: error.message };
    throw error;
  }
  return { id, totals };
}

function stockMessage(name: string, stock: number) {
  return stock === 0 ? `Sorry, ${name} has just sold out. Please remove it from your cart.` : `Only ${stock} of ${name} left. Please lower the quantity.`;
}

const itemColumns = { productId: orderItems.productId, name: orderItems.name, unitPrice: orderItems.unitPrice, qty: orderItems.qty };

export type OrderRecord = typeof orders.$inferSelect & { items: { productId: string; name: string; unitPrice: number; qty: number }[] };

export function getOrder(id: string): OrderRecord | null {
  const order = db.select().from(orders).where(eq(orders.id, id)).get();
  if (!order) return null;
  const items = db.select(itemColumns).from(orderItems).where(eq(orderItems.orderId, id)).all();
  return { ...order, items };
}

/** Orders for the admin panel, newest first, with their items (two queries in total). Pass `id` for just that order. */
export function listAdminOrders({ id = null, limit = 500 }: { id?: string | null; limit?: number } = {}): AdminOrder[] {
  const rows = db
    .select({ order: orders, number: sql<number>`${orders}.rowid + 1000` })
    .from(orders)
    .where(id ? eq(orders.id, id) : undefined)
    .orderBy(desc(orders.createdAt))
    .limit(limit)
    .all();
  if (rows.length === 0) return [];
  const items = db
    .select({ orderId: orderItems.orderId, ...itemColumns })
    .from(orderItems)
    .where(
      inArray(
        orderItems.orderId,
        rows.map((r) => r.order.id),
      ),
    )
    .orderBy(sql`${orderItems}.rowid`)
    .all();
  const itemsByOrder = Map.groupBy(items, (i) => i.orderId);
  return rows.map(({ order: o, number }) => ({
    id: o.id,
    number: `CB-${number}`,
    createdAt: o.createdAt,
    status: o.status,
    customer: { name: o.name, email: o.email, phone: o.phone },
    shipTo: { address: o.address, suburb: o.suburb, state: o.state, postcode: o.postcode },
    delivery: o.delivery,
    items: (itemsByOrder.get(o.id) ?? []).map((i) => ({ productId: i.productId, name: i.name, unitPrice: i.unitPrice, qty: i.qty })),
    shipping: o.shipping,
    discount: o.discount,
    coupon: o.coupon ?? undefined,
  }));
}

/** Cancelling an order puts its stock back; reinstating a cancelled order takes it out again. */
export function setOrderStatus(id: string, status: OrderStatus) {
  transaction((tx) => {
    const order = tx.select({ status: orders.status }).from(orders).where(eq(orders.id, id)).get();
    if (!order) throw new AdminError("Order not found.", 404);
    if (order.status === status) return;
    const sign = status === "cancelled" ? 1 : order.status === "cancelled" ? -1 : 0;
    if (sign) {
      const lines = tx
        .select({ productId: orderItems.productId, qty: sum(orderItems.qty).mapWith(Number) })
        .from(orderItems)
        .where(eq(orderItems.orderId, id))
        .groupBy(orderItems.productId)
        .all();
      for (const l of lines) {
        tx.update(products)
          .set({ stock: sql`MAX(0, ${products.stock} + ${sign * l.qty})` })
          .where(eq(products.id, l.productId))
          .run();
      }
    }
    tx.update(orders).set({ status }).where(eq(orders.id, id)).run();
  });
}

export function createBooking(input: BookingInput) {
  const id = randomUUID();
  db.insert(bookings)
    .values({ id, name: input.name, email: input.email, phone: input.phone, city: input.city, vehicle: input.vehicle, preferredDate: input.date, notes: input.notes || null })
    .run();
  return id;
}

export function listBookings(limit = 100) {
  return db.select().from(bookings).orderBy(desc(bookings.createdAt)).limit(limit).all();
}

/** Returns false if the email was already subscribed. */
export function addSubscriber(email: string) {
  return db.insert(subscribers).values({ email: email.toLowerCase() }).onConflictDoNothing().run().changes > 0;
}

export function listSubscribers(limit = 200) {
  return db.select().from(subscribers).orderBy(desc(subscribers.createdAt)).limit(limit).all();
}

export function getStats() {
  const sales = db
    .select({ n: count(), revenue: sql<number>`COALESCE(SUM(${orders.total}), 0)` })
    .from(orders)
    .where(ne(orders.status, "cancelled"))
    .get()!;
  const [booked] = db.select({ n: count() }).from(bookings).all();
  const [subscribed] = db.select({ n: count() }).from(subscribers).all();
  return { orders: sales.n, revenue: sales.revenue, bookings: booked.n, subscribers: subscribed.n };
}
