import "server-only";
import { eq, sql } from "drizzle-orm";
import { db } from "./db";
import type { OrderRecord } from "./orders";
import { PaymentError, payableOrder } from "./payments";
import { orders } from "./schema";

/**
 * Afterpay (Online API v2). The shopper is sent to Afterpay with a checkout we build here from the order in the
 * database, and comes back to /api/afterpay/return, where we capture the payment ourselves and check the amount
 * before marking the order paid. AFTERPAY_ENV=live charges real money; anything else uses the sandbox.
 */

const API = () => (process.env.AFTERPAY_ENV === "live" ? "https://global-api.afterpay.com" : "https://global-api-sandbox.afterpay.com");
const CURRENCY = "AUD";

export const afterpayEnabled = () => Boolean(process.env.AFTERPAY_MERCHANT_ID && process.env.AFTERPAY_SECRET_KEY);

async function afterpay<T>(path: string, init: { method?: "GET" | "POST"; body?: unknown } = {}): Promise<{ ok: boolean; status: number; body: T }> {
  const id = process.env.AFTERPAY_MERCHANT_ID;
  const secret = process.env.AFTERPAY_SECRET_KEY;
  if (!id || !secret) throw new PaymentError("Afterpay isn't set up yet. Please choose another way to pay.");
  const res = await fetch(`${API()}${path}`, {
    method: init.method ?? "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      // Afterpay asks every integration to identify itself this way.
      "User-Agent": `CarBeat/1.0.0 (Custom/1.0.0; Node/${process.versions.node}; Merchant/${id}) ${process.env.SITE_URL ?? ""}`.trim(),
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    cache: "no-store",
  });
  return { ok: res.ok, status: res.status, body: (await res.json().catch(() => ({}))) as T };
}

const money = (cents: number) => ({ amount: (cents / 100).toFixed(2), currency: CURRENCY });
const toCents = (m: { amount: string }) => Math.round(Number(m.amount) * 100);

let limits: { value: { min: number; max: number } | null; expires: number } | null = null;

/** The order totals (in cents) Afterpay accepts for this merchant, or null when Afterpay is off or unreachable. Cached for an hour. */
export async function afterpayLimits(): Promise<{ min: number; max: number } | null> {
  if (!afterpayEnabled()) return null;
  if (limits && limits.expires > Date.now()) return limits.value;
  let value: { min: number; max: number } | null = null;
  try {
    const res = await afterpay<{ minimumAmount?: { amount: string }; maximumAmount?: { amount: string } }>("/v2/configuration", { method: "GET" });
    if (res.ok && res.body.maximumAmount) value = { min: res.body.minimumAmount ? toCents(res.body.minimumAmount) : 1, max: toCents(res.body.maximumAmount) };
    else console.error("Afterpay configuration failed", res.status, JSON.stringify(res.body));
  } catch (error) {
    console.error("Afterpay configuration failed", error);
  }
  // A failure is retried after a minute rather than an hour.
  limits = { value, expires: Date.now() + (value ? 60 : 1) * 60 * 1000 };
  return value;
}

/** Whether Afterpay can take this total (in cents) right now. */
export async function afterpayAvailableFor(total: number) {
  const range = await afterpayLimits();
  return !!range && total >= range.min && total <= range.max;
}

function address(order: OrderRecord) {
  return { name: order.name, line1: order.address, area1: order.suburb, region: order.state, postcode: order.postcode, countryCode: "AU", phoneNumber: order.phone };
}

/**
 * Starts an Afterpay checkout for one of our orders and returns the Afterpay page to send the shopper to.
 * `origin` is our site's address (e.g. https://carbeat.com.au), which Afterpay sends the shopper back to.
 */
