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
        source: '/ig',
        destination: '/links?utm_source=instagram&utm_medium=bio&utm_campaign=evergreen',
        permanent: false,
      },
      {
        source: '/fb',
        destination: '/links?utm_source=facebook&utm_medium=bio&utm_campaign=evergreen',
        permanent: false,
      },
      {
        source: '/tt',
        destination: '/links?utm_source=tiktok&utm_medium=bio&utm_campaign=evergreen',
        permanent: false,
      },
      {
        source: '/th',
        destination: '/links?utm_source=threads&utm_medium=bio&utm_campaign=evergreen',
        permanent: false,
      },
      {
        source: "/wl-ig",
        destination: "https://withinsuccess.gr/path?utm_source=instagram&utm_medium=bio&utm_campaign=wp_waitlist",
        permanent: false,
      },
      {
        source: "/wl-fb",
        destination: "https://withinsuccess.gr/path?utm_source=facebook&utm_medium=bio&utm_campaign=wp_waitlist",
        permanent: false,
      },
      {
        source: "/wl-tt",
        destination: "https://withinsuccess.gr/path?utm_source=tiktok&utm_medium=bio&utm_campaign=wp_waitlist",
        permanent: false,
      },
    ]
  },

  async rewrites() {
    return [
      {
        source: '/path',
        destination: 'https://within-path.vercel.app/path',
      },
      {
        source: '/path/:match*',
        destination: 'https://within-path.vercel.app/path/:match*',
      },
    ]
  },
};

export default nextConfig;
