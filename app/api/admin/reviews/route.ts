import { adminRoute } from "@/lib/server/admin/http";
import { listAdminReviews } from "@/lib/server/reviews";

/** GET /api/admin/reviews: written product reviews, newest first. */
export const GET = adminRoute(() => listAdminReviews(), { writes: false });
