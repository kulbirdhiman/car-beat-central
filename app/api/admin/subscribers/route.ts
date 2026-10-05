import { adminRoute } from "@/lib/server/admin/http";
import { listSubscribers } from "@/lib/server/orders";

/** GET /api/admin/subscribers: newsletter sign-ups, newest first. */
export const GET = adminRoute(() => listSubscribers(), { writes: false });
