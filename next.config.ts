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

  // Force the proxied /path HTML to always be fetched fresh, so it never
  // references CSS/JS chunks from an older within-path deploy (the likely
  // cause of the intermittent unstyled/broken page). Scoped to the HTML
  // pages only — assets under /path/_next/* keep normal immutable caching.
  async headers() {
    return [
      {
        source: '/path',
        headers: [
          { key: 'Cache-Control', value: 'no-store, must-revalidate' },
        ],
      },
      {
        source: '/path/thank-you',
        headers: [
          { key: 'Cache-Control', value: 'no-store, must-revalidate' },
        ],
      },
    ]
  },
};

export default nextConfig;
