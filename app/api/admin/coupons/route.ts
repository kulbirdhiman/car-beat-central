import { adminRoute } from "@/lib/server/admin/http";
import { listCoupons } from "@/lib/server/admin/promos";

/** GET /api/admin/coupons: newest first. */
export const GET = adminRoute(() => listCoupons(), { writes: false });
