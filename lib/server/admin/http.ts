import "server-only";
import { revalidatePath } from "next/cache";
import { isAdminAuthorized } from "../admin-auth";
import { AdminError } from "./validate";

/**
 * Wraps an admin API handler: checks the admin password (the proxy does too; this guards against
 * a matcher change), turns AdminError into a JSON error with its status, and after a successful
 * write marks every store page stale so shoppers see the change on their next visit.
 */
export function adminRoute<Ctx>(handler: (request: Request, ctx: Ctx) => unknown, { writes = true } = {}) {
  return async (request: Request, ctx: Ctx) => {
    if (!isAdminAuthorized(request.headers.get("authorization"))) return Response.json({ error: "Authentication required." }, { status: 401 });
    try {
      const result = await handler(request, ctx);
      if (writes) revalidatePath("/", "layout");
      return Response.json(result ?? { ok: true }, { headers: { "Cache-Control": "no-store" } });
    } catch (error) {
      if (error instanceof AdminError) return Response.json({ error: error.message }, { status: error.status });
      console.error("Admin API error", error);
      return Response.json({ error: "Something went wrong on the server." }, { status: 500 });
    }
  };
}

/** The request body as JSON; a malformed body is a 400, not a 500. */
export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new AdminError("Request body must be valid JSON.");
  }
}
