import { adminRoute } from "@/lib/server/admin/http";
import { listVehicleMakes } from "@/lib/server/admin/vehicles";

/** GET /api/admin/vehicles: makes with their models and sub-models, in display order. */
export const GET = adminRoute(() => listVehicleMakes(), { writes: false });
