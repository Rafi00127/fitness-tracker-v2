import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const apiInternalUrl =
      process.env.API_INTERNAL_URL ?? "http://localhost:3001";

    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiInternalUrl}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
