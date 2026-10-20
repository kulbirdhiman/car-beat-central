import { adminRoute, readJson } from "@/lib/server/admin/http";
import { parseReturnResponse, uuid } from "@/lib/server/admin/validate";
import { listAdminOrders } from "@/lib/server/orders";
import { respondToReturn } from "@/lib/server/returns";

/**
 * PATCH /api/admin/returns/:id { action: "approve" | "reject", response }: answers a cancellation or return request
 * (approving a cancellation refunds and cancels the order) and returns the updated order.
 */
export const PATCH = adminRoute(async (request, ctx: RouteContext<"/api/admin/returns/[id]">) => {
  const { action, response } = parseReturnResponse(await readJson(request));
  const orderId = await respondToReturn(uuid((await ctx.params).id, "request"), action, response);
  const [order] = await listAdminOrders({ id: orderId });
  return order;
});
