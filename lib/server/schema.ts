import { boolean, doublePrecision, index, integer, jsonb, pgTable, text } from "drizzle-orm/pg-core";
import type { CouponScope, CouponType } from "../admin/model";
import type { Category, OrderStatus } from "../types";

/**
 * Database schema, the source of truth for every table. After changing it, run `npm run db:generate`
 * to write a migration into drizzle/, then `npm run db:migrate` to apply it to the Supabase database.
 *
 * Money is stored in cents on orders and in whole AUD on products and coupons. Timestamps are ISO 8601 UTC text.
 * Every table has row level security on with no policies, so Supabase's public API (anon key) can't read or write
 * them; the app connects as the database owner, which bypasses it.
 * (No "server-only" import here: drizzle-kit loads this file outside Next.js.)
 */

const now = () => new Date().toISOString();

// Storefront ------------------------------------------------------------------------------------

export const products = pgTable(
  "products",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    brand: text("brand").notNull(),
    category: text("category").$type<Category>().notNull(),
    price: integer("price").notNull(),
    rrp: integer("rrp").notNull(),
    rating: doublePrecision("rating").notNull(),
    reviews: integer("reviews").notNull(),
    /** Car model ids, or "universal". */
    fits: jsonb("fits").$type<string[] | "universal">().notNull(),
    badge: text("badge"),
    image: text("image").notNull(),
    description: text("description").notNull(),
    features: jsonb("features").$type<string[]>().notNull(),
    trendingRank: integer("trending_rank"),
    sku: text("sku").notNull().default(""),
    departmentId: text("department_id"),
    stock: integer("stock").notNull().default(0),
    status: text("status").$type<"active" | "draft">().notNull().default("active"),
    createdAt: text("created_at").notNull().$defaultFn(now),
  },
  (t) => [index("products_status_category").on(t.status, t.category)],
).enableRLS();

export const deals = pgTable("deals", {
  productId: text("product_id")
    .primaryKey()
    .references(() => products.id),
  dealPrice: integer("deal_price").notNull(),
  claimed: integer("claimed").notNull(),
}).enableRLS();

export const orders = pgTable(
  "orders",
  {
    id: text("id").primaryKey(),
    /** Shown to admins as CB-1001, CB-1002, ... */
    number: integer("number").notNull().generatedAlwaysAsIdentity({ startWith: 1001 }),
    createdAt: text("created_at").notNull().$defaultFn(now),
    status: text("status").$type<OrderStatus>().notNull(),
    email: text("email").notNull(),
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    address: text("address").notNull(),
    suburb: text("suburb").notNull(),
    state: text("state").notNull(),
    postcode: text("postcode").notNull(),
    delivery: text("delivery").$type<"standard" | "express" | "collect">().notNull(),
    coupon: text("coupon"),
    subtotal: integer("subtotal").notNull(),
    discount: integer("discount").notNull(),
    shipping: integer("shipping").notNull(),
    total: integer("total").notNull(),
  },
  (t) => [index("orders_created").on(t.createdAt), index("orders_email").on(t.email)],
).enableRLS();

export const orderItems = pgTable(
  "order_items",
  {
    /** Keeps each order's items in the order they were added. */
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id),
    productId: text("product_id").notNull(),
    name: text("name").notNull(),
    unitPrice: integer("unit_price").notNull(),
    qty: integer("qty").notNull(),
  },
  (t) => [index("order_items_order").on(t.orderId)],
).enableRLS();

export const bookings = pgTable("bookings", {
  id: text("id").primaryKey(),
  createdAt: text("created_at").notNull().$defaultFn(now),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  city: text("city").notNull(),
  vehicle: text("vehicle").notNull(),
  preferredDate: text("preferred_date").notNull(),
  notes: text("notes"),
}).enableRLS();

