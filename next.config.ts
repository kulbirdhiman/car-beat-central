import type { NextConfig } from "next";

// Uploaded images live in Supabase Storage; next/image only serves remote images from listed hosts.
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname : null;

const nextConfig: NextConfig = {
  // Database migrations are read from disk when the server starts, so ship them with every route.
  outputFileTracingIncludes: {
    "/**": ["./drizzle/**/*"],
  },
  images: {
    remotePatterns: supabaseHost ? [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }] : [],
  },
};

export default nextConfig;
