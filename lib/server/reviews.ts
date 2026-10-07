import "server-only";
import { desc, eq, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { AdminError } from "./admin/validate";
import { db, transaction } from "./db";
import { productReviews, products } from "./schema";
import type { ReviewInput } from "./validate";

export type Review = { id: string; createdAt: string; name: string; rating: number; title: string; body: string; vehicle: string | null };

/** Reviews written on CarBeat for one product, newest first. */
export function listReviews(productId: string): Promise<Review[]> {
  return db
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
    .where(eq(productReviews.productId, productId))
    .orderBy(desc(productReviews.createdAt))
    .limit(50);
}

/** Returns false when the product doesn't exist. The product's average rating and count include the new review. */
export function addReview(input: ReviewInput): Promise<boolean> {
  return transaction(async (tx) => {
    // Locks the product row, so concurrent reviews each see the other's rating.
    const [exists] = await tx.select({ id: products.id }).from(products).where(eq(products.id, input.productId)).for("update");
    if (!exists) return false;
    await tx.insert(productReviews)
      .values({
        id: randomUUID(),
        productId: input.productId,
        name: input.name,
        rating: input.rating,
        title: input.title,
        body: input.body,
        vehicle: input.vehicle || null,
      });
    await tx
      .update(products)
      .set({
        rating: sql`ROUND(((${products.rating} * ${products.reviews} + ${input.rating}) / (${products.reviews} + 1.0))::numeric, 2)`,
        reviews: sql`${products.reviews} + 1`,
      })
      .where(eq(products.id, input.productId));
    return true;
  });
}

export type AdminReview = Review & { productId: string; productName: string | null; productSlug: string | null };

/** Every written review for the admin panel, newest first. */
export function listAdminReviews(limit = 500): Promise<AdminReview[]> {
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
    .limit(limit);
}

/** Removes a review and takes it back out of the product's average rating and count. */
export async function deleteReview(id: string) {
  await transaction(async (tx) => {
    const [review] = await tx
      .delete(productReviews)
      .where(eq(productReviews.id, id))
      .returning({ productId: productReviews.productId, rating: productReviews.rating });
    if (!review) throw new AdminError("Review not found.", 404);
    await tx
      .update(products)
      .set({
        rating: sql`CASE WHEN ${products.reviews} <= 1 THEN 0 ELSE ROUND(((${products.rating} * ${products.reviews} - ${review.rating}) / (${products.reviews} - 1.0))::numeric, 2) END`,
        reviews: sql`GREATEST(0, ${products.reviews} - 1)`,
      })
      .where(eq(products.id, review.productId));
  });
}
