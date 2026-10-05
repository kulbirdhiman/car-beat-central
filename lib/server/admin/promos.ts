import "server-only";
import { and, desc, eq, ne, sql } from "drizzle-orm";
import type { Coupon, Offer } from "@/lib/admin/model";
import { db } from "../db";
import { coupons, offers } from "../schema";
import { nextPosition, reorder } from "./catalog";
import { AdminError, type CouponInput } from "./validate";

const withoutId = <T extends { id: string }>(row: T): Omit<T, "id"> => {
  const copy: Partial<T> = { ...row };
  delete copy.id;
  return copy as Omit<T, "id">;
};

// Coupons ---------------------------------------------------------------------------------------

const byCode = db
  .select()
  .from(coupons)
  .where(eq(coupons.code, sql.placeholder("code")))
  .prepare();

export function listCoupons(): Coupon[] {
  return db.select().from(coupons).orderBy(desc(coupons.createdAt)).all();
}

/** The coupon a shopper typed at checkout, or null. Codes are case-insensitive. */
export function getCouponByCode(code: string): Coupon | null {
  return byCode.get({ code: code.trim().toUpperCase() }) ?? null;
}

/** Creates or updates. The usage count is only ever changed by orders, never by the form. */
export function saveCoupon(c: CouponInput): Coupon {
  if (db.select({ id: coupons.id }).from(coupons).where(and(eq(coupons.code, c.code), ne(coupons.id, c.id))).get()) {
    throw new AdminError("Another coupon already uses this code.", 409);
  }
  // On update, everything but the id; `used` and `createdAt` aren't in the input, so they're kept.
  return db.insert(coupons).values(c).onConflictDoUpdate({ target: coupons.id, set: withoutId(c) }).returning().get();
}

/** Offers that showed this coupon keep running, just without a code (the foreign key sets it to NULL). */
export function deleteCoupon(id: string) {
  if (db.delete(coupons).where(eq(coupons.id, id)).run().changes === 0) throw new AdminError("Coupon not found.", 404);
}

// Offers ----------------------------------------------------------------------------------------

const offerColumns = {
  id: offers.id,
  title: offers.title,
  subtitle: offers.subtitle,
  highlight: offers.highlight,
  image: offers.image,
  href: offers.href,
  couponId: offers.couponId,
  startsAt: offers.startsAt,
  endsAt: offers.endsAt,
  active: offers.active,
  createdAt: offers.createdAt,
};

export function listOffers(): Offer[] {
  return db.select(offerColumns).from(offers).orderBy(offers.position).all();
}

/** Creates or updates; new offers go last. */
export function saveOffer(o: Omit<Offer, "createdAt">): Offer {
  if (o.couponId && !db.select({ id: coupons.id }).from(coupons).where(eq(coupons.id, o.couponId)).get()) {
    throw new AdminError("That coupon doesn't exist.");
  }
  return db
    .insert(offers)
    .values({ ...o, position: nextPosition(offers) })
    .onConflictDoUpdate({ target: offers.id, set: withoutId(o) })
    .returning(offerColumns)
    .get();
}

export function deleteOffer(id: string) {
  if (db.delete(offers).where(eq(offers.id, id)).run().changes === 0) throw new AdminError("Offer not found.", 404);
}

export function reorderOffers(ids: string[]) {
  reorder(offers, ids);
  return listOffers();
}
