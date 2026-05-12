import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Ευχαριστούμε | 30-Day Program | WithinSuccess',
  robots: { index: false, follow: false },
}

export default function ThankYouLayout({ children }: { children: React.ReactNode }) {
  return children
}
