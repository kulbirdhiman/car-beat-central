import { searchLocalities } from "@/lib/server/localities";

/**
 * GET /api/localities?q=parra&state=NSW
 * Up to 8 suburbs matching a suburb name or postcode, for the address autocomplete.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const q = params.get("q")?.slice(0, 40) ?? "";
  const state = params.get("state") ?? undefined;
  return Response.json(searchLocalities(q, state), {
    headers: { "Cache-Control": "public, max-age=86400" },
  });
}
