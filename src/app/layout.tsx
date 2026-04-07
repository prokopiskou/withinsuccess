import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://withinsuccess.gr"),
  title: {
    default: "Προκόπης Κούκης | Προσωπική Ανάπτυξη & Αλλαγή Νοοτροπίας",
    template: "%s | WithinSuccess",
  },
  description: "Βοηθώ ανθρώπους να αλλάξουν την εσωτερική τους ιστορία μέσα από coaching, σεμινάρια αυτοβελτίωσης και προγράμματα προσωπικής ανάπτυξης. 900+ άτομα. 7+ χρόνια εμπειρία.",
  keywords: ["προσωπική ανάπτυξη", "αλλαγή νοοτροπίας", "διαχείριση άγχους", "αυτοβελτίωση", "σεμινάρια αυτοβελτίωσης", "life coaching", "online coaching", "αυτογνωσία", "ψυχική ευεξία", "Προκόπης Κούκης"],
  authors: [{ name: "Προκόπης Κούκης", url: "https://withinsuccess.gr" }],
  creator: "Προκόπης Κούκης",
  openGraph: {
    type: "website",
    locale: "el_GR",
    url: "https://withinsuccess.gr",
    siteName: "WithinSuccess",
    title: "Προκόπης Κούκης | Προσωπική Ανάπτυξη & Αλλαγή Νοοτροπίας",
    description: "Η ζωή αλλάζει όταν αλλάξει η εσωτερική ιστορία. Coaching, σεμινάρια και προγράμματα αυτοβελτίωσης από τον Προκόπη Κούκη.",
    images: [{ url: "/withinsuccess_head.webp", width: 1200, height: 630, alt: "Προκόπης Κούκης - WithinSuccess" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Προκόπης Κούκης | WithinSuccess",
    description: "Η ζωή αλλάζει όταν αλλάξει η εσωτερική ιστορία.",
    images: ["/withinsuccess_head.webp"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  alternates: {
    canonical: "https://withinsuccess.gr",
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
      description: "Ειδικός προσωπικής ανάπτυξης και αλλαγής νοοτροπίας. 7+ χρόνια εμπειρία, 900+ άτομα.",
      knowsAbout: ["Προσωπική Ανάπτυξη", "Αλλαγή Νοοτροπίας", "Διαχείριση Άγχους", "Life Coaching", "Αυτογνωσία"],
    },
    {
      "@type": "Organization",
      "@id": "https://withinsuccess.gr/#organization",
      name: "WithinSuccess",
      url: "https://withinsuccess.gr",
      logo: "https://withinsuccess.gr/withinsuccess_head.webp",
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}