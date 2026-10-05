import { adminRoute, readJson } from "@/lib/server/admin/http";
import { deleteOffer, saveOffer } from "@/lib/server/admin/promos";
import { id, parseOffer } from "@/lib/server/admin/validate";

type Ctx = RouteContext<"/api/admin/offers/[id]">;

/** PUT /api/admin/offers/:id: create or update. */
export const PUT = adminRoute(async (request, ctx: Ctx) => saveOffer(parseOffer(id((await ctx.params).id), await readJson(request))));

/** DELETE /api/admin/offers/:id */
export const DELETE = adminRoute(async (_request, ctx: Ctx) => deleteOffer(id((await ctx.params).id)));
