import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    staleTimes: {
      dynamic: 0,
    },
    optimizePackageImports: ['react', 'react-dom'],
  },
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.withinsuccess.gr' }],
        destination: 'https://withinsuccess.gr/:path*',
        permanent: true,
      },
    ]
  },
};

export default nextConfig;