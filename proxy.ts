import { clerkMiddleware } from "@clerk/nextjs/server";

/**
 * Loads the Clerk session for admin, customer accounts, checkout (to prefill a signed-in customer's address) and sign-in. Access is checked where the data is served
 * (the admin layout and API routes), as Clerk recommends, rather than by path here.
 */
export const proxy = clerkMiddleware({ signInUrl: "/sign-in" });

export const config = {
  // Only these pages need Clerk; the rest of the store stays static.
  matcher: [
    "/admin",
    "/admin/:path*",
    "/api/admin",
    "/api/admin/:path*",
    "/account",
    "/account/:path*",
    "/checkout",
    "/sign-in",
    "/sign-in/:path*",
    "/sign-up",
    "/sign-up/:path*",
  ],
};
