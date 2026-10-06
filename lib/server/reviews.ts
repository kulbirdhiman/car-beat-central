import "server-only";
import { desc, eq, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { AdminError } from "./admin/validate";
import { db, transaction } from "./db";
import { productReviews, products } from "./schema";
import type { ReviewInput } from "./validate";

export type Review = { id: string; createdAt: string; name: string; rating: number; title: string; body: string; vehicle: string | null };

const forProduct = db
  .select({
    id: productReviews.id,
    createdAt: productReviews.createdAt,
    name: productReviews.name,
    rating: productReviews.rating,
    title: productReviews.title,
    body: productReviews.body,
    vehicle: productReviews.vehicle,
  })
  .from(productReviews)
  .where(eq(productReviews.productId, sql.placeholder("productId")))
  .orderBy(desc(productReviews.createdAt))
  .limit(50)
  .prepare();

/** Reviews written on CarBeat for one product, newest first. */
export function listReviews(productId: string): Review[] {
  return forProduct.all({ productId });
}

/** Returns false when the product doesn't exist. The product's average rating and count include the new review. */
export function addReview(input: ReviewInput): boolean {
  return transaction((tx) => {
    const exists = tx.select({ id: products.id }).from(products).where(eq(products.id, input.productId)).get();
    if (!exists) return false;
    tx.insert(productReviews)
      .values({
        id: randomUUID(),
        productId: input.productId,
        name: input.name,
        rating: input.rating,
        title: input.title,
        body: input.body,
        vehicle: input.vehicle || null,
      })
      .run();
    tx.update(products)
      .set({
        rating: sql`ROUND((${products.rating} * ${products.reviews} + ${input.rating}) / (${products.reviews} + 1.0), 2)`,
        reviews: sql`${products.reviews} + 1`,
      })
      .where(eq(products.id, input.productId))
      .run();
    return true;
  });
}

export type AdminReview = Review & { productId: string; productName: string | null; productSlug: string | null };

/** Every written review for the admin panel, newest first. */
export function listAdminReviews(limit = 500): AdminReview[] {
  return db
    .select({
      id: productReviews.id,
      createdAt: productReviews.createdAt,
      name: productReviews.name,
      rating: productReviews.rating,
      title: productReviews.title,
      body: productReviews.body,
      vehicle: productReviews.vehicle,
      productId: productReviews.productId,
      productName: products.name,
      productSlug: products.slug,
    })
    .from(productReviews)
    .leftJoin(products, eq(products.id, productReviews.productId))
    .orderBy(desc(productReviews.createdAt))
    .limit(limit)
    .all();
}

/** Removes a review and takes it back out of the product's average rating and count. */
export function deleteReview(id: string) {
  transaction((tx) => {
    const review = tx.select({ productId: productReviews.productId, rating: productReviews.rating }).from(productReviews).where(eq(productReviews.id, id)).get();
    if (!review) throw new AdminError("Review not found.", 404);
    tx.delete(productReviews).where(eq(productReviews.id, id)).run();
    tx.update(products)
      .set({
        rating: sql`CASE WHEN ${products.reviews} <= 1 THEN 0 ELSE ROUND((${products.rating} * ${products.reviews} - ${review.rating}) / (${products.reviews} - 1.0), 2) END`,
        reviews: sql`MAX(0, ${products.reviews} - 1)`,
      })
      .where(eq(products.id, review.productId))
      .run();
  });
}
