import { adminRoute, readJson } from "@/lib/server/admin/http";
import { AdminError, parseRefund } from "@/lib/server/admin/validate";
import { listAdminOrders } from "@/lib/server/orders";
import { refundOrder } from "@/lib/server/returns";

/**
 * POST /api/admin/orders/:id/refunds { amount, reason, restock, returnId? }: records a refund the admin paid back themselves,
 * updates the order's status, restocks the chosen items, and returns the updated order.
 */
export const POST = adminRoute(async (request, ctx: RouteContext<"/api/admin/orders/[id]/refunds">) => {
  const { id } = await ctx.params;
  if (!/^[a-z0-9-]{1,64}$/i.test(id)) throw new AdminError("Invalid order id.");
  await refundOrder(id, parseRefund(await readJson(request)));
  const [order] = await listAdminOrders({ id });
  return order;
});
