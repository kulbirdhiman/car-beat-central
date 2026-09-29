"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { isAdminAuthorized } from "@/lib/server/admin-auth";
import { db } from "@/lib/server/db";
import type { OrderStatus } from "@/lib/types";

const STATUSES: OrderStatus[] = ["pending_payment", "paid", "fulfilled", "cancelled"];

export async function updateOrderStatus(form: FormData) {
  // Server Actions can be POSTed directly, so re-check auth here, not just in the proxy.
  if (!isAdminAuthorized((await headers()).get("authorization"))) throw new Error("Unauthorized");

  const id = form.get("id");
  const status = form.get("status");
  if (typeof id !== "string" || !STATUSES.includes(status as OrderStatus)) throw new Error("Invalid input");

  db.prepare("UPDATE orders SET status = ? WHERE id = ?").run(status as string, id);
  revalidatePath("/admin");
}
