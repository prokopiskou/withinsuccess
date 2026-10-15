import type { Metadata } from 'next'

const title = 'Ανοιχτή Συζήτηση με τον Προκόπη · 15 Νοεμβρίου | WithinSuccess'
const description =
  'Κυριακή 15/11, 11:00–13:30. Δια ζώσης στην Αθήνα ή online. Κάνεις την ερώτησή σου, παίρνεις ξεκάθαρη απάντηση. Εισιτήριο 15€.'

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: 'https://withinsuccess.gr/anoixti-syzitisi' },
  openGraph: {
    title,
    description,
    url: 'https://withinsuccess.gr/anoixti-syzitisi',
    type: 'website',
    locale: 'el_GR',
    images: [{ url: '/og-syzitisi.jpg', width: 1200, height: 630, alt: 'Ανοιχτή Συζήτηση με τον Προκόπη' }],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: ['/og-syzitisi.jpg'],
  },
}

export default function SeminarLayout({ children }: { children: React.ReactNode }) {
  return children
}
