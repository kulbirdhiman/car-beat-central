import { listAdminProducts } from "@/lib/server/admin/catalog";
import { adminRoute } from "@/lib/server/admin/http";

/** GET /api/admin/products: every product, drafts included, newest first. */
export const GET = adminRoute(() => listAdminProducts(), { writes: false });
