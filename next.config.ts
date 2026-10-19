import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [{ source: "/ai-visibility", destination: "/ai-seo/audit", permanent: true }];
  },
};

export default nextConfig;
