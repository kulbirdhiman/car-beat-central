import "server-only";
import type { AdminProduct, Coupon, CouponScope, CouponType, Department, InvoiceInput, Offer, RefundInput } from "@/lib/admin/model";
import { AU_STATES, CATEGORY_LABELS } from "@/lib/data";
import { PAYMENT_METHODS, type PaymentMethod } from "@/lib/payment";
import { CARRIER_KEYS, type Shipment } from "@/lib/shipping";
import type { Category, OrderStatus, Spec } from "@/lib/types";
import { EMAIL_RE } from "../validate";

/**
 * Parses admin API request bodies. Every field is checked here, mirroring the admin forms,
 * because the API is callable directly. Failures throw AdminError, which becomes a 400.
 */

export class AdminError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
  }
}

type Body = Record<string, unknown>;

export function asBody(value: unknown): Body {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new AdminError("Expected a JSON object.");
  return value as Body;
}

/** Ids are short slugs: client-generated ("d-x7k2p9") or derived from names ("bmw-3-series"). */
export const ID_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;

export function id(value: unknown, label = "id"): string {
  if (typeof value !== "string" || !ID_RE.test(value)) throw new AdminError(`Invalid ${label}.`);
  return value;
}

function text(body: Body, key: string, { min = 0, max = 200, label = key } = {}): string {
  const value = body[key] ?? "";
  if (typeof value !== "string") throw new AdminError(`${label} must be text.`);
  const trimmed = value.trim();
  if (trimmed.length < min) throw new AdminError(min === 1 ? `${label} is required.` : `${label} needs at least ${min} characters.`);
  if (trimmed.length > max) throw new AdminError(`${label} can be at most ${max} characters.`);
  return trimmed;
}

function int(body: Body, key: string, { min = 0, max = 1_000_000, label = key } = {}): number {
  const value = body[key];
  if (!Number.isInteger(value) || (value as number) < min || (value as number) > max) throw new AdminError(`${label} must be a whole number from ${min} to ${max}.`);
  return value as number;
}

function optionalInt(body: Body, key: string, opts: { min?: number; max?: number; label?: string } = {}): number | null {
  return body[key] === null || body[key] === undefined ? null : int(body, key, opts);
}

function bool(body: Body, key: string): boolean {
  if (typeof body[key] !== "boolean") throw new AdminError(`${key} must be true or false.`);
  return body[key] as boolean;
}

function oneOf<T extends string>(body: Body, key: string, options: readonly T[]): T {
  const value = body[key];
  if (typeof value !== "string" || !options.includes(value as T)) throw new AdminError(`${key} must be one of: ${options.join(", ")}.`);
  return value as T;
}

function date(body: Body, key: string): string | null {
  const value = body[key];
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value))) throw new AdminError(`${key} must be a YYYY-MM-DD date.`);
  return value;
}

/** A store image: a site path ("/images/x.jpg") or an https URL. */
function image(body: Body, key: string): string {
  const value = text(body, key, { min: 1, max: 500, label: "Image" });
  if (!value.startsWith("/") && !/^https:\/\/\S+$/.test(value)) throw new AdminError("Image must be a site path starting with / or an https URL.");
  return value;
}

function idList(body: Body, key: string): string[] {
  const value = body[key] ?? [];
  if (!Array.isArray(value) || value.length > 500) throw new AdminError(`${key} must be a list of ids.`);
  return [...new Set(value.map((v) => id(v, key)))];
}

export function idOrder(value: unknown): string[] {
  const body = asBody(value);
  const ids = idList(body, "ids");
  if (ids.length === 0) throw new AdminError("ids must list at least one id.");
  return ids;
}

export function parseDepartment(departmentId: string, value: unknown): Omit<Department, "createdAt"> {
  const body = asBody(value);
  const slug = text(body, "slug", { min: 1, max: 80, label: "URL slug" });
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) throw new AdminError("URL slug can only use lowercase letters, numbers and dashes.");
  return {
    id: departmentId,
    parentId: body.parentId == null || body.parentId === "" ? null : id(body.parentId, "parent department"),
    name: text(body, "name", { min: 2, max: 80, label: "Name" }),
    slug,
    description: text(body, "description", { max: 500 }),
    image: image(body, "image"),
    active: bool(body, "active"),
  };
}

