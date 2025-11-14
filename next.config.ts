import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "/admin",
  assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH || "/admin",
  output: "standalone",
};

export default nextConfig;
