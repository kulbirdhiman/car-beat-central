import { adminRoute, readJson } from "@/lib/server/admin/http";
import { listOffers, reorderOffers } from "@/lib/server/admin/promos";
import { idOrder } from "@/lib/server/admin/validate";

/** GET /api/admin/offers, in display order. */
export const GET = adminRoute(() => listOffers(), { writes: false });

/** PATCH /api/admin/offers { ids }: sets the display order. */
export const PATCH = adminRoute(async (request) => reorderOffers(idOrder(await readJson(request))));
