import "server-only";
import { randomUUID } from "node:crypto";
import { db } from "./db";
import type { ReviewInput } from "./validate";

export type Review = { id: string; createdAt: string; name: string; rating: number; title: string; body: string; vehicle: string | null };

/** Reviews written on CarBeat for one product, newest first. */
export function listReviews(productId: string): Review[] {
  return db
    .prepare("SELECT id, created_at AS createdAt, name, rating, title, body, vehicle FROM product_reviews WHERE product_id = ? ORDER BY created_at DESC LIMIT 50")
    .all(productId) as Review[];
}

/** Returns false when the product doesn't exist. */
export function addReview(input: ReviewInput): boolean {
  const exists = db.prepare("SELECT 1 FROM products WHERE id = ?").get(input.productId);
  if (!exists) return false;
  db.prepare("INSERT INTO product_reviews (id, product_id, name, rating, title, body, vehicle) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
    randomUUID(),
    input.productId,
    input.name,
    input.rating,
    input.title,
    input.body,
    input.vehicle || null,
  );
  return true;
}
