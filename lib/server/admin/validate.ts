import "server-only";
import type { AdminProduct, Coupon, CouponScope, CouponType, Department, Offer } from "@/lib/admin/model";
import { CATEGORY_LABELS } from "@/lib/data";
import type { Category, OrderStatus } from "@/lib/types";

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

export type ProductInput = Omit<AdminProduct, "slug">;

export function parseProduct(productId: string, value: unknown): ProductInput {
  const body = asBody(value);
  const price = int(body, "price", { min: 1, label: "Price" });
  const rrp = int(body, "rrp", { min: 1, label: "RRP" });
  if (rrp < price) throw new AdminError("RRP can't be below the price.");
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

const ORDER_STATUSES: readonly OrderStatus[] = ["pending_payment", "paid", "fulfilled", "cancelled"];

export function parseOrderStatus(value: unknown): OrderStatus {
  return oneOf(asBody(value), "status", ORDER_STATUSES);
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