export type ProductInput = Omit<AdminProduct, "slug" | "rating" | "reviews">;

export function parseProduct(productId: string, value: unknown): ProductInput {
  const body = asBody(value);
  const price = int(body, "price", { min: 1, label: "Price" });
  const rrp = int(body, "rrp", { min: 1, label: "RRP" });
  if (rrp < price) throw new AdminError("RRP can't be below the price.");
  const dealPrice = body.dealPrice === null || body.dealPrice === undefined ? null : int(body, "dealPrice", { min: 1, label: "Deal price" });
  if (dealPrice !== null && dealPrice >= price) throw new AdminError("Deal price must be below the price.");
  const features = body.features ?? [];
  if (!Array.isArray(features) || features.length > 12 || features.some((f) => typeof f !== "string" || f.trim().length === 0 || f.length > 200)) {
    throw new AdminError("Features must be up to 12 lines of at most 200 characters.");
  }
  const specs = body.specs ?? [];
  if (
    !Array.isArray(specs) ||
    specs.length > 30 ||
    specs.some(
      (row) =>
        !Array.isArray(row) ||
        row.length !== 2 ||
        row.some((v) => typeof v !== "string") ||
        !row[0].trim() ||
        !row[1].trim() ||
        row[0].length > 60 ||
        row[1].length > 200,
    )
  ) {
    throw new AdminError("Specifications must be up to 30 rows, each a name (60 characters) and a value (200 characters).");
  }
  const addOnIds = idList(body, "addOnIds").filter((a) => a !== productId);
  if (addOnIds.length > 12) throw new AdminError("Pick at most 12 add-ons.");
  let fits: AdminProduct["fits"];
  if (body.fits === "universal") fits = "universal";
  else {
    fits = idList(body, "fits");
    if (fits.length === 0) throw new AdminError("Pick at least one vehicle model, or mark the product universal.");
  }
  return {
    id: productId,
    name: text(body, "name", { min: 2, max: 120, label: "Name" }),
    sku: text(body, "sku", { min: 1, max: 40, label: "SKU" }).toUpperCase(),
    brand: text(body, "brand", { min: 1, max: 60, label: "Brand" }),
    departmentId: id(body.departmentId, "department"),
    category: oneOf(body, "category", Object.keys(CATEGORY_LABELS) as Category[]),
    price,
    rrp,
    stock: int(body, "stock", { label: "Stock" }),
    status: oneOf(body, "status", ["active", "draft"] as const),
    fits,
    image: image(body, "image"),
    description: text(body, "description", { max: 2000 }),
    badge: text(body, "badge", { max: 30, label: "Badge" }),
    features: features.map((f: string) => f.trim()),
    specs: specs.map(([label, value]: Spec) => [label.trim(), value.trim()] as Spec),
    addOnIds,
    dealPrice,
    trending: body.trending === true,
  };
}

export type VehicleLevel = "makes" | "models" | "submodels";
export const VEHICLE_LEVELS: readonly VehicleLevel[] = ["makes", "models", "submodels"];

export function vehicleLevel(value: string): VehicleLevel {
  if (!VEHICLE_LEVELS.includes(value as VehicleLevel)) throw new AdminError("Unknown vehicle level.", 404);
  return value as VehicleLevel;
}

export type VehicleInput = { id: string; parentId: string | null; name: string; description: string; extra: string };

export function parseVehicle(level: VehicleLevel, vehicleId: string, value: unknown): VehicleInput {
  const body = asBody(value);
  return {
    id: vehicleId,
    parentId: level === "makes" ? null : id(body.parentId, "parent"),
    name: text(body, "name", { min: 1, max: 80, label: "Name" }),
    description: text(body, "description", { max: 500 }),
    // Country for makes, years for sub-models; unused for models.
    extra: level === "models" ? "" : text(body, level === "makes" ? "country" : "years", { max: 60 }),
  };
}

// "refunded" isn't here: an order gets it by being refunded in full.
const ORDER_STATUSES: readonly OrderStatus[] = ["pending_payment", "paid", "fulfilled", "cancelled"];

