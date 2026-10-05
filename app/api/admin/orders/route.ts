import { adminRoute } from "@/lib/server/admin/http";
import { listAdminOrders } from "@/lib/server/orders";

/** GET /api/admin/orders: newest first, with items. */
export const GET = adminRoute(() => listAdminOrders(), { writes: false });
