import { deleteProduct, saveProduct } from "@/lib/server/admin/catalog";
import { adminRoute, readJson } from "@/lib/server/admin/http";
import { id, parseProduct } from "@/lib/server/admin/validate";

type Ctx = RouteContext<"/api/admin/products/[id]">;

/** PUT /api/admin/products/:id: create or update. Returns the saved product, including its store slug. */
export const PUT = adminRoute(async (request, ctx: Ctx) => saveProduct(parseProduct(id((await ctx.params).id), await readJson(request))));

/** DELETE /api/admin/products/:id */
export const DELETE = adminRoute(async (_request, ctx: Ctx) => deleteProduct(id((await ctx.params).id)));
