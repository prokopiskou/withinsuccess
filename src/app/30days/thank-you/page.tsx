'use client'

import { useEffect } from 'react'
import { trackPurchase } from '@/lib/analytics'
import { thirtyDaysPrice, isThirtyDaysPromo } from '@/lib/thirtyDays'
import { useState } from 'react'

export default function ThankYouPage() {
  // Αγορά μέσα στην προσφορά → κοινή έναρξη 1/12
  const [cohort] = useState(() => isThirtyDaysPromo())
  useEffect(() => {
    // Read session_id from URL directly (avoids useSearchParams Suspense requirement)
    const params = new URLSearchParams(window.location.search)
    const sessionId = params.get('session_id')

    trackPurchase({
      id: '30days-program',
      name: '30 Μέρες',
      price: thirtyDaysPrice()
    }, sessionId || undefined)
  }, [])

  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-24">
      <div className="max-w-lg text-center">
        <p className="text-sm tracking-widest text-[#C9A96E] uppercase mb-6">30-Day Program</p>
        <h1 className="text-4xl font-serif text-[#0D0D0D] mb-6" style={{fontFamily: 'Georgia, serif'}}>
          Καλωσήρθες στο πρόγραμμα.
        </h1>
        <p className="text-gray-500 text-lg mb-4">
          {cohort
            ? 'Η θέση σου κλείστηκε. Ξεκινάμε όλοι μαζί την Τρίτη 1/12: το πρώτο email έρχεται εκείνο το πρωί.'
            : 'Σε λίγα λεπτά θα λάβεις email με όλες τις οδηγίες για να ξεκινήσεις το 30-Day Program.'}
        </p>
        <p className="text-gray-400 text-sm mb-12">
          Αν δεν το βρεις στα εισερχόμενα, έλεγξε τα spam.
        </p>
        <a href="/30days" className="text-sm tracking-widest uppercase text-[#0D0D0D] border-b border-[#0D0D0D] pb-1 hover:text-[#C9A96E] hover:border-[#C9A96E] transition-colors">
          Επιστροφή στο πρόγραμμα
        </a>
      </div>
    </main>
  )
}
