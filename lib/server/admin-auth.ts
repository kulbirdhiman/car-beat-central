import "server-only";
import { currentUser } from "@clerk/nextjs/server";

/** Emails allowed into /admin, from ADMIN_EMAILS (comma-separated). Nobody is let in when it's unset. */
function adminEmails() {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

/**
 * Who's asking for /admin. Signing in alone isn't enough, since anyone can create a Clerk account:
 * one of the user's verified emails must be listed in ADMIN_EMAILS.
 */
export async function adminAccess(): Promise<"signed-out" | "forbidden" | "admin"> {
  const user = await currentUser();
  if (!user) return "signed-out";
  const allowed = adminEmails();
  const ok = user.emailAddresses.some((e) => e.verification?.status === "verified" && allowed.has(e.emailAddress.toLowerCase()));
  return ok ? "admin" : "forbidden";
}
