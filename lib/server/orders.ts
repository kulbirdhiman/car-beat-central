import "server-only";
import { randomUUID } from "node:crypto";
import { priceCart, unitPriceCents, type Delivery, type Totals } from "../pricing";
import type { CartLine, OrderStatus } from "../types";
import { db } from "./db";
import { listProducts } from "./queries";
import type { BookingInput, CheckoutInput } from "./validate";

function isFirstOrder(email: string | undefined) {
  if (!email) return true;
  const row = db.prepare("SELECT COUNT(*) AS n FROM orders WHERE email = ?").get(email.toLowerCase()) as { n: number };
  return row.n === 0;
}

/** Prices a cart from database prices. Unknown product ids are dropped. */
export function quoteCart(lines: CartLine[], opts: { coupon?: string; delivery: Delivery; email?: string }) {
  const products = listProducts({ ids: lines.map((l) => l.productId) });
  const priced = lines.flatMap((l) => {
    const product = products.find((p) => p.id === l.productId);
    return product ? [{ product, qty: l.qty }] : [];
  });
  const totals = priceCart(priced, { ...opts, isFirstOrder: isFirstOrder(opts.email) });
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

  const id = randomUUID();
  const status: OrderStatus = "pending_payment";
  const insertItem = db.prepare("INSERT INTO order_items (order_id, product_id, name, unit_price, qty) VALUES (?, ?, ?, ?, ?)");

  db.exec("BEGIN IMMEDIATE");
  try {
    db.prepare(
      `INSERT INTO orders (id, status, email, name, phone, address, suburb, state, postcode, delivery, coupon, subtotal, discount, shipping, total)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id, status, input.email, input.name, input.phone, input.address, input.suburb, input.state, input.postcode,
      input.delivery, totals.coupon, totals.subtotal, totals.discount, totals.shipping, totals.total,
    );
    for (const l of lines) insertItem.run(id, l.product.id, l.product.name, unitPriceCents(l.product), l.qty);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
  return { id, totals };
}

export type OrderRecord = {
  id: string;
  created_at: string;
  status: OrderStatus;
  email: string;
  name: string;
  phone: string;
  address: string;
  suburb: string;
  state: string;
  postcode: string;
  delivery: Delivery;
  coupon: string | null;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  items: { product_id: string; name: string; unit_price: number; qty: number }[];
};

export function getOrder(id: string): OrderRecord | null {
  const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(id) as Omit<OrderRecord, "items"> | undefined;
  if (!order) return null;
  const items = db.prepare("SELECT product_id, name, unit_price, qty FROM order_items WHERE order_id = ?").all(id) as OrderRecord["items"];
  return { ...order, items };
}

export function listOrders(limit = 100) {
  return db
    .prepare(
      `SELECT o.id, o.created_at, o.status, o.name, o.email, o.state, o.total, SUM(i.qty) AS items
       FROM orders o JOIN order_items i ON i.order_id = o.id
       GROUP BY o.id ORDER BY o.created_at DESC LIMIT ?`,
    )
    .all(limit) as { id: string; created_at: string; status: OrderStatus; name: string; email: string; state: string; total: number; items: number }[];
}

export function createBooking(input: BookingInput) {
  const id = randomUUID();
  db.prepare(
    "INSERT INTO bookings (id, name, email, phone, city, vehicle, preferred_date, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
  ).run(id, input.name, input.email, input.phone, input.city, input.vehicle, input.date, input.notes || null);
  return id;
}

export function listBookings(limit = 100) {
  return db.prepare("SELECT * FROM bookings ORDER BY created_at DESC LIMIT ?").all(limit) as {
    id: string;
    created_at: string;
    name: string;
    email: string;
    phone: string;
    city: string;
    vehicle: string;
    preferred_date: string;
    notes: string | null;
  }[];
}

/** Returns false if the email was already subscribed. */
export function addSubscriber(email: string) {
  const result = db.prepare("INSERT OR IGNORE INTO subscribers (email) VALUES (?)").run(email.toLowerCase());
  return result.changes > 0;
}

export function listSubscribers(limit = 200) {
  return db.prepare("SELECT email, created_at FROM subscribers ORDER BY created_at DESC LIMIT ?").all(limit) as {
    email: string;
    created_at: string;
  }[];
}

export function getStats() {
  const orders = db.prepare("SELECT COUNT(*) AS n, COALESCE(SUM(total), 0) AS revenue FROM orders WHERE status != 'cancelled'").get() as {
    n: number;
    revenue: number;
  };
  const bookings = db.prepare("SELECT COUNT(*) AS n FROM bookings").get() as { n: number };
  const subscribers = db.prepare("SELECT COUNT(*) AS n FROM subscribers").get() as { n: number };
  return { orders: orders.n, revenue: orders.revenue, bookings: bookings.n, subscribers: subscribers.n };
}
