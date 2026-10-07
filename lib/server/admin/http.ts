import "server-only";
import { revalidatePath } from "next/cache";
import { adminAccess } from "../admin-auth";
import { AdminError } from "./validate";

/**
 * Wraps an admin API handler: checks the caller is a signed-in admin, turns AdminError into a JSON error with its status, and after a successful
 * write marks every store page stale so shoppers see the change on their next visit.
 */
export function adminRoute<Ctx>(handler: (request: Request, ctx: Ctx) => unknown, { writes = true } = {}) {
  return async (request: Request, ctx: Ctx) => {
    const access = await adminAccess();
    if (access === "signed-out") return Response.json({ error: "Sign in required." }, { status: 401 });
    if (access === "forbidden") return Response.json({ error: "Admin access required." }, { status: 403 });
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
