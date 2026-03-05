import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  experimental: {
    instrumentationHook: true,
  },
  outputFileTracingIncludes: {
    "/**": ["./data/**"],
  },
};

export default nextConfig;
