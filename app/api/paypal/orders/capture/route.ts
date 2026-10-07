import { revalidatePath } from "next/cache";
import { capturePayPalOrder, PaymentError } from "@/lib/server/paypal";

/** POST /api/paypal/orders/capture { orderId, paypalOrderId }: takes the payment the shopper approved and marks the order paid. */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { orderId?: unknown; paypalOrderId?: unknown } | null;
  const orderId = typeof body?.orderId === "string" && /^[0-9a-f-]{36}$/.test(body.orderId) ? body.orderId : null;
  const paypalOrderId = typeof body?.paypalOrderId === "string" && /^[A-Z0-9]{1,36}$/.test(body.paypalOrderId) ? body.paypalOrderId : null;
  if (!orderId || !paypalOrderId) return Response.json({ error: "Invalid payment." }, { status: 400 });
  try {
    await capturePayPalOrder(orderId, paypalOrderId);
    revalidatePath(`/order/${orderId}`);
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof PaymentError) return Response.json({ error: error.message }, { status: 400 });
    console.error("PayPal capture failed", error);
    return Response.json({ error: "Something went wrong confirming your payment. Please contact us before trying again." }, { status: 500 });
  }
}
