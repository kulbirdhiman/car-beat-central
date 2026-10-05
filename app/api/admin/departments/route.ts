import { listDepartments, reorderDepartments } from "@/lib/server/admin/catalog";
import { adminRoute, readJson } from "@/lib/server/admin/http";
import { idOrder } from "@/lib/server/admin/validate";

/** GET /api/admin/departments, in display order. */
export const GET = adminRoute(() => listDepartments(), { writes: false });

/** PATCH /api/admin/departments { ids }: sets the display order. */
export const PATCH = adminRoute(async (request) => reorderDepartments(idOrder(await readJson(request))));
