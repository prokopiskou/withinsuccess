'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

const STRIPE_LINK = 'https://book.stripe.com/00wdRadbFgPz1YBcNz4ZG1N'
const GOLD = '#C9A96E'

function getPricingInfo() {
  const now = new Date()
  const greece = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Athens' }))
  const month = greece.getMonth() + 1
  const day = greece.getDate()

  if (month === 5 && day <= 12) return { price: 89, next: null, deadline: '12 Μαΐου' }
  return { price: 89, next: null, deadline: '12 Μαΐου' }
}

function getFbCookies(): { fbp: string; fbc: string } {
  if (typeof document === 'undefined') return { fbp: '', fbc: '' }
  
  const cookies = document.cookie.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=')
    acc[key] = value
    return acc
  }, {} as Record<string, string>)
  
  return {
    fbp: cookies._fbp || '',
    fbc: cookies._fbc || ''
  }
}

function PageContent() {
  const searchParams = useSearchParams()
  const sid = searchParams.get('sid')
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const { price } = getPricingInfo()

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'ViewContent', {
        content_name: '63 Μέρες Ζωής - Άλμα Πίστης',
        content_type: 'product'
      })
    }
  }, [])

  const handleCheckout = async () => {
    setCheckoutLoading(true)
    
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'InitiateCheckout', {
        value: price,
        currency: 'EUR',
        content_name: '63 Μέρες Ζωής',
        content_type: 'product'
      })
    }
    
    if (!sid) { 
      window.location.href = STRIPE_LINK
      return 
    }
    
    const { fbp, fbc } = getFbCookies()
    
    try {
      const res = await fetch('/api/stripe/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          subscriber_id: sid,
          fbp,
          fbc
        })
      })
      const data = await res.json()
      
      if (data.url) {
        window.location.href = data.url
      } else {
        window.location.href = STRIPE_LINK
      }
    } catch { 
      window.location.href = STRIPE_LINK 
    }
    
    setCheckoutLoading(false)
  }

  return (
    <main className="min-h-screen bg-white text-black font-sans">
      <style>{`
        html { scroll-behavior: smooth; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.8s ease-out both; }
        .fade-in-2 { animation: fadeIn 0.8s ease-out 0.2s both; }
        .fade-in-3 { animation: fadeIn 0.8s ease-out 0.4s both; }
      `}</style>

      {/* HERO — Continuation of the moment */}
      <section className="pt-24 pb-12 px-6 max-w-xl mx-auto text-center">
        
        <div className="flex items-center justify-center gap-3 mb-12 fade-in">
          <div className="h-px w-12" style={{ backgroundColor: GOLD }} />
          <p className="text-xs font-medium tracking-[0.3em] uppercase" style={{ color: GOLD }}>
            Έφτασες εδώ
          </p>
          <div className="h-px w-12" style={{ backgroundColor: GOLD }} />
        </div>

        <h1 className="text-3xl md:text-4xl font-semibold leading-tight tracking-tight mb-8 fade-in" style={{ fontFamily: 'Georgia, serif' }}>
          Δεν χρειάζεται να<br />πεις τίποτα.
        </h1>

        <div className="text-base md:text-lg text-gray-600 leading-relaxed space-y-3 fade-in-2">
          <p>Σε ξέρω.</p>
          <p>Δεν με χρειάζεσαι να σε πείσω.</p>
          <p>Το έκανες ήδη μέσα σου.</p>
        </div>
      </section>

      {/* RECOGNITION — Hold the moment */}
      <section className="py-16 px-6 max-w-xl mx-auto">
        <div className="text-gray-700 leading-loose space-y-4 text-center">
          <p>Πάτησες εδώ επειδή κάτι μέσα σου αναγνώρισε αυτό που διάβασες.</p>
          
          <p>Δεν χρειάζεται να ξέρεις τι ακριβώς. Δεν χρειάζεται να εξηγήσεις στον εαυτό σου γιατί.</p>
          
          <p className="pt-6 text-lg font-semibold" style={{ fontFamily: 'Georgia, serif', color: GOLD }}>
            Είναι αρκετό που το ένιωσες.
          </p>
        </div>
      </section>

      {/* WHAT THIS IS — Not selling, naming */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-10">
            <div className="h-px w-8" style={{ backgroundColor: GOLD }} />
            <p className="text-xs font-medium tracking-[0.25em] text-gray-500 uppercase">Τι είναι αυτό</p>
            <div className="h-px w-8" style={{ backgroundColor: GOLD }} />
          </div>

          <p className="text-2xl md:text-3xl font-semibold mb-8 leading-tight" style={{ fontFamily: 'Georgia, serif' }}>
            63 μέρες<br />να εμφανιστείς για σένα.
          </p>

          <div className="text-gray-700 leading-relaxed space-y-4 text-base max-w-md mx-auto">
            <p>Όπως κανείς δεν εμφανίστηκε.</p>
            <p>Όχι μέσα από στόχους και λίστες.</p>
            <p>Μέσα από μία μικρή πράξη τη μέρα.</p>
            <p>Που σου λέει: <span className="italic">είμαι εδώ</span>.</p>
          </div>

          <div className="mt-12 inline-block bg-white rounded-2xl px-8 py-6 border border-gray-100 shadow-sm">
            <div className="space-y-3 text-sm text-gray-600 text-left">
              <div className="flex items-start gap-3">
                <span style={{ color: GOLD }}>—</span>
                <span>Κάθε Κυριακή: ηχητική καθοδήγηση + Playbook</span>
              </div>
              <div className="flex items-start gap-3">
                <span style={{ color: GOLD }}>—</span>
                <span>Κάθε μέρα: μία πράξη 1-2 λεπτών</span>
              </div>
              <div className="flex items-start gap-3">
                <span style={{ color: GOLD }}>—</span>
                <span>Καθημερινή παρουσία στο ιδιωτικό Viber channel</span>
              </div>
              <div className="flex items-start gap-3">
                <span style={{ color: GOLD }}>—</span>
                <span>Online τελετή αποφοίτησης στο τέλος</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* THE DECISION */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-md mx-auto text-center">
          
          <div className="flex items-center justify-center gap-3 mb-10">
            <div className="h-px w-8" style={{ backgroundColor: GOLD }} />
            <p className="text-xs font-medium tracking-[0.25em] text-gray-500 uppercase">Το άλμα πίστης</p>
            <div className="h-px w-8" style={{ backgroundColor: GOLD }} />
          </div>

          <p className="text-lg text-gray-700 leading-relaxed mb-10">
            Δεν θα ξέρεις σίγουρα.
          </p>
          <p className="text-lg text-gray-700 leading-relaxed mb-10">
            Δεν χρειάζεται να ξέρεις σίγουρα.
          </p>
          <p className="text-xl font-semibold leading-relaxed mb-12" style={{ fontFamily: 'Georgia, serif', color: GOLD }}>
            Χρειάζεται μόνο<br />να πεις ναι.
          </p>

          <div className="bg-gray-50 rounded-3xl p-10 border border-gray-100">
            <p className="text-xs tracking-widest text-gray-400 uppercase mb-4">Επένδυση</p>
            <p className="text-6xl font-semibold mb-3" style={{ fontFamily: 'Georgia, serif' }}>{price}€</p>
            <p className="text-xs text-gray-400 mb-8">Σήμερα είναι η τελευταία μέρα</p>
            
            <button
              onClick={handleCheckout}
              disabled={checkoutLoading}
              className="inline-block text-white px-12 py-4 rounded-full text-sm font-medium hover:opacity-90 transition-all hover:scale-[1.02] shadow-lg"
              style={{ backgroundColor: GOLD, cursor: checkoutLoading ? 'wait' : 'pointer', opacity: checkoutLoading ? 0.6 : 1 }}
            >
              {checkoutLoading ? 'Φόρτωση...' : 'Είμαι μέσα'}
            </button>
            
            <p className="text-xs text-gray-400 mt-6">Ξεκινάμε αύριο, 12 Μαΐου</p>
          </div>

          <p className="text-sm text-gray-500 mt-10 italic">
            Άν εμφανιστείς, θα είμαι εκεί.
          </p>
          <p className="text-sm text-gray-500 mt-1">— Προκόπης</p>
        </div>
      </section>

      {/* WHAT HAPPENS NEXT */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-xl mx-auto">
          
          <div className="flex items-center justify-center gap-3 mb-10">
            <div className="h-px w-8" style={{ backgroundColor: GOLD }} />
            <p className="text-xs font-medium tracking-[0.25em] text-gray-500 uppercase">Μετά την εγγραφή</p>
            <div className="h-px w-8" style={{ backgroundColor: GOLD }} />
          </div>

          <div className="space-y-4 max-w-md mx-auto">
            <div className="flex items-start gap-4">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 text-white" style={{ backgroundColor: GOLD }}>1</div>
              <p className="text-gray-700 text-sm leading-relaxed">
                Email επιβεβαίωσης σε λίγα λεπτά.
              </p>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 text-white" style={{ backgroundColor: GOLD }}>2</div>
              <p className="text-gray-700 text-sm leading-relaxed">
                Σύνδεσμος για το Viber channel στις 12 Μαΐου.
              </p>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 text-white" style={{ backgroundColor: GOLD }}>3</div>
              <p className="text-gray-700 text-sm leading-relaxed">
                Κυριακή 12 Μαΐου: ξεκινάς. Λαμβάνεις την πρώτη καθοδήγηση και το πρώτο Playbook.
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-12">
            Για οποιαδήποτε απορία: hello@withinsuccess.gr
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 px-6 bg-white border-t border-gray-100">
        <div className="max-w-6xl mx-auto flex flex-col items-center gap-4 text-center">
          <span className="text-lg font-semibold tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>WithinSuccess</span>
          <p className="text-xs text-gray-400">© 2026 WithinSuccess · Προκόπης Κούκης</p>
        </div>
      </footer>
    </main>
  )
}

export default function AlmaPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <PageContent />
    </Suspense>
  )
}