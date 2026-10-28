import { adminRoute, readJson } from "@/lib/server/admin/http";
import { AdminError, parseOrderInternalNote } from "@/lib/server/admin/validate";
import { updateOrderInternalNote } from "@/lib/server/orders";

type Ctx = RouteContext<"/api/admin/orders/[id]/note">;

export const PATCH = adminRoute(async (request, ctx: Ctx) => {
  const { id } = await ctx.params;
  if (!/^[a-z0-9-]{1,64}$/i.test(id)) throw new AdminError("Invalid order id.");
  const note = parseOrderInternalNote(await readJson(request));
  return updateOrderInternalNote(id, note);
});
