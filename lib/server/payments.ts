import "server-only";
import { getOrder } from "./orders";

/** A payment problem whose message is safe to show the shopper. */
export class PaymentError extends Error {}

/** The order, if it can still be paid. */
export async function payableOrder(orderId: string) {
  const order = await getOrder(orderId);
  if (!order) throw new PaymentError("We couldn't find that order.");
  if (order.status === "paid" || order.status === "fulfilled") throw new PaymentError("This order has already been paid.");
  if (order.status === "cancelled") throw new PaymentError("This order was cancelled, so it can't be paid.");
  return order;
}
