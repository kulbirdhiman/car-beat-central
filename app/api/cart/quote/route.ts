import { quoteCart } from "@/lib/server/orders";
import { EMAIL_RE, isDelivery, parseCart } from "@/lib/server/validate";

/**
 * POST /api/cart/quote  { lines: [{ productId, qty }], coupon?, delivery, email? }
 * Returns server-computed totals (cents) so the checkout summary always matches what will be charged.
 */
export async function POST(request: Request) {
  let body: { lines?: unknown; coupon?: unknown; delivery?: unknown; email?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const lines = parseCart(body.lines);
  if (!lines) return Response.json({ error: "Invalid cart" }, { status: 400 });
  const delivery = typeof body.delivery === "string" && isDelivery(body.delivery) ? body.delivery : "standard";
  const coupon = typeof body.coupon === "string" ? body.coupon.slice(0, 20) : undefined;
  const email = typeof body.email === "string" && EMAIL_RE.test(body.email) ? body.email : undefined;

  const { lines: priced, totals } = quoteCart(lines, { coupon, delivery, email });
  return Response.json({
    lines: priced.map((l) => ({ productId: l.product.id, qty: l.qty })),
    totals,
  });
}
