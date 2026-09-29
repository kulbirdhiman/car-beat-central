import { NextResponse, type NextRequest } from "next/server";
import { isAdminAuthorized } from "./lib/server/admin-auth";

/** Guards the admin dashboard with HTTP Basic auth. */
export function proxy(request: NextRequest) {
  if (!process.env.ADMIN_PASSWORD) {
    return new NextResponse("Admin is disabled. Set ADMIN_PASSWORD to enable it.", { status: 503 });
  }
  if (isAdminAuthorized(request.headers.get("authorization"))) return NextResponse.next();

  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="CarBeat admin", charset="UTF-8"' },
  });
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
