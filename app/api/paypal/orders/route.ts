import { createPayPalOrder, PaymentError } from "@/lib/server/paypal";

/**
 * POST /api/paypal/orders { orderId }: starts paying one of our orders with PayPal.
 * Returns { id }, the PayPal order id the PayPal buttons open. The amount comes from the database, never the client.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { orderId?: unknown } | null;
  const orderId = typeof body?.orderId === "string" && /^[0-9a-f-]{36}$/.test(body.orderId) ? body.orderId : null;
  if (!orderId) return Response.json({ error: "Invalid order." }, { status: 400 });
  try {
    return Response.json({ id: await createPayPalOrder(orderId) });
  } catch (error) {
    if (error instanceof PaymentError) return Response.json({ error: error.message }, { status: 400 });
    console.error("PayPal create failed", error);
    return Response.json({ error: "Something went wrong starting your payment." }, { status: 500 });
  }
}
