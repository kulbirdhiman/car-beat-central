"use server";

import { revalidatePath } from "next/cache";
import type { FormState } from "@/app/actions";
import { RETURN_REASONS, type ReturnKind, type ReturnReason } from "@/lib/returns";
import { getCustomer } from "@/lib/server/customer";
import { ReturnError, cancelUnpaidOrder, requestReturn } from "@/lib/server/returns";
import { str } from "@/lib/server/validate";

// Customers can only act on their own orders: every action re-checks who's signed in, and the server checks the order is theirs.

const SIGNED_OUT: FormState = { message: "Your session has ended. Please sign in again." };
const isOrderId = (id: string) => /^[0-9a-f-]{36}$/.test(id);

function refresh(orderId: string) {
  revalidatePath(`/order/${orderId}`);
  revalidatePath("/account", "layout");
}

/** Cancels the customer's unpaid order. */
export async function cancelOrderAction(orderId: string): Promise<FormState> {
  const customer = await getCustomer();
  if (!customer) return SIGNED_OUT;
  if (!isOrderId(orderId)) return { message: "We couldn't find that order." };
  try {
    await cancelUnpaidOrder(customer, orderId);
  } catch (error) {
    if (error instanceof ReturnError) return { message: error.message };
    throw error;
  }
  refresh(orderId);
  return { ok: true };
}

/** A cancellation request for a paid order, or a return request with a quantity per item (`qty-<productId>`). */
export async function requestReturnAction(_prev: FormState, form: FormData): Promise<FormState> {
  const customer = await getCustomer();
  if (!customer) return SIGNED_OUT;
  const orderId = str(form, "orderId", 64);
  if (!isOrderId(orderId)) return { message: "We couldn't find that order." };

  const kind = str(form, "kind") as ReturnKind;
  const reason = str(form, "reason") as ReturnReason;
  const details = str(form, "details", 1000);
  const values = { reason, details };
  if (kind !== "cancel" && kind !== "return") return { values, message: "Something went wrong. Please refresh and try again." };
  if (!(reason in RETURN_REASONS)) return { values, errors: { reason: "Choose a reason." }, message: "Please fix the highlighted fields." };
  if (reason !== "changed_mind" && details.length < 10) {
    return { values, errors: { details: "Tell us a little about what happened (at least 10 characters)." }, message: "Please fix the highlighted fields." };
  }

  const items = [...form.keys()]
    .filter((k) => k.startsWith("qty-"))
    .map((k) => ({ productId: k.slice(4, 68), qty: Math.max(0, Math.min(1000, Math.trunc(Number(str(form, k, 5))) || 0)) }));

  try {
    await requestReturn(customer, orderId, { kind, reason, details, items });
  } catch (error) {
    if (error instanceof ReturnError) return { values, message: error.message };
    throw error;
  }
  refresh(orderId);
  return { ok: true };
}
