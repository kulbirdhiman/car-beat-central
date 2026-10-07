import "server-only";
import { eq, sql } from "drizzle-orm";
import { db } from "./db";
import { getOrder, type OrderRecord } from "./orders";
import { orders } from "./schema";

/**
 * PayPal Checkout (Orders v2 REST API). The browser only ever sees our order id: the amount PayPal charges
 * is always built here from the order in the database, and a payment only counts once we've captured it
 * ourselves and checked the captured amount. PAYPAL_ENV=live switches from the sandbox to real payments.
 */

export class PaymentError extends Error {}

const API = () => (process.env.PAYPAL_ENV === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com");
const CURRENCY = "AUD";

export const paypalEnabled = () => Boolean(process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);

let token: { value: string; expires: number } | null = null;

async function accessToken() {
  if (token && token.expires > Date.now()) return token.value;
  const id = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!id || !secret) throw new PaymentError("PayPal isn't set up yet. Please try again later.");
  const res = await fetch(`${API()}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  if (!res.ok) {
    console.error("PayPal auth failed", res.status, await res.text());
    throw new PaymentError("We couldn't reach PayPal. Please try again.");
  }
  const body = (await res.json()) as { access_token: string; expires_in: number };
  // Refresh a minute early so a token never expires mid-request.
  token = { value: body.access_token, expires: Date.now() + (body.expires_in - 60) * 1000 };
  return token.value;
}

async function paypal<T>(path: string, init: { body?: unknown; requestId?: string } = {}): Promise<T> {
  const res = await fetch(`${API()}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${await accessToken()}`,
      "Content-Type": "application/json",
      // Makes retries safe: PayPal returns the first result instead of acting twice.
      ...(init.requestId && { "PayPal-Request-Id": init.requestId }),
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    cache: "no-store",
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("PayPal API error", path, res.status, JSON.stringify(body));
    const issue = (body as { details?: { issue?: string }[] }).details?.[0]?.issue;
    if (issue === "INSTRUMENT_DECLINED") throw new PaymentError("PayPal declined that payment method. Please choose another one.");
    throw new PaymentError("PayPal couldn't process the payment. Please try again.");
  }
  return body as T;
}

const money = (cents: number) => ({ currency_code: CURRENCY, value: (cents / 100).toFixed(2) });

/** The amount, with its breakdown and line items when they add up exactly (PayPal rejects them otherwise). */
function purchaseUnit(order: OrderRecord) {
  const reference = order.id.slice(0, 8).toUpperCase();
  const unit = { reference_id: order.id, custom_id: order.id, description: `CarBeat order #${reference}`, amount: money(order.total) };
  const itemTotal = order.items.reduce((n, i) => n + i.unitPrice * i.qty, 0);
  if (itemTotal !== order.subtotal || order.subtotal - order.discount + order.shipping !== order.total) return unit;
  return {
    ...unit,
    amount: { ...money(order.total), breakdown: { item_total: money(order.subtotal), shipping: money(order.shipping), discount: money(order.discount) } },
    items: order.items.map((i) => ({ name: i.name.slice(0, 127), sku: i.productId.slice(0, 127), quantity: String(i.qty), unit_amount: money(i.unitPrice), category: "PHYSICAL_GOODS" })),
  };
}

async function payableOrder(orderId: string) {
  const order = await getOrder(orderId);
  if (!order) throw new PaymentError("We couldn't find that order.");
  if (order.status === "paid" || order.status === "fulfilled") throw new PaymentError("This order has already been paid.");
  if (order.status === "cancelled") throw new PaymentError("This order was cancelled, so it can't be paid.");
  return order;
}

/** Starts a PayPal payment for one of our orders and returns the PayPal order id the buttons need. */
export async function createPayPalOrder(orderId: string): Promise<string> {
  const order = await payableOrder(orderId);
  const created = await paypal<{ id: string }>("/v2/checkout/orders", {
    body: {
      intent: "CAPTURE",
      purchase_units: [purchaseUnit(order)],
      // The delivery address was already taken at checkout. (Set here rather than in payment_source, so card payments work too.)
      application_context: { brand_name: "CarBeat", shipping_preference: "NO_SHIPPING", user_action: "PAY_NOW", locale: "en-AU" },
    },
  });
  await db.update(orders).set({ paypalOrderId: created.id }).where(eq(orders.id, order.id));
  return created.id;
}

type Capture = { id: string; status: string; amount: { currency_code: string; value: string }; custom_id?: string };
type CaptureResponse = { status: string; purchase_units?: { payments?: { captures?: Capture[] } }[] };

/**
 * Captures the payment the shopper just approved and marks the order paid.
 * Only the PayPal order we created for this order is accepted, and only for its full amount.
 */
export async function capturePayPalOrder(orderId: string, paypalOrderId: string) {
  const order = await payableOrder(orderId);
  if (!order.paypalOrderId || order.paypalOrderId !== paypalOrderId) throw new PaymentError("That payment doesn't belong to this order.");

  const result = await paypal<CaptureResponse>(`/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`, { requestId: `capture-${paypalOrderId}` });
  const capture = result.purchase_units?.[0]?.payments?.captures?.[0];
  if (result.status !== "COMPLETED" || !capture || capture.status !== "COMPLETED") {
    // PENDING captures (e.g. an eCheck or a review) aren't treated as paid; an admin can mark them paid later.
    console.warn("PayPal capture not completed", orderId, result.status, capture?.status);
    throw new PaymentError("PayPal hasn't confirmed the payment yet. We'll email you once it clears.");
  }
  const expected = money(order.total);
  if (capture.amount.currency_code !== expected.currency_code || capture.amount.value !== expected.value) {
    console.error("PayPal captured amount mismatch", orderId, capture.amount, expected);
    throw new PaymentError("The payment amount didn't match your order. Please contact us before trying again.");
  }

  // The capture id is always kept so the money can be refunded, even if an admin cancelled the order mid-payment.
  const [saved] = await db
    .update(orders)
    .set({
      status: sql`CASE WHEN ${orders.status} = 'pending_payment' THEN 'paid' ELSE ${orders.status} END`,
      paypalCaptureId: capture.id,
      paidAt: new Date().toISOString(),
    })
    .where(eq(orders.id, order.id))
    .returning({ status: orders.status });
  if (saved?.status !== "paid") console.error("PayPal payment captured for an order that is no longer awaiting payment; refund it in PayPal", orderId, capture.id);
}
