import "server-only";
import { and, desc, eq, ne } from "drizzle-orm";
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

export function listCoupons(): Promise<Coupon[]> {
  return db.select().from(coupons).orderBy(desc(coupons.createdAt));
}

/** The coupon a shopper typed at checkout, or null. Codes are case-insensitive. */
export async function getCouponByCode(code: string): Promise<Coupon | null> {
  const [coupon] = await db
    .select()
    .from(coupons)
    .where(eq(coupons.code, code.trim().toUpperCase()));
  return coupon ?? null;
}

/** Creates or updates. The usage count is only ever changed by orders, never by the form. */
export async function saveCoupon(c: CouponInput): Promise<Coupon> {
  const [clash] = await db.select({ id: coupons.id }).from(coupons).where(and(eq(coupons.code, c.code), ne(coupons.id, c.id)));
  if (clash) throw new AdminError("Another coupon already uses this code.", 409);
  // On update, everything but the id; `used` and `createdAt` aren't in the input, so they're kept.
  const [saved] = await db.insert(coupons).values(c).onConflictDoUpdate({ target: coupons.id, set: withoutId(c) }).returning();
  return saved;
}

/** Offers that showed this coupon keep running, just without a code (the foreign key sets it to NULL). */
export async function deleteCoupon(id: string) {
  const deleted = await db.delete(coupons).where(eq(coupons.id, id)).returning({ id: coupons.id });
  if (deleted.length === 0) throw new AdminError("Coupon not found.", 404);
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

export function listOffers(): Promise<Offer[]> {
  return db.select(offerColumns).from(offers).orderBy(offers.position);
}

/** Creates or updates; new offers go last. */
export async function saveOffer(o: Omit<Offer, "createdAt">): Promise<Offer> {
  if (o.couponId) {
    const [coupon] = await db.select({ id: coupons.id }).from(coupons).where(eq(coupons.id, o.couponId));
    if (!coupon) throw new AdminError("That coupon doesn't exist.");
  }
  const [saved] = await db
    .insert(offers)
    .values({ ...o, position: nextPosition(offers) })
    .onConflictDoUpdate({ target: offers.id, set: withoutId(o) })
    .returning(offerColumns);
  return saved;
}

export async function deleteOffer(id: string) {
  const deleted = await db.delete(offers).where(eq(offers.id, id)).returning({ id: offers.id });
  if (deleted.length === 0) throw new AdminError("Offer not found.", 404);
}

export async function reorderOffers(ids: string[]) {
  await reorder(offers, ids);
  return listOffers();
}
