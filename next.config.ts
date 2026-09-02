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
        destination: "https://withinsuccess.gr/path?utm_source=instagram&utm_medium=bio&utm_campaign=within_path",
        permanent: false,
      },
      {
        source: "/wl-fb",
        destination: "https://withinsuccess.gr/path?utm_source=facebook&utm_medium=bio&utm_campaign=within_path",
        permanent: false,
      },
      {
        source: "/wl-tt",
        destination: "https://withinsuccess.gr/path?utm_source=tiktok&utm_medium=bio&utm_campaign=within_path",
        permanent: false,
      },

      // --- Legacy WordPress URLs → new pages (permanent, preserves SEO) ---
      // Old WooCommerce shop (covers every /product/* and /product-category/* slug)
      { source: "/product/:path*", destination: "/work", permanent: true },
      { source: "/product-category/:path*", destination: "/work", permanent: true },
      { source: "/shop", destination: "/work", permanent: true },
      // Old blog / categories
      { source: "/my-blog", destination: "/insights", permanent: true },
      { source: "/category/:path*", destination: "/insights", permanent: true },
      { source: "/productivity", destination: "/insights", permanent: true },
      { source: "/περισσότερα-πράγματα-σε-λιγότερο-χρό", destination: "/insights", permanent: true },
      { source: "/βρισκόμαστε-σε-πόλεμο", destination: "/insights", permanent: true },
      // About / legal
      { source: "/about-me", destination: "/about", permanent: true },
      { source: "/σχετικά-με-εμάς", destination: "/about", permanent: true },
      { source: "/privacy-policy", destination: "/privacy", permanent: true },
      { source: "/oroi-kai-proypotheseis", destination: "/terms", permanent: true },
      // Coaching / seminars / campaigns → offerings hub
      { source: "/1on1_coaching", destination: "/work", permanent: true },
      { source: "/thessaloniki", destination: "/work", permanent: true },
      { source: "/conquer_2024", destination: "/work", permanent: true },
      { source: "/positivity2025", destination: "/work", permanent: true },
      // 30-day program
      { source: "/30day", destination: "/30days", permanent: true },
      // 63 days program + waitlist + thank-you
      { source: "/63_meres_zois", destination: "/63days", permanent: true },
      { source: "/63-meres-zois", destination: "/63days", permanent: true },
      { source: "/63meres", destination: "/63days", permanent: true },
      { source: "/63-μέρες-ζωής-εκπαιδευτικό-πρόγραμμα-αλ", destination: "/63days", permanent: true },
      { source: "/63_waitlist1", destination: "/waitlist", permanent: true },
      { source: "/63_thankyou", destination: "/63days/thank-you", permanent: true },
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
