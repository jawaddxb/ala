import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  experimental: {
    instrumentationHook: true,
  },
};

export default nextConfig;

// Force rebuild: $(date +%s)
