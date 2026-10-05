import { adminRoute, readJson } from "@/lib/server/admin/http";
import { id, parseVehicle, vehicleLevel } from "@/lib/server/admin/validate";
import { deleteVehicle, saveVehicle } from "@/lib/server/admin/vehicles";

type Ctx = RouteContext<"/api/admin/vehicles/[level]/[id]">;

/**
 * PUT /api/admin/vehicles/{makes|models|submodels}/:id: create or update.
 * Body: { name, description, country } for makes, { parentId, name, description } for models,
 * { parentId, name, description, years } for sub-models.
 */
export const PUT = adminRoute(async (request, ctx: Ctx) => {
  const params = await ctx.params;
  const level = vehicleLevel(params.level);
  saveVehicle(level, parseVehicle(level, id(params.id), await readJson(request)));
});

/** DELETE /api/admin/vehicles/{level}/:id: deletes everything beneath it and removes product fitment to deleted models. */
export const DELETE = adminRoute(async (_request, ctx: Ctx) => {
  const params = await ctx.params;
  deleteVehicle(vehicleLevel(params.level), id(params.id));
});
