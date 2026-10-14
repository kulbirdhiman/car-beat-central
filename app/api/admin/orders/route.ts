import { adminRoute, readJson } from "@/lib/server/admin/http";
import { parseInvoice } from "@/lib/server/admin/validate";
import { createInvoice, listAdminOrders } from "@/lib/server/orders";

/** GET /api/admin/orders: newest first, with items. */
export const GET = adminRoute(() => listAdminOrders(), { writes: false });

/** POST /api/admin/orders: raises a manual invoice and returns the new order. */
export const POST = adminRoute(async (request) => createInvoice(parseInvoice(await readJson(request))));
