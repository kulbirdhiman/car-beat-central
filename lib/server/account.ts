import "server-only";
import { and, asc, desc, eq, inArray, ne, or } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import type { Customer } from "./customer";
import { db, transaction } from "./db";
import { customerAddresses, orderItems, orders } from "./schema";
import type { AddressInput } from "./validate";

export type SavedAddress = typeof customerAddresses.$inferSelect;

/** A customer's orders, newest first, with their items: ones placed while signed in, plus any placed with a verified email. */
export async function listCustomerOrders(customer: Customer, limit = 200) {
  const mine = customer.emails.length ? or(eq(orders.userId, customer.id), inArray(orders.email, customer.emails)) : eq(orders.userId, customer.id);
  const rows = await db.select().from(orders).where(mine).orderBy(desc(orders.createdAt)).limit(limit);
  if (rows.length === 0) return [];
  const items = await db
    .select({ orderId: orderItems.orderId, productId: orderItems.productId, name: orderItems.name, unitPrice: orderItems.unitPrice, qty: orderItems.qty })
    .from(orderItems)
    .where(
      inArray(
        orderItems.orderId,
        rows.map((o) => o.id),
      ),
    )
    .orderBy(orderItems.id);
  const itemsByOrder = Map.groupBy(items, (i) => i.orderId);
  return rows.map((o) => ({ ...o, items: itemsByOrder.get(o.id) ?? [] }));
}

export type CustomerOrder = Awaited<ReturnType<typeof listCustomerOrders>>[number];

/** Default address first, then oldest first. */
export function listAddresses(userId: string) {
  return db.select().from(customerAddresses).where(eq(customerAddresses.userId, userId)).orderBy(desc(customerAddresses.isDefault), asc(customerAddresses.createdAt));
}

export async function getDefaultAddress(userId: string): Promise<SavedAddress | null> {
  const [address] = await listAddresses(userId).limit(1);
  return address ?? null;
}

/**
 * Adds an address (`id` null) or updates one of the customer's own. A customer's first address is always the default.
 * Returns false if `id` isn't one of theirs.
 */
export async function saveAddress(userId: string, id: string | null, input: AddressInput, makeDefault: boolean) {
  // Picked field by field: callers may pass a whole checkout, which has more than an address.
  const { name, phone, address, suburb, state, postcode } = input;
  const data = { name, phone, address, suburb, state, postcode };
  return transaction(async (tx) => {
    const others = await tx.select({ id: customerAddresses.id }).from(customerAddresses).where(eq(customerAddresses.userId, userId)).for("update");
    if (id && !others.some((a) => a.id === id)) return false;
    const isDefault = makeDefault || others.length === 0 || (others.length === 1 && others[0].id === id);
    if (isDefault) await tx.update(customerAddresses).set({ isDefault: false }).where(eq(customerAddresses.userId, userId));
    if (id) {
      await tx
        .update(customerAddresses)
        .set({ ...data, ...(isDefault && { isDefault }) })
        .where(and(eq(customerAddresses.id, id), eq(customerAddresses.userId, userId)));
    } else {
      await tx.insert(customerAddresses).values({ id: randomUUID(), userId, ...data, isDefault });
    }
    return true;
  });
}

/** Deletes one of the customer's addresses. If it was the default, their oldest remaining address takes over. */
export async function deleteAddress(userId: string, id: string) {
  await transaction(async (tx) => {
    const [gone] = await tx
      .delete(customerAddresses)
      .where(and(eq(customerAddresses.id, id), eq(customerAddresses.userId, userId)))
      .returning({ isDefault: customerAddresses.isDefault });
    if (!gone?.isDefault) return;
    const [next] = await tx
      .select({ id: customerAddresses.id })
      .from(customerAddresses)
      .where(and(eq(customerAddresses.userId, userId), ne(customerAddresses.id, id)))
      .orderBy(asc(customerAddresses.createdAt))
      .limit(1);
    if (next) await tx.update(customerAddresses).set({ isDefault: true }).where(eq(customerAddresses.id, next.id));
  });
}

export async function setDefaultAddress(userId: string, id: string) {
  await transaction(async (tx) => {
    const [target] = await tx
      .select({ id: customerAddresses.id })
      .from(customerAddresses)
      .where(and(eq(customerAddresses.id, id), eq(customerAddresses.userId, userId)));
    if (!target) return;
    await tx.update(customerAddresses).set({ isDefault: false }).where(eq(customerAddresses.userId, userId));
    await tx.update(customerAddresses).set({ isDefault: true }).where(eq(customerAddresses.id, id));
  });
}

/** After a signed-in customer's first checkout, keeps that address so the next checkout is prefilled. */
export async function rememberFirstAddress(userId: string, data: AddressInput) {
  const [existing] = await db.select({ id: customerAddresses.id }).from(customerAddresses).where(eq(customerAddresses.userId, userId)).limit(1);
  if (!existing) await saveAddress(userId, null, data, true);
}