export async function createAfterpayCheckout(orderId: string, origin: string): Promise<string> {
  const order = await payableOrder(orderId);
  if (order.paymentMethods && !order.paymentMethods.includes("afterpay")) throw new PaymentError("Afterpay isn't available for this order.");
  if (!(await afterpayAvailableFor(order.total))) throw new PaymentError("Afterpay isn't available for this order total. Please choose another way to pay.");

  const [givenNames, ...rest] = order.name.trim().split(/\s+/);
  const back = `${origin}/api/afterpay/return?order=${order.id}`;
  const itemTotal = order.items.reduce((n, i) => n + i.unitPrice * i.qty, 0);
  const res = await afterpay<{ token?: string; redirectCheckoutUrl?: string; errorCode?: string; message?: string }>("/v2/checkouts", {
    body: {
      amount: money(order.total),
      consumer: { givenNames, surname: rest.join(" ") || givenNames, email: order.email, phoneNumber: order.phone },
      billing: address(order),
      ...(order.delivery !== "collect" && { shipping: address(order) }),
      // The breakdown is only sent when it adds up exactly, as with PayPal.
      ...(itemTotal === order.subtotal &&
        order.subtotal - order.discount + order.shipping === order.total && {
          items: order.items.map((i) => ({ name: i.name.slice(0, 255), sku: i.productId.slice(0, 128), quantity: i.qty, price: money(i.unitPrice) })),
          shippingAmount: money(order.shipping),
          ...(order.discount > 0 && { discounts: [{ displayName: order.coupon ? `Coupon ${order.coupon}` : "Discount", amount: money(order.discount) }] }),
        }),
      merchant: { redirectConfirmUrl: back, redirectCancelUrl: back },
      merchantReference: order.id,
    },
  });
  if (!res.ok || !res.body.token || !res.body.redirectCheckoutUrl) {
    console.error("Afterpay checkout failed", orderId, res.status, JSON.stringify(res.body));
    throw new PaymentError("We couldn't start your Afterpay payment. Please try again or choose another way to pay.");
  }
  await db.update(orders).set({ afterpayToken: res.body.token }).where(eq(orders.id, order.id));
  return res.body.redirectCheckoutUrl;
}

type Payment = { id: string; status: "APPROVED" | "DECLINED"; originalAmount: { amount: string; currency: string }; errorCode?: string };

/**
 * Captures the payment the shopper just approved on Afterpay and marks the order paid.
 * Only the checkout we created for this order is accepted, and only for its full amount.
 */
export async function captureAfterpayPayment(orderId: string, token: string) {
  const order = await payableOrder(orderId);
  if (!order.afterpayToken || order.afterpayToken !== token) throw new PaymentError("That payment doesn't belong to this order.");

  // The request id makes a repeated capture (e.g. the shopper reloading the page) return the first result.
  const res = await afterpay<Payment>("/v2/payments/capture", { body: { token, merchantReference: order.id, requestId: `capture-${token}` } });
  if (!res.ok || res.body.status !== "APPROVED") {
    console.warn("Afterpay capture not approved", orderId, res.status, JSON.stringify(res.body));
    if (res.body.status === "DECLINED" || res.status === 402) throw new PaymentError("Afterpay declined the payment. Please choose another way to pay.");
    throw new PaymentError("Afterpay couldn't confirm the payment. Please contact us before trying again.");
  }
  const expected = money(order.total);
  if (res.body.originalAmount.currency !== expected.currency || toCents(res.body.originalAmount) !== order.total) {
    console.error("Afterpay captured amount mismatch", orderId, res.body.originalAmount, expected);
    throw new PaymentError("The payment amount didn't match your order. Please contact us before trying again.");
  }

  // The Afterpay order id is always kept so the money can be refunded, even if an admin cancelled the order mid-payment.
  const [saved] = await db
    .update(orders)
    .set({
      status: sql`CASE WHEN ${orders.status} = 'pending_payment' THEN 'paid' ELSE ${orders.status} END`,
      afterpayOrderId: res.body.id,
      paidAt: new Date().toISOString(),
    })
    .where(eq(orders.id, order.id))
    .returning({ status: orders.status });
  if (saved?.status !== "paid") console.error("Afterpay payment captured for an order that is no longer awaiting payment; refund it in Afterpay", orderId, res.body.id);
}