export function parseOrderStatus(value: unknown): OrderStatus {
  return oneOf(asBody(value), "status", ORDER_STATUSES);
}

export function parseRefund(value: unknown): RefundInput {
  const body = asBody(value);
  const restock = body.restock ?? [];
  if (!Array.isArray(restock) || restock.length > 50) throw new AdminError("restock must be a list of items.");
  return {
    amount: int(body, "amount", { min: 1, max: 100_000_000, label: "Refund amount" }),
    reason: text(body, "reason", { min: 1, max: 300, label: "Reason" }),
    restock: restock.map((raw) => {
      const item = asBody(raw);
      return { productId: id(item.productId, "product"), qty: int(item, "qty", { max: 1000, label: "Restock quantity" }) };
    }),
    returnId: body.returnId == null ? undefined : uuid(body.returnId, "request"),
  };
}

/** An admin's answer to a cancellation or return request. */
export function parseReturnResponse(value: unknown): { action: "approve" | "reject"; response: string } {
  const body = asBody(value);
  return { action: oneOf(body, "action", ["approve", "reject"] as const), response: text(body, "response", { max: 1000, label: "Message" }) };
}

/** Ids the server generates with randomUUID (orders, return requests). */
export function uuid(value: unknown, label = "id"): string {
  if (typeof value !== "string" || !/^[0-9a-f-]{36}$/.test(value)) throw new AdminError(`Invalid ${label}.`);
  return value;
}

/** The carrier and tracking number sent with a status change: undefined when not sent, null to clear them. */
export function parseShipment(value: unknown): Shipment | null | undefined {
  const body = asBody(value);
  if (body.carrier === undefined) return undefined;
  if (body.carrier === null) return null;
  const carrier = oneOf(body, "carrier", CARRIER_KEYS);
  const trackingNumber = text(body, "trackingNumber", { min: 1, max: 60, label: "Tracking number" });
  if (!/^[A-Za-z0-9][A-Za-z0-9 -]*$/.test(trackingNumber)) throw new AdminError("Tracking numbers can only have letters, numbers, spaces and dashes.");
  return { carrier, trackingNumber };
}

export function parseInvoice(value: unknown): InvoiceInput {
  const body = asBody(value);
  const customer = asBody(body.customer);
  const shipTo = asBody(body.shipTo);
  const email = text(customer, "email", { min: 1, max: 200, label: "Email" }).toLowerCase();
  if (!EMAIL_RE.test(email)) throw new AdminError("Enter a valid email address.");
  const postcode = text(shipTo, "postcode", { min: 1, max: 4, label: "Postcode" });
  if (!/^\d{4}$/.test(postcode)) throw new AdminError("Postcodes are 4 digits.");

  if (!Array.isArray(body.items) || body.items.length === 0) throw new AdminError("Add at least one product.");
  if (body.items.length > 50) throw new AdminError("An invoice can have at most 50 lines.");
  const items = body.items.map((raw) => {
    const item = asBody(raw);
    return {
      productId: id(item.productId, "product"),
      unitPrice: int(item, "unitPrice", { max: 10_000_000, label: "Unit price" }),
      qty: int(item, "qty", { min: 1, max: 999, label: "Quantity" }),
    };
  });
  if (new Set(items.map((i) => i.productId)).size !== items.length) throw new AdminError("Each product can only be listed once.");

  const methods = body.paymentMethods;
  const allMethods = Object.keys(PAYMENT_METHODS) as PaymentMethod[];
  if (!Array.isArray(methods) || methods.some((m) => !allMethods.includes(m))) throw new AdminError("Unknown payment method.");
  const paid = bool(body, "paid");
  if (!paid && methods.length === 0) throw new AdminError("Choose at least one way to pay.");

  return {
    customer: { name: text(customer, "name", { min: 1, max: 100, label: "Name" }), email, phone: text(customer, "phone", { min: 1, max: 20, label: "Phone" }) },
    shipTo: {
      address: text(shipTo, "address", { min: 1, max: 200, label: "Address" }),
      suburb: text(shipTo, "suburb", { min: 1, max: 100, label: "Suburb" }),
      state: oneOf(shipTo, "state", AU_STATES),
      postcode,
    },
    delivery: oneOf(body, "delivery", ["standard", "express", "collect"] as const),
    items,
    shipping: int(body, "shipping", { max: 1_000_000, label: "Shipping" }),
    discount: int(body, "discount", { max: 100_000_000, label: "Discount" }),
    paymentMethods: [...new Set(methods as PaymentMethod[])],
    paid,
    note: text(body, "note", { max: 1000, label: "Note" }),
  };
}

const COUPON_TYPES: readonly CouponType[] = ["percent", "fixed", "free_shipping", "buy_x_get_y"];
const COUPON_SCOPES: readonly CouponScope[] = ["all", "products", "departments", "models"];

export type CouponInput = Omit<Coupon, "used" | "createdAt">;

export function parseCoupon(couponId: string, value: unknown): CouponInput {
  const body = asBody(value);
  const code = text(body, "code", { min: 1, max: 20, label: "Code" }).toUpperCase();
  if (!/^[A-Z0-9]{3,20}$/.test(code)) throw new AdminError("Code must be 3–20 letters and numbers, no spaces.");
  const type = oneOf(body, "type", COUPON_TYPES);
  const scope = oneOf(body, "scope", COUPON_SCOPES);
  const startsAt = date(body, "startsAt");
  const endsAt = date(body, "endsAt");
  if (startsAt && endsAt && endsAt < startsAt) throw new AdminError("The coupon ends before it starts.");

  const coupon: CouponInput = {
    id: couponId,
    code,
    description: text(body, "description", { max: 200 }),
    type,
    value: type === "percent" ? int(body, "value", { min: 1, max: 100, label: "Percent off" }) : type === "fixed" ? int(body, "value", { min: 1, label: "Amount off" }) : 0,
    buyQty: type === "buy_x_get_y" ? int(body, "buyQty", { min: 1, max: 100, label: "Buy quantity" }) : 0,
    getQty: type === "buy_x_get_y" ? int(body, "getQty", { min: 1, max: 100, label: "Free quantity" }) : 0,
    minOrder: int(body, "minOrder", { label: "Minimum order" }),
    maxDiscount: type === "percent" || type === "buy_x_get_y" ? optionalInt(body, "maxDiscount", { min: 1, label: "Maximum discount" }) : null,
    scope,
    productIds: scope === "products" ? idList(body, "productIds") : [],
    departmentIds: scope === "departments" ? idList(body, "departmentIds") : [],
    modelIds: scope === "models" ? idList(body, "modelIds") : [],
    firstOrderOnly: bool(body, "firstOrderOnly"),
    usageLimit: optionalInt(body, "usageLimit", { min: 1, label: "Usage limit" }),
    startsAt,
    endsAt,
    active: bool(body, "active"),
  };
  const picked = { all: 1, products: coupon.productIds.length, departments: coupon.departmentIds.length, models: coupon.modelIds.length }[scope];
  if (picked === 0) throw new AdminError("Pick at least one item for the coupon to apply to.");
  return coupon;
}

export function parseOffer(offerId: string, value: unknown): Omit<Offer, "createdAt"> {
  const body = asBody(value);
  const href = text(body, "href", { min: 1, max: 300, label: "Link" });
  if (!href.startsWith("/") || href.startsWith("//")) throw new AdminError("Link must be a store path starting with /, e.g. /shop?category=lighting.");
  const startsAt = date(body, "startsAt");
  const endsAt = date(body, "endsAt");
  if (startsAt && endsAt && endsAt < startsAt) throw new AdminError("The offer ends before it starts.");
  return {
    id: offerId,
    title: text(body, "title", { min: 3, max: 100, label: "Title" }),
    subtitle: text(body, "subtitle", { max: 200 }),
    highlight: text(body, "highlight", { min: 1, max: 30, label: "Highlight" }),
    image: image(body, "image"),
    href,
    couponId: body.couponId === null || body.couponId === undefined ? null : id(body.couponId, "coupon"),
    startsAt,
    endsAt,
    active: bool(body, "active"),
  };
}
