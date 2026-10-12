import { UserProfile } from "@clerk/nextjs";
import { requireCustomer } from "@/lib/server/customer";

export const metadata = { title: "Profile & security · CarBeat", robots: { index: false } };

/** Clerk's own profile screens: name, email addresses, password and signed-in devices. */
export default async function ProfilePage() {
  await requireCustomer("/account/profile");
  return (
    <>
      <h1 className="mb-8 font-display text-4xl font-bold sm:text-5xl">Profile &amp; security</h1>
      <UserProfile routing="path" path="/account/profile" appearance={{ elements: { rootBox: "w-full", cardBox: "w-full max-w-none shadow-none ring-1 ring-foreground/[0.07]" } }} />
    </>
  );
}
