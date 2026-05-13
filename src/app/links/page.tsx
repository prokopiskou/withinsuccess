import type { Metadata } from 'next'
import Image from 'next/image'
import LinkButton from './LinkButton'

export const metadata: Metadata = {
  title: 'Links · WithinSuccess',
  description: 'Όλα τα σημαντικά links του WithinSuccess σε ένα μέρος.',
  robots: { index: false, follow: true },
}

export default function LinksPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto flex max-w-md flex-col px-6 pt-16 pb-12">
        <header className="mb-10 text-center">
          <div className="mx-auto mb-4 h-20 w-20 overflow-hidden rounded-full border border-gray-200 bg-white">
            <Image
              src="/prokopis_about.webp"
              alt="Prokopis Koukis"
              width={160}
              height={160}
              className="h-full w-full object-cover"
              priority
            />
          </div>
          <h1
            className="text-2xl font-semibold tracking-tight"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            WithinSuccess
          </h1>
          <p className="mt-1 text-xs uppercase tracking-widest text-gray-400">
            Mindset · Self-awareness · Direction
          </p>
        </header>

        <div className="space-y-3">
          <LinkButton
            href="/assessment"
            title="Within Assessment"
            subtitle="Δωρεάν · 3 λεπτά"
            symbol="✦"
            destination="assessment"
          />

          <LinkButton
            href="/insights"
            title="Σκέψεις & άρθρα"
            subtitle="Νέο άρθρο κάθε εβδομάδα"
            symbol="◇"
            destination="insights"
          />

          <LinkButton
            href="https://www.youtube.com/@Prokopiskoukis"
            title="YouTube Channel"
            subtitle="Video insights & masterclasses"
            symbol="▶"
            destination="youtube"
          />

          <LinkButton
            href="/work"
            title="1-on-1 Coaching"
            subtitle="Personal journey · application"
            symbol="◆"
            destination="coaching"
          />
        </div>

        <footer className="mt-12 text-center text-xs text-gray-400">
          withinsuccess.gr
        </footer>
      </div>
    </main>
  )
}
