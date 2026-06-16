'use client'

import { useEffect } from 'react'
import { trackPurchase } from '@/lib/analytics'

const GOLD = '#C9A96E'

export default function ThankYouPage() {
  useEffect(() => {
    // Read session_id from URL directly (avoids useSearchParams Suspense requirement)
    const params = new URLSearchParams(window.location.search)
    const sessionId = params.get('session_id')

    trackPurchase({
      id: '63days-program',
      name: '63 Μέρες Ζωής',
      price: 89
    }, sessionId || undefined)
  }, [])

  return (
    <main className="min-h-screen bg-white text-black font-sans flex items-center justify-center px-6 py-20">
      <div className="max-w-xl mx-auto text-center">
        
        {/* Gold accent line */}
        <div className="flex items-center justify-center gap-3 mb-12">
          <div className="h-px w-12" style={{ backgroundColor: GOLD }} />
          <p className="text-xs font-medium tracking-[0.3em] uppercase" style={{ color: GOLD }}>
            Είσαι μέσα
          </p>
          <div className="h-px w-12" style={{ backgroundColor: GOLD }} />
        </div>

        {/* Main heading */}
        <h1 className="text-3xl md:text-5xl font-semibold leading-tight tracking-tight mb-6" style={{ fontFamily: 'Georgia, serif' }}>
          Σε είδα.
        </h1>
        <p className="text-3xl md:text-5xl font-semibold leading-tight tracking-tight mb-12" style={{ fontFamily: 'Georgia, serif', color: GOLD }}>
          Σε ευχαριστώ.
        </p>

        {/* Body */}
        <div className="text-base md:text-lg text-gray-700 leading-relaxed space-y-4 max-w-md mx-auto mb-16">
          <p>Πήρες την απόφαση που οι περισσότεροι αναβάλλουν.</p>
          <p>Και σου το αναγνωρίζω.</p>
        </div>

        {/* What happens next */}
        <div className="bg-gray-50 rounded-2xl p-8 md:p-10 mb-12 text-left">
          <p className="text-xs tracking-widest text-gray-400 uppercase mb-6 text-center">Τι ακολουθεί</p>
          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 text-[#0D0D0D]" style={{ backgroundColor: GOLD }}>1</div>
              <div>
                <p className="text-gray-700 text-sm leading-relaxed">
                  <span className="font-semibold">Email επιβεβαίωσης</span> στα επόμενα λεπτά. Έλεγξε και τα spam.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 text-[#0D0D0D]" style={{ backgroundColor: GOLD }}>2</div>
              <div>
                <p className="text-gray-700 text-sm leading-relaxed">
                  <span className="font-semibold">Σύνδεσμος για το Viber channel</span> θα έρθει στο email στις 12 Μαΐου.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 text-[#0D0D0D]" style={{ backgroundColor: GOLD }}>3</div>
              <div>
                <p className="text-gray-700 text-sm leading-relaxed">
                  <span className="font-semibold">Κυριακή 12 Μαΐου</span> ξεκινάμε. Λαμβάνεις το πρώτο Playbook και την πρώτη καθοδήγηση.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Personal note */}
        <div className="border-t border-gray-100 pt-12 mb-12">
          <p className="text-gray-700 leading-relaxed mb-4 text-base">
            Σου υπόσχομαι ένα πράγμα.
          </p>
          <p className="text-lg font-semibold mb-4" style={{ fontFamily: 'Georgia, serif' }}>
            Αν εμφανιστείς, θα είμαι εκεί.
          </p>
          <p className="text-gray-600 text-sm">— Προκόπης</p>
        </div>

        {/* Footer */}
        <div className="text-xs text-gray-400 space-y-2">
          <p>Για οποιαδήποτε απορία στο hello@withinsuccess.gr</p>
        </div>
      </div>
    </main>
  )
}