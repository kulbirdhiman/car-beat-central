import { adminRoute } from "@/lib/server/admin/http";
import { listBookings } from "@/lib/server/orders";

/** GET /api/admin/bookings: fitting requests from /fitting, newest first. */
export const GET = adminRoute(() => listBookings(), { writes: false });
