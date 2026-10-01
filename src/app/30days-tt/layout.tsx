import type { Metadata } from 'next'

// Εκδοχή του /30days για TikTok Ads (policy-safe). Δεν ευρετηριάζεται, canonical → /30days.
const title = '30 μέρες μεταμόρφωσης | WithinSuccess'
const description =
  'Ψηφιακό πρόγραμμα αυτοβελτίωσης μέσω email: 30 μέρες, ένα email με μια αλλαγή νοοτροπίας και μία άσκηση κάθε μέρα. Άμεση πρόσβαση.'

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: 'https://withinsuccess.gr/30days' },
  robots: { index: false, follow: true },
  openGraph: {
    title,
    description,
    url: 'https://withinsuccess.gr/30days-tt',
    type: 'website',
    locale: 'el_GR',
    images: [{ url: '/og-30days.png', width: 1200, height: 630, alt: '30 μέρες μεταμόρφωσης' }],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: ['/og-30days.png'],
  },
}

export default function ThirtyDaysTTLayout({ children }: { children: React.ReactNode }) {
  return children
}
