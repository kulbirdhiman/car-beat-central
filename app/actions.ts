"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { rememberFirstAddress } from "@/lib/server/account";
import { afterpayEnabled, createAfterpayCheckout } from "@/lib/server/afterpay";
import { getCustomer } from "@/lib/server/customer";
import { addSubscriber, createBooking, createOrder } from "@/lib/server/orders";
import { PaymentError } from "@/lib/server/payments";
import { paypalEnabled } from "@/lib/server/paypal";
import { addReview } from "@/lib/server/reviews";
import { EMAIL_RE, parseCart, str, validateBooking, validateCheckout, validateReview, type FieldErrors } from "@/lib/server/validate";

export type FormState = {
  ok?: boolean;
  message?: string;
  errors?: FieldErrors;
  /** Submitted text values, echoed back so the form can be refilled after React resets it. */
  values?: Record<string, string>;
};

function echo(form: FormData, keys: string[]) {
  return Object.fromEntries(keys.map((k) => [k, str(form, k, 1000)]));
}

const CHECKOUT_FIELDS = ["email", "phone", "name", "address", "suburb", "state", "postcode"];
const BOOKING_FIELDS = ["name", "email", "phone", "city", "vehicle", "date", "notes"];

// These are public endpoints (anyone can POST to them), so every input is validated here
// and prices are recomputed from the database; nothing from the client is trusted.

export async function placeOrder(_prev: FormState, form: FormData): Promise<FormState> {
  const { data, errors } = validateCheckout(form);
  const values = echo(form, CHECKOUT_FIELDS);
  if (!data) return { errors, values, message: "Please fix the highlighted fields." };
  if (data.payment === "paypal" && !paypalEnabled()) return { values, errors: { payment: "Card payments are unavailable right now." }, message: "Please choose another way to pay." };
  if (data.payment === "afterpay" && !afterpayEnabled()) return { values, errors: { payment: "Afterpay is unavailable right now." }, message: "Please choose another way to pay." };

  let cart;
  try {
    cart = parseCart(JSON.parse(str(form, "cart", 5000)));
  } catch {
    cart = null;
  }
  if (!cart) return { values, message: "Your cart is empty or invalid." };

  const customer = await getCustomer();
  const result = await createOrder(data, cart, customer?.id);
  if ("error" in result) return { values, message: result.error, errors: result.field ? { [result.field]: result.error } : undefined };
  if (customer) await rememberFirstAddress(customer.id, data);

  // Afterpay shoppers go straight to Afterpay; if that fails, the order page explains and lets them retry.
  if (data.payment === "afterpay") redirect(await afterpayRedirect(result.id));
  redirect(`/order/${result.id}`);
}

/** Our site's address, for the links Afterpay sends shoppers back to. */
async function siteOrigin() {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, "");
  const h = await headers();
  return `${h.get("x-forwarded-proto") ?? "http"}://${h.get("x-forwarded-host") ?? h.get("host")}`;
}

/** Where to send the shopper to pay an order with Afterpay: Afterpay itself, or back to the order page with the reason it can't. */
async function afterpayRedirect(orderId: string) {
  try {
    return await createAfterpayCheckout(orderId, await siteOrigin());
  } catch (error) {
    if (!(error instanceof PaymentError)) console.error("Afterpay checkout failed", error);
    const message = error instanceof PaymentError ? error.message : "We couldn't start your Afterpay payment. Please try again.";
    return `/order/${orderId}?afterpay=${encodeURIComponent(message)}`;
  }
}

/** The order page's "Pay with Afterpay" button. */
export async function payWithAfterpay(orderId: string) {
  if (!/^[0-9a-f-]{36}$/.test(orderId)) return;
  redirect(await afterpayRedirect(orderId));
}

export async function bookFitting(_prev: FormState, form: FormData): Promise<FormState> {
  const { data, errors } = validateBooking(form);
  if (!data) return { errors, values: echo(form, BOOKING_FIELDS), message: "Please fix the highlighted fields." };
  await createBooking(data);
  return {
    ok: true,
    message: `Thanks ${data.name.split(" ")[0]}! Our ${data.city} team will confirm your fitting within one business day.`,
  };
}

export async function subscribe(_prev: FormState, form: FormData): Promise<FormState> {
  const email = str(form, "email").toLowerCase();
  if (!EMAIL_RE.test(email)) return { errors: { email: "Enter a valid email address." }, values: { email } };
  const added = await addSubscriber(email);
  return { ok: true, message: added ? "You're in. Watch your inbox for price drops." : "You're already subscribed. Good on ya!" };
}

const REVIEW_FIELDS = ["name", "rating", "title", "body", "vehicle"];

export async function submitReview(_prev: FormState, form: FormData): Promise<FormState> {
  const { data, errors } = validateReview(form);
  if (!data) return { errors, values: echo(form, REVIEW_FIELDS), message: "Please fix the highlighted fields." };
  if (!(await addReview(data))) return { message: "That product no longer exists." };
  revalidatePath(`/products/${str(form, "slug", 120)}`);
  return { ok: true, message: `Thanks ${data.name.split(" ")[0]}! Your review is live.` };
}
