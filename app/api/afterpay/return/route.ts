import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { captureAfterpayPayment } from "@/lib/server/afterpay";
import { getOrder } from "@/lib/server/orders";
import { PaymentError } from "@/lib/server/payments";

/**
 * GET /api/afterpay/return?order=<id>&orderToken=<token>&status=SUCCESS|CANCELLED: where Afterpay sends the shopper back.
 * On SUCCESS we capture the payment, then send them to their order page, with `?afterpay=<message>` if it didn't go through.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const orderId = params.get("order");
  const token = params.get("orderToken");
  if (!orderId || !/^[0-9a-f-]{36}$/.test(orderId)) redirect("/");
  const page = `/order/${orderId}`;
  if (params.get("status") !== "SUCCESS" || !token || !/^[\w-]{1,200}$/.test(token)) {
    redirect(`${page}?afterpay=${encodeURIComponent("Afterpay payment cancelled. You can try again whenever you're ready.")}`);
  }

  let problem: string | null = null;
  try {
    await captureAfterpayPayment(orderId, token);
  } catch (error) {
    const order = await getOrder(orderId);
    // Already paid (e.g. the shopper reloaded this page): the order page says so.
    if (order?.afterpayOrderId) problem = null;
    else if (error instanceof PaymentError) problem = error.message;
    else {
      console.error("Afterpay capture failed", error);
      problem = "Something went wrong confirming your Afterpay payment. Please contact us before trying again.";
    }
  }
  revalidatePath(page);
  redirect(problem ? `${page}?afterpay=${encodeURIComponent(problem)}` : page);
}
