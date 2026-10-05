import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Database migrations are read from disk when the server starts, so ship them with every route.
  outputFileTracingIncludes: {
    "/**": ["./drizzle/**/*"],
  },
};

export default nextConfig;
