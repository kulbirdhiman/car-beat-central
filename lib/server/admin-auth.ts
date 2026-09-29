import { timingSafeEqual } from "node:crypto";

/**
 * HTTP Basic auth for /admin. Username is "admin", password comes from ADMIN_PASSWORD.
 * With no ADMIN_PASSWORD set, admin access is disabled entirely.
 */
export function isAdminAuthorized(authorization: string | null): boolean {
  const password = process.env.ADMIN_PASSWORD;
  if (!password || !authorization?.startsWith("Basic ")) return false;

  const decoded = Buffer.from(authorization.slice(6), "base64").toString();
  const expected = Buffer.from(`admin:${password}`);
  const given = Buffer.from(decoded);
  return given.length === expected.length && timingSafeEqual(given, expected);
}
