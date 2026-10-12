"use server";

import { revalidatePath } from "next/cache";
import type { FormState } from "@/app/actions";
import { deleteAddress, saveAddress, setDefaultAddress } from "@/lib/server/account";
import { getCustomer } from "@/lib/server/customer";
import { str, validateAddress } from "@/lib/server/validate";

// Every action re-checks who's signed in and only touches that customer's own addresses.

const ADDRESS_FIELDS = ["name", "phone", "address", "suburb", "state", "postcode"];
const SIGNED_OUT: FormState = { message: "Your session has ended. Please sign in again." };

export async function saveAddressAction(_prev: FormState, form: FormData): Promise<FormState> {
  const customer = await getCustomer();
  if (!customer) return SIGNED_OUT;
  const values = Object.fromEntries(ADDRESS_FIELDS.map((k) => [k, str(form, k)]));
  const { data, errors } = validateAddress(form);
  if (!data) return { errors, values, message: "Please fix the highlighted fields." };
  const saved = await saveAddress(customer.id, str(form, "id", 64) || null, data, form.get("default") === "on");
  if (!saved) return { values, message: "That address no longer exists." };
  revalidatePath("/account", "layout");
  return { ok: true };
}

export async function deleteAddressAction(id: string) {
  const customer = await getCustomer();
  if (!customer) return;
  await deleteAddress(customer.id, id);
  revalidatePath("/account", "layout");
}

export async function setDefaultAddressAction(id: string) {
  const customer = await getCustomer();
  if (!customer) return;
  await setDefaultAddress(customer.id, id);
  revalidatePath("/account", "layout");
}
