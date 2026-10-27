import "server-only";
import { AU_STATES, CATEGORY_LABELS, FITTING_CITIES } from "../data";
import { PAYMENT_METHODS, type PaymentMethod } from "../payment";
import { DELIVERY_OPTIONS, type Delivery } from "../pricing";
import type { CartLine, Category } from "../types";
import { getCarBrands, SORTS, type ProductFilters, type SortKey } from "./queries";

/** Field-level errors keyed by input name, shown next to each field. */
export type FieldErrors = Record<string, string>;

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function str(form: FormData, key: string, max = 200) {
  const value = form.get(key);
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

/** Parses shop/API filters from URL search params, dropping anything invalid. */
export async function parseFilters(params: URLSearchParams): Promise<ProductFilters> {
  const category = params.get("category");
  const dept = params.get("dept");
  const model = params.get("model");
  const sort = params.get("sort");
  const maxPrice = Number(params.get("maxPrice"));
  const limit = Number(params.get("limit"));
  const ids = params.get("ids");
  return {
    q: params.get("q")?.trim().slice(0, 80) || undefined,
    category: category && category in CATEGORY_LABELS ? (category as Category) : undefined,
    dept: dept && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(dept) ? dept.slice(0, 80) : undefined,
    model: model && (await getCarBrands()).some((b) => b.models.some((m) => m.id === model)) ? model : undefined,
    maxPrice: maxPrice > 0 ? maxPrice : undefined,
    onSale: params.get("sale") === "1" || undefined,
    sort: sort && sort in SORTS ? (sort as SortKey) : undefined,
    ids: ids ? ids.split(",").filter(Boolean).slice(0, 50) : undefined,
    limit: limit > 0 ? Math.min(limit, 50) : undefined,
  };
}

/** Accepts only well-formed cart lines with sane quantities. */
export function parseCart(raw: unknown): CartLine[] | null {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > 50) return null;
  const lines: CartLine[] = [];
  for (const item of raw) {
    if (typeof item?.productId !== "string" || !Number.isInteger(item?.qty) || item.qty < 1 || item.qty > 20) return null;
    if (item.variantValues !== undefined && (!Array.isArray(item.variantValues) || item.variantValues.length > 3 || item.variantValues.some((value: unknown) => typeof value !== "string" || value.length > 60))) return null;
    lines.push({ productId: item.productId, qty: item.qty, ...(item.variantValues ? { variantValues: item.variantValues as string[] } : {}) });
  }
  return lines;
}

export function isDelivery(value: string): value is Delivery {
  return value in DELIVERY_OPTIONS;
}

export type AddressInput = { name: string; phone: string; address: string; suburb: string; state: string; postcode: string };

export type CheckoutInput = AddressInput & { email: string; delivery: Delivery; coupon: string; payment: PaymentMethod };

/** A delivery address: the shared part of checkout and the customer's saved addresses. */
export function validateAddress(form: FormData): { data?: AddressInput; errors: FieldErrors } {
  const errors: FieldErrors = {};
  const data = {
    name: str(form, "name", 100),
    phone: str(form, "phone", 20),
    address: str(form, "address"),
    suburb: str(form, "suburb", 80),
    state: str(form, "state", 3),
    postcode: str(form, "postcode", 4),
  };

  if (data.name.length < 2) errors.name = "Enter your full name.";
  if (!/^(\+?61|0)[2-478]\d{8}$/.test(data.phone.replace(/[\s()-]/g, ""))) errors.phone = "Enter an Australian phone number, e.g. 0412 345 678.";
  if (data.address.length < 5) errors.address = "Enter your street address.";
  if (data.suburb.length < 2) errors.suburb = "Enter your suburb.";
  if (!(AU_STATES as readonly string[]).includes(data.state)) errors.state = "Choose a state.";
  if (!/^\d{4}$/.test(data.postcode)) errors.postcode = "Postcodes are 4 digits.";

  return Object.keys(errors).length ? { errors } : { data, errors };
}

export function validateCheckout(form: FormData): { data?: CheckoutInput; errors: FieldErrors } {
  const address = validateAddress(form);
  const errors: FieldErrors = { ...address.errors };
  const email = str(form, "email").toLowerCase();
  const delivery = str(form, "delivery", 20);
  const coupon = str(form, "coupon", 20).toUpperCase();
  const payment = str(form, "payment", 20);

  if (!EMAIL_RE.test(email)) errors.email = "Enter a valid email address.";
  if (!isDelivery(delivery)) errors.delivery = "Choose a delivery option.";
  if (!isPaymentMethod(payment)) errors.payment = "Choose how you'd like to pay.";
  // Paying in store only makes sense when the order is picked up.
  else if (payment === "in_store" && delivery !== "collect") errors.payment = "Pay on pickup is only available with local pickup.";

  return address.data && isDelivery(delivery) && isPaymentMethod(payment) && !Object.keys(errors).length
    ? { data: { ...address.data, email, delivery, coupon, payment }, errors }
    : { errors };
}

function isPaymentMethod(value: string): value is PaymentMethod {
  return value in PAYMENT_METHODS;
}

export type BookingInput = { name: string; email: string; phone: string; city: string; vehicle: string; date: string; notes: string };

export function validateBooking(form: FormData): { data?: BookingInput; errors: FieldErrors } {
  const errors: FieldErrors = {};
  const data = {
    name: str(form, "name", 100),
    email: str(form, "email").toLowerCase(),
    phone: str(form, "phone", 20),
    city: str(form, "city", 30),
    vehicle: str(form, "vehicle", 80),
    date: str(form, "date", 10),
    notes: str(form, "notes", 1000),
  };

  if (data.name.length < 2) errors.name = "Enter your name.";
  if (!EMAIL_RE.test(data.email)) errors.email = "Enter a valid email address.";
  if (!/^(\+?61|0)[2-478]\d{8}$/.test(data.phone.replace(/[\s()-]/g, ""))) errors.phone = "Enter an Australian phone number.";
  if (!(FITTING_CITIES as readonly string[]).includes(data.city)) errors.city = "Choose a city.";
  if (data.vehicle.length < 2) errors.vehicle = "Tell us your make and model.";
  const day = new Date(`${data.date}T00:00:00`);
  const tomorrow = new Date();
  tomorrow.setHours(0, 0, 0, 0);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (Number.isNaN(day.getTime()) || day < tomorrow) errors.date = "Pick a date from tomorrow onwards.";
  else if (day.getDay() === 0) errors.date = "Our installers don't work Sundays.";

  return Object.keys(errors).length ? { errors } : { data, errors };
}

export type ReviewInput = { productId: string; name: string; rating: number; title: string; body: string; vehicle: string };

export function validateReview(form: FormData): { data?: ReviewInput; errors: FieldErrors } {
  const errors: FieldErrors = {};
  const data = {
    productId: str(form, "productId", 20),
    name: str(form, "name", 60),
    rating: Number(str(form, "rating", 1)),
    title: str(form, "title", 100),
    body: str(form, "body", 2000),
    vehicle: str(form, "vehicle", 80),
  };

  if (!Number.isInteger(data.rating) || data.rating < 1 || data.rating > 5) errors.rating = "Choose a star rating.";
  if (data.name.length < 2) errors.name = "Enter your name.";
  if (data.title.length < 3) errors.title = "Give your review a short title.";
  if (data.body.length < 20) errors.body = "Tell us a bit more (at least 20 characters).";

  return Object.keys(errors).length ? { errors } : { data, errors };
}