export const productReviews = pgTable(
  "product_reviews",
  {
    id: text("id").primaryKey(),
    createdAt: text("created_at").notNull().$defaultFn(now),
    productId: text("product_id")
      .notNull()
      .references(() => products.id),
    name: text("name").notNull(),
    rating: integer("rating").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    vehicle: text("vehicle"),
  },
  (t) => [index("product_reviews_product").on(t.productId, t.createdAt)],
).enableRLS();

export const subscribers = pgTable("subscribers", {
  email: text("email").primaryKey(),
  createdAt: text("created_at").notNull().$defaultFn(now),
}).enableRLS();

// Admin -----------------------------------------------------------------------------------------

/** `position` columns hold the drag-and-drop display order. */
export const departments = pgTable(
  "departments",
  {
    id: text("id").primaryKey(),
    /** Set on sub-departments (one level deep), e.g. "Satnav Car Stereos" under "Car Stereos". */
    parentId: text("parent_id"),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description").notNull(),
    image: text("image").notNull(),
    active: boolean("active").notNull(),
    position: integer("position").notNull(),
    createdAt: text("created_at").notNull().$defaultFn(now),
  },
  (t) => [index("departments_parent").on(t.parentId, t.position)],
).enableRLS();

export const vehicleMakes = pgTable("vehicle_makes", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  country: text("country").notNull(),
  position: integer("position").notNull(),
  createdAt: text("created_at").notNull().$defaultFn(now),
}).enableRLS();

export const vehicleModels = pgTable(
  "vehicle_models",
  {
    id: text("id").primaryKey(),
    makeId: text("make_id")
      .notNull()
      .references(() => vehicleMakes.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description").notNull(),
    position: integer("position").notNull(),
    createdAt: text("created_at").notNull().$defaultFn(now),
  },
  (t) => [index("vehicle_models_make").on(t.makeId, t.position)],
).enableRLS();

export const vehicleSubmodels = pgTable(
  "vehicle_submodels",
  {
    id: text("id").primaryKey(),
    modelId: text("model_id")
      .notNull()
      .references(() => vehicleModels.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description").notNull(),
    years: text("years").notNull(),
    position: integer("position").notNull(),
    createdAt: text("created_at").notNull().$defaultFn(now),
  },
  (t) => [index("vehicle_submodels_model").on(t.modelId, t.position)],
).enableRLS();

export const coupons = pgTable("coupons", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  description: text("description").notNull(),
  type: text("type").$type<CouponType>().notNull(),
  value: integer("value").notNull(),
  buyQty: integer("buy_qty").notNull(),
  getQty: integer("get_qty").notNull(),
  /** Whole AUD. */
  minOrder: integer("min_order").notNull(),
  /** Whole AUD; null = no cap. */
  maxDiscount: integer("max_discount"),
  scope: text("scope").$type<CouponScope>().notNull(),
  productIds: jsonb("product_ids").$type<string[]>().notNull(),
  departmentIds: jsonb("department_ids").$type<string[]>().notNull(),
  modelIds: jsonb("model_ids").$type<string[]>().notNull(),
  firstOrderOnly: boolean("first_order_only").notNull(),
  usageLimit: integer("usage_limit"),
  used: integer("used").notNull().default(0),
  /** YYYY-MM-DD. */
  startsAt: text("starts_at"),
  endsAt: text("ends_at"),
  active: boolean("active").notNull(),
  createdAt: text("created_at").notNull().$defaultFn(now),
}).enableRLS();

export const offers = pgTable("offers", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  subtitle: text("subtitle").notNull(),
  highlight: text("highlight").notNull(),
  image: text("image").notNull(),
  href: text("href").notNull(),
  couponId: text("coupon_id").references(() => coupons.id, { onDelete: "set null" }),
  startsAt: text("starts_at"),
  endsAt: text("ends_at"),
  active: boolean("active").notNull(),
  position: integer("position").notNull(),
  createdAt: text("created_at").notNull().$defaultFn(now),
}).enableRLS();
