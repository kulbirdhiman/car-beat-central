import { adminRoute } from "@/lib/server/admin/http";
import { AdminError } from "@/lib/server/admin/validate";
import { deleteReview } from "@/lib/server/reviews";

type Ctx = RouteContext<"/api/admin/reviews/[id]">;

/** DELETE /api/admin/reviews/:id: removes the review and updates the product's rating. */
export const DELETE = adminRoute(async (_request, ctx: Ctx) => {
  const { id } = await ctx.params;
  // Review ids are UUIDs, not admin slugs.
  if (!/^[0-9a-f-]{36}$/.test(id)) throw new AdminError("Invalid id.");
  deleteReview(id);
});
