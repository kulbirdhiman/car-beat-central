import { getAdminData } from "@/lib/server/admin/data";
import { adminRoute } from "@/lib/server/admin/http";

/** GET /api/admin: every admin collection at once. The panel refetches this to resync after a failed save. */
export const GET = adminRoute(() => getAdminData(), { writes: false });
