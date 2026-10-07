import { clerkMiddleware } from "@clerk/nextjs/server";

/**
 * Loads the Clerk session for admin and sign-in. Access is checked where the data is served
 * (the admin layout and API routes), as Clerk recommends, rather than by path here.
 */
export const proxy = clerkMiddleware({ signInUrl: "/sign-in" });

export const config = {
  // Only admin and sign-in need Clerk; the store stays static.
  matcher: ["/admin", "/admin/:path*", "/api/admin", "/api/admin/:path*", "/sign-in", "/sign-in/:path*"],
};
