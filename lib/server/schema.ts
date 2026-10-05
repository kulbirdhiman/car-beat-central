import { index, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import type { CouponScope, CouponType } from "../admin/model";
import type { Category, OrderStatus } from "../types";

/**
 * Database schema, the source of truth for every table. After changing it, run `npm run db:generate`
 * to write a migration into drizzle/; migrations are applied automatically when the app starts.
 *
 * Money is stored in cents on orders and in whole AUD on products and coupons. Timestamps are ISO 8601 UTC text.
 * (No "server-only" import here: drizzle-kit loads this file outside Next.js.)
 */

const now = () => new Date().toISOString();

// Storefront ------------------------------------------------------------------------------------

export const products = sqliteTable(
  "products",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    brand: text("brand").notNull(),
    category: text("category").$type<Category>().notNull(),
    price: integer("price").notNull(),
    rrp: integer("rrp").notNull(),
    rating: real("rating").notNull(),
    reviews: integer("reviews").notNull(),
    /** Car model ids, or "universal". */
    fits: text("fits", { mode: "json" }).$type<string[] | "universal">().notNull(),
    badge: text("badge"),
    image: text("image").notNull(),
    description: text("description").notNull(),
    features: text("features", { mode: "json" }).$type<string[]>().notNull(),
    trendingRank: integer("trending_rank"),
    sku: text("sku").notNull().default(""),
    departmentId: text("department_id"),
    stock: integer("stock").notNull().default(0),
    status: text("status").$type<"active" | "draft">().notNull().default("active"),
    createdAt: text("created_at").notNull().$defaultFn(now),
  },
  (t) => [index("products_status_category").on(t.status, t.category)],
);

export const deals = sqliteTable("deals", {
  productId: text("product_id")
    .primaryKey()
    .references(() => products.id),
  dealPrice: integer("deal_price").notNull(),
  claimed: integer("claimed").notNull(),
});

export const orders = sqliteTable(
  "orders",
  {
    id: text("id").primaryKey(),
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
);

export const orderItems = sqliteTable(
  "order_items",
  {
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id),
    productId: text("product_id").notNull(),
    name: text("name").notNull(),
    unitPrice: integer("unit_price").notNull(),
    qty: integer("qty").notNull(),
  },
  (t) => [index("order_items_order").on(t.orderId)],
);

export const bookings = sqliteTable("bookings", {
  id: text("id").primaryKey(),
  createdAt: text("created_at").notNull().$defaultFn(now),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  city: text("city").notNull(),
  vehicle: text("vehicle").notNull(),
  preferredDate: text("preferred_date").notNull(),
  notes: text("notes"),
});

export const productReviews = sqliteTable(
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
);

export const subscribers = sqliteTable("subscribers", {
  email: text("email").primaryKey(),
  createdAt: text("created_at").notNull().$defaultFn(now),
});

// Admin -----------------------------------------------------------------------------------------

/** `position` columns hold the drag-and-drop display order. */
export const departments = sqliteTable(
  "departments",
  {
    id: text("id").primaryKey(),
    /** Set on sub-departments (one level deep), e.g. "Satnav Car Stereos" under "Car Stereos". */
    parentId: text("parent_id"),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description").notNull(),
    image: text("image").notNull(),
    active: integer("active", { mode: "boolean" }).notNull(),
    position: integer("position").notNull(),
    createdAt: text("created_at").notNull().$defaultFn(now),
  },
  (t) => [index("departments_parent").on(t.parentId, t.position)],
);

export const vehicleMakes = sqliteTable("vehicle_makes", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  country: text("country").notNull(),
  position: integer("position").notNull(),
  createdAt: text("created_at").notNull().$defaultFn(now),
});

export const vehicleModels = sqliteTable(
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
);

export const vehicleSubmodels = sqliteTable(
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
);

export const coupons = sqliteTable("coupons", {
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
  productIds: text("product_ids", { mode: "json" }).$type<string[]>().notNull(),
  departmentIds: text("department_ids", { mode: "json" }).$type<string[]>().notNull(),
  modelIds: text("model_ids", { mode: "json" }).$type<string[]>().notNull(),
  firstOrderOnly: integer("first_order_only", { mode: "boolean" }).notNull(),
  usageLimit: integer("usage_limit"),
  used: integer("used").notNull().default(0),
  /** YYYY-MM-DD. */
  startsAt: text("starts_at"),
  endsAt: text("ends_at"),
  active: integer("active", { mode: "boolean" }).notNull(),
  createdAt: text("created_at").notNull().$defaultFn(now),
});

export const offers = sqliteTable("offers", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  subtitle: text("subtitle").notNull(),
  highlight: text("highlight").notNull(),
  image: text("image").notNull(),
  href: text("href").notNull(),
  couponId: text("coupon_id").references(() => coupons.id, { onDelete: "set null" }),
  startsAt: text("starts_at"),
  endsAt: text("ends_at"),
  active: integer("active", { mode: "boolean" }).notNull(),
  position: integer("position").notNull(),
  createdAt: text("created_at").notNull().$defaultFn(now),
});
