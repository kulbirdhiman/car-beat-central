import { adminRoute, readJson } from "@/lib/server/admin/http";
import { deleteCoupon, saveCoupon } from "@/lib/server/admin/promos";
import { id, parseCoupon } from "@/lib/server/admin/validate";

type Ctx = RouteContext<"/api/admin/coupons/[id]">;

/** PUT /api/admin/coupons/:id: create or update. The usage count can't be set here. */
export const PUT = adminRoute(async (request, ctx: Ctx) => saveCoupon(parseCoupon(id((await ctx.params).id), await readJson(request))));

/** DELETE /api/admin/coupons/:id: offers showing it keep running without a code. */
export const DELETE = adminRoute(async (_request, ctx: Ctx) => deleteCoupon(id((await ctx.params).id)));
