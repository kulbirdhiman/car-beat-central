import { getProductBySlug } from "@/lib/server/queries";

export async function GET(_request: Request, ctx: RouteContext<"/api/products/[slug]">) {
  const { slug } = await ctx.params;
  const product = getProductBySlug(slug);
  if (!product) return Response.json({ error: "Product not found" }, { status: 404 });
  return Response.json({ product });
}
