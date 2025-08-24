import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Force HTTP for local development to avoid SSL issues
  assetPrefix: process.env.NODE_ENV === 'development' ? '' : undefined,
  // Disable HTTPS redirect for local development
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: process.env.NODE_ENV === 'development' ? 'max-age=0' : 'max-age=31536000; includeSubDomains; preload'
          }
        ]
      }
    ];
  }
};

export default nextConfig;
