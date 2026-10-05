import { adminRoute, readJson } from "@/lib/server/admin/http";
import { idOrder, vehicleLevel } from "@/lib/server/admin/validate";
import { reorderVehicles } from "@/lib/server/admin/vehicles";

/** PATCH /api/admin/vehicles/{makes|models|submodels} { ids }: sets the display order among siblings. */
export const PATCH = adminRoute(async (request, ctx: RouteContext<"/api/admin/vehicles/[level]">) =>
  reorderVehicles(vehicleLevel((await ctx.params).level), idOrder(await readJson(request))),
);
