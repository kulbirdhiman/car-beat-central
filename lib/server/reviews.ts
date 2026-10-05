import "server-only";
import { desc, eq, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "./db";
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

/** Returns false when the product doesn't exist. */
export function addReview(input: ReviewInput): boolean {
  const exists = db.select({ id: products.id }).from(products).where(eq(products.id, input.productId)).get();
  if (!exists) return false;
  db.insert(productReviews)
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
  return true;
}
