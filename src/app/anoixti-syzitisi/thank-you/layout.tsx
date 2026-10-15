import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Η θέση σου είναι κλεισμένη | WithinSuccess',
  robots: { index: false, follow: false },
}

export default function SeminarThankYouLayout({ children }: { children: React.ReactNode }) {
  return children
}
