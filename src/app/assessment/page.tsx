'use client'

import { useEffect } from 'react'
import Script from 'next/script'
import { trackQuizLead } from '@/lib/analytics'
import UTMCapture from '@/components/UTMCapture'

const TALLY_FORM_ID = 'pbWozb'

declare global {
  interface Window {
    Tally?: { loadEmbeds: () => void }
  }
}

export default function Assessment() {
  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (!e.origin?.includes('tally.so')) return
      if (typeof e.data !== 'string' || !e.data.includes('Tally.FormSubmitted')) return
      try {
        const { payload } = JSON.parse(e.data) as { payload?: { formId?: string } }
        if (payload?.formId !== TALLY_FORM_ID) return
        trackQuizLead()
      } catch {
        // ignore malformed postMessage
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Tally) {
      window.Tally.loadEmbeds()
    }
  }, [])

  return (
    <main className="min-h-screen bg-white font-sans">
      <UTMCapture />
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="text-lg font-semibold tracking-tight">WithinSuccess</a>
          <a href="/" className="text-sm text-gray-500 hover:text-black transition-colors">← Πίσω</a>
        </div>
      </nav>
      <div className="pt-16 h-screen">
        <iframe
          data-tally-src={`https://tally.so/r/${TALLY_FORM_ID}?transparentBackground=1`}
          width="100%"
          height="100%"
          frameBorder="0"
          marginHeight={0}
          marginWidth={0}
          title="Quiz - Αυτογνωσίας"
        />
        <Script
          src="https://tally.so/widgets/embed.js"
          strategy="lazyOnload"
          onLoad={() => {
            window.Tally?.loadEmbeds?.()
          }}
        />
      </div>
    </main>
  )
}
