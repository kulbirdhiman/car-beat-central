import { deleteDepartment, saveDepartment } from "@/lib/server/admin/catalog";
import { adminRoute, readJson } from "@/lib/server/admin/http";
import { id, parseDepartment } from "@/lib/server/admin/validate";

type Ctx = RouteContext<"/api/admin/departments/[id]">;

/** PUT /api/admin/departments/:id: create or update. */
export const PUT = adminRoute(async (request, ctx: Ctx) => saveDepartment(parseDepartment(id((await ctx.params).id), await readJson(request))));

/** DELETE /api/admin/departments/:id: its products become unassigned. */
export const DELETE = adminRoute(async (_request, ctx: Ctx) => deleteDepartment(id((await ctx.params).id)));
