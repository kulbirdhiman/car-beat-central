import type { NextConfig } from "next";

// Uploaded images live in Supabase Storage; next/image only serves remote images from listed hosts.
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname : null;

const nextConfig: NextConfig = {
  // Keep Turbopack's file watcher scoped to this app instead of scanning `/`.
  turbopack: {
    root: process.cwd(),
  },
  // The hosted preview uses a generated subdomain for its dev-server requests.
  allowedDevOrigins: ["**.preview.c35.airoapp.ai"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "carbeats.com.au", pathname: "/wp-content/uploads/**" },
      ...(supabaseHost ? [{ protocol: "https" as const, hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }] : []),
    ],
  },
};

export default nextConfig;
