import "server-only";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { cache } from "react";

/** A signed-in shopper. `emails` are their verified addresses, lowercased: orders placed with any of them are theirs. */
export type Customer = { id: string; name: string; firstName: string; email: string; emails: string[] };

/** The signed-in customer, or null. Cached per request, since Clerk's currentUser() calls its API. */
export const getCustomer = cache(async (): Promise<Customer | null> => {
  const user = await currentUser();
  if (!user) return null;
  const emails = user.emailAddresses.filter((e) => e.verification?.status === "verified").map((e) => e.emailAddress.toLowerCase());
  const email = (user.primaryEmailAddress?.emailAddress ?? emails[0] ?? "").toLowerCase();
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ");
  return { id: user.id, name, firstName: user.firstName || name.split(" ")[0] || "there", email, emails };
});

/** The signed-in customer; sends anyone else to sign in, then back to `returnTo`. */
export async function requireCustomer(returnTo: string): Promise<Customer> {
  const customer = await getCustomer();
  if (!customer) redirect(`/sign-in?redirect_url=${encodeURIComponent(returnTo)}`);
  return customer;
}
