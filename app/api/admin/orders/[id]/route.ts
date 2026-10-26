import { adminRoute, readJson } from "@/lib/server/admin/http";
import { AdminError, parseOrderStatus, parseShipment } from "@/lib/server/admin/validate";
import { deleteUnpaidOrder, listAdminOrders, setOrderStatus } from "@/lib/server/orders";

type Ctx = RouteContext<"/api/admin/orders/[id]">;

// Storefront order ids are UUIDs, so they're checked loosely rather than with the admin id pattern.
async function orderId(ctx: Ctx) {
  const { id } = await ctx.params;
  if (!/^[a-z0-9-]{1,64}$/i.test(id)) throw new AdminError("Invalid order id.");
  return id;
}

/** GET /api/admin/orders/:id */
export const GET = adminRoute(
  async (_request, ctx: Ctx) => {
    const [order] = await listAdminOrders({ id: await orderId(ctx) });
    if (!order) throw new AdminError("Order not found.", 404);
    return order;
  },
  { writes: false },
);

/**
 * PATCH /api/admin/orders/:id { status, carrier?, trackingNumber? }: cancelling restocks its items.
 * The carrier and tracking number are saved with it (a null carrier clears them).
 */
export const PATCH = adminRoute(async (request, ctx: Ctx) => {
  const body = await readJson(request);
  return setOrderStatus(await orderId(ctx), parseOrderStatus(body), parseShipment(body));
});

/** DELETE /api/admin/orders/:id: removes an unpaid pending or cancelled order. */
export const DELETE = adminRoute(async (_request, ctx: Ctx) => deleteUnpaidOrder(await orderId(ctx)));
