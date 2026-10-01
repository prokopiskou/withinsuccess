import type { Metadata } from 'next'

const title = '30 μέρες μεταμόρφωσης | WithinSuccess'
const description =
  'Κάθε μέρα ένα email με μια σημαντική αλλαγή νοοτροπίας και μία άσκηση για την πραγματική σου ζωή. Άμεση πρόσβαση.'

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    url: 'https://withinsuccess.gr/30days',
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

export default function ThirtyDaysLayout({ children }: { children: React.ReactNode }) {
  return children
}
