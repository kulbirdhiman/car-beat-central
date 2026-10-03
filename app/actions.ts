"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { addSubscriber, createBooking, createOrder } from "@/lib/server/orders";
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

  let cart;
  try {
    cart = parseCart(JSON.parse(str(form, "cart", 5000)));
  } catch {
    cart = null;
  }
  if (!cart) return { values, message: "Your cart is empty or invalid." };

  const result = createOrder(data, cart);
  if ("error" in result) return { values, message: result.error, errors: result.field ? { [result.field]: result.error } : undefined };

  redirect(`/order/${result.id}`);
}

export async function bookFitting(_prev: FormState, form: FormData): Promise<FormState> {
  const { data, errors } = validateBooking(form);
  if (!data) return { errors, values: echo(form, BOOKING_FIELDS), message: "Please fix the highlighted fields." };
  createBooking(data);
  return {
    ok: true,
    message: `Thanks ${data.name.split(" ")[0]}! Our ${data.city} team will confirm your fitting within one business day.`,
  };
}

export async function subscribe(_prev: FormState, form: FormData): Promise<FormState> {
  const email = str(form, "email").toLowerCase();
  if (!EMAIL_RE.test(email)) return { errors: { email: "Enter a valid email address." }, values: { email } };
  const added = addSubscriber(email);
  return { ok: true, message: added ? "You're in. Watch your inbox for price drops." : "You're already subscribed. Good on ya!" };
}

const REVIEW_FIELDS = ["name", "rating", "title", "body", "vehicle"];

export async function submitReview(_prev: FormState, form: FormData): Promise<FormState> {
  const { data, errors } = validateReview(form);
  if (!data) return { errors, values: echo(form, REVIEW_FIELDS), message: "Please fix the highlighted fields." };
  if (!addReview(data)) return { message: "That product no longer exists." };
  revalidatePath(`/products/${str(form, "slug", 120)}`);
  return { ok: true, message: `Thanks ${data.name.split(" ")[0]}! Your review is live.` };
}
