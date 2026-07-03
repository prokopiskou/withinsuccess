import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import ConditionalHeader from "@/components/ConditionalHeader";
import CookieBanner from "@/components/CookieBanner";
import CookieTrigger from "@/components/CookieTrigger";
import ConsentInitializer from "@/components/ConsentInitializer";
import { SpeedInsights } from "@vercel/speed-insights/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const META_PIXEL_ID = "1653590555890252";

export const metadata: Metadata = {
  metadataBase: new URL("https://withinsuccess.gr"),
  alternates: {
    canonical: "./",
  },
  title: {
    default: "Προκόπης Κούκης | Προσωπική Ανάπτυξη & Αλλαγή Νοοτροπίας",
    template: "%s | WithinSuccess",
  },
  description:
    "Βοηθώ ανθρώπους να αλλάξουν την εσωτερική τους ιστορία μέσα από coaching, σεμινάρια αυτοβελτίωσης και προγράμματα προσωπικής ανάπτυξης. 900+ άτομα. 7+ χρόνια εμπειρία.",
  keywords: [
    "προσωπική ανάπτυξη",
    "αλλαγή νοοτροπίας",
    "διαχείριση άγχους",
    "αυτοβελτίωση",
    "σεμινάρια αυτοβελτίωσης",
    "life coaching",
    "online coaching",
    "αυτογνωσία",
    "ψυχική ευεξία",
    "Προκόπης Κούκης",
  ],
  authors: [{ name: "Προκόπης Κούκης", url: "https://withinsuccess.gr" }],
  creator: "Προκόπης Κούκης",
  icons: {
    icon: [
      { url: '/logo.png', type: 'image/png' },
      { url: '/favicon.ico', sizes: '256x256', type: 'image/x-icon' },
    ],
    apple: '/logo.png',
    shortcut: '/logo.png',
  },
  other: {
    "facebook-domain-verification": "irchrcs50cp19rnfgafr8j067xor89",
  },
  verification: {
    google: "EMskKzfC96FLB1U_txvrnLVx7ewWtNQn8yx4Bp5YP2Q",
  },
  openGraph: {
    type: "website",
    locale: "el_GR",
    url: "https://withinsuccess.gr",
    siteName: "WithinSuccess",
    title: "Προκόπης Κούκης | Προσωπική Ανάπτυξη & Αλλαγή Νοοτροπίας",
    description:
      "Η ζωή αλλάζει όταν αλλάξει η εσωτερική ιστορία. Coaching, σεμινάρια και προγράμματα αυτοβελτίωσης από τον Προκόπη Κούκη.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "WithinSuccess - Προκόπης Κούκης",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Προκόπης Κούκης | WithinSuccess",
    description: "Η ζωή αλλάζει όταν αλλάξει η εσωτερική ιστορία.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": "https://withinsuccess.gr/#person",
      name: "Προκόπης Κούκης",
      url: "https://withinsuccess.gr",
      image: "https://withinsuccess.gr/prokopis_about.webp",
      sameAs: [
        "https://www.instagram.com/withinsuccess/",
        "https://www.youtube.com/@Prokopiskoukis",
      ],
      jobTitle: "Life Coach & Personal Development Expert",
      description:
        "Ειδικός προσωπικής ανάπτυξης και αλλαγής νοοτροπίας. 7+ χρόνια εμπειρία, 900+ άτομα.",
      knowsAbout: [
        "Προσωπική Ανάπτυξη",
        "Αλλαγή Νοοτροπίας",
        "Διαχείριση Άγχους",
        "Life Coaching",
        "Αυτογνωσία",
      ],
    },
    {
      "@type": "Organization",
      "@id": "https://withinsuccess.gr/#organization",
      name: "WithinSuccess",
      url: "https://withinsuccess.gr",
      logo: "https://withinsuccess.gr/logo.png",
      founder: { "@id": "https://withinsuccess.gr/#person" },
      sameAs: [
        "https://www.instagram.com/withinsuccess/",
        "https://www.youtube.com/@Prokopiskoukis",
      ],
    },
    {
      "@type": "WebSite",
      "@id": "https://withinsuccess.gr/#website",
      url: "https://withinsuccess.gr",
      name: "WithinSuccess",
      publisher: { "@id": "https://withinsuccess.gr/#organization" },
      inLanguage: "el",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="el"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="preload" href="/withinsuccess_head.webp" as="image" fetchPriority="high" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Script id="google-consent-mode-default" strategy="beforeInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}

            // Default: deny all (Google Consent Mode v2)
            gtag('consent', 'default', {
              'ad_storage': 'denied',
              'ad_user_data': 'denied',
              'ad_personalization': 'denied',
              'analytics_storage': 'denied',
              'functionality_storage': 'granted',
              'personalization_storage': 'denied',
              'security_storage': 'granted',
              'wait_for_update': 500,
            });

            gtag('set', 'ads_data_redaction', true);
          `}
        </Script>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-QH4S5H2Z4K"
          strategy="lazyOnload"
        />
        <Script id="google-analytics" strategy="lazyOnload">
          {`
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-QH4S5H2Z4K');
  `}
        </Script>
        {/* Meta Pixel Code */}
        <Script
          id="meta-pixel"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${META_PIXEL_ID}');
              fbq('consent', 'revoke');
              // PageView will fire after consent is granted
            `,
          }}
        />
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
            alt=""
          />
        </noscript>
      </head>
      <body className="min-h-full flex flex-col">
        <ConsentInitializer />
        <ConditionalHeader />
        {children}
        <CookieBanner />
        <CookieTrigger />
        <SpeedInsights />
      </body>
    </html>
  );
}