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

  if (month === 4 && day <= 27) return { price: 69, next: 89, deadline: '27 Απριλίου' }
  if ((month === 4 && day > 27) || (month === 5 && day <= 4)) return { price: 89, next: 109, deadline: '4 Μαΐου' }
  if (month === 5 && day <= 11) return { price: 109, next: null, deadline: '11 Μαΐου' }
  return { price: 109, next: null, deadline: '11 Μαΐου' }
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

const testimonialImages = [
  '/testimonial63_1.webp','/Testimonial63_2.webp','/testimonial63_3.webp',
]

function Carousel({ images }: { images: string[] }) {
  const [current, setCurrent] = useState(0)
  const prev = () => setCurrent(c => Math.max(0, c - 1))
  const next = () => setCurrent(c => Math.min(images.length - 1, c + 1))

  return (
    <div className="w-full">
      <div className="relative flex items-center justify-center">
        <button onClick={prev} className="absolute left-0 z-10 w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:border-gray-400 hover:text-black transition-all text-sm bg-white shadow-sm">{'<'}</button>
        <div className="w-full flex justify-center px-12">
          <img src={images[current]} alt="" className="rounded-2xl max-w-full max-h-[70vh] object-contain shadow-md" />
        </div>
        <button onClick={next} className="absolute right-0 z-10 w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:border-gray-400 hover:text-black transition-all text-sm bg-white shadow-sm">{'>'}</button>
      </div>
      <div className="flex items-center justify-center gap-2 mt-6">
        {images.map((_, i) => (
          <button key={i} onClick={() => setCurrent(i)} className={`h-1.5 rounded-full transition-all ${i === current ? 'bg-black w-6' : 'bg-gray-300 w-1.5'}`} />
        ))}
      </div>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center gap-3 mb-10">
      <div className="h-px w-8" style={{ backgroundColor: GOLD }} />
      <p className="text-xs font-medium tracking-[0.25em] text-gray-500 uppercase">{children}</p>
      <div className="h-px w-8" style={{ backgroundColor: GOLD }} />
    </div>
  )
}

function PricingBlock({ onCheckout, loading, ctaLabel = 'Είμαι μέσα' }: { onCheckout: () => void; loading: boolean; ctaLabel?: string }) {
  const { price, next, deadline } = getPricingInfo()
  return (
    <div className="text-center bg-white rounded-3xl p-10 shadow-sm border border-gray-100">
      <p className="text-xs tracking-widest text-gray-400 uppercase mb-4">Επένδυση</p>
      <p className="text-6xl font-semibold mb-3" style={{ fontFamily: 'Georgia, serif' }}>{price}€</p>
      <p className="text-xs text-gray-400 mb-8">
        {next ? `Μετά τις ${deadline}: ${next}€` : `Τελευταία ευκαιρία μέχρι ${deadline}`}
      </p>
      <button
        onClick={onCheckout}
        disabled={loading}
        className="inline-block text-white px-10 py-4 rounded-full text-sm font-medium hover:opacity-90 transition-all hover:scale-[1.02] shadow-lg"
        style={{ backgroundColor: GOLD, cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.6 : 1 }}
      >
        {loading ? 'Φόρτωση...' : ctaLabel}
      </button>
      <p className="text-xs text-gray-400 mt-5">Έναρξη 12 Μαΐου</p>
    </div>
  )
}

function PageContent() {
  const searchParams = useSearchParams()
  const sid = searchParams.get('sid')
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  useEffect(() => {
    async function load() {
      if (!sid) { setLoading(false); return }
      try {
        await fetch('/api/manychat/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscriber_id: sid })
        })
      } catch {}
      setLoading(false)
    }
    load()
  }, [sid])

  const handleCheckout = async () => {
    setCheckoutLoading(true)
    
    const pricing = getPricingInfo()
    
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'InitiateCheckout', {
        value: pricing.price,
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

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 40, height: 40, border: '2px solid #000', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
    </div>
  )

  return (
    <main className="min-h-screen bg-white text-black font-sans">
      <style>{`html { scroll-behavior: smooth; }`}</style>

      {/* HERO — DOOR STORY */}
      <section className="pt-20 pb-16 px-6 max-w-2xl mx-auto">
        <p className="text-xs font-medium tracking-[0.3em] uppercase mb-10 text-center" style={{ color: GOLD }}>63 Μέρες της Ζωής σου</p>
        
        <h1 className="text-3xl md:text-5xl font-semibold leading-tight tracking-tight mb-12 text-center" style={{ fontFamily: 'Georgia, serif' }}>
          Δεν θα ανοίξει η πόρτα.
        </h1>

        <div className="text-lg text-gray-700 leading-loose space-y-5">
          <p>Όλη σου τη ζωή περίμενες κάποιον να μπει.</p>
          
          <p>Να σε δει. Να σε καταλάβει. Να σου πει μπράβο. Να σου δώσει την άδεια να ξεκουραστείς, να πεις όχι, να ζήσεις τη ζωή που ήθελες.</p>
          
          <p>Δεν θα έρθει.</p>
          
          <p>Όχι επειδή δεν σε αγαπάνε.</p>
          
          <p>Επειδή δεν μπορούν να σου δώσουν αυτό που δεν έχουν δώσει στον εαυτό τους.</p>
          
          <p className="pt-4 text-xl font-semibold" style={{ fontFamily: 'Georgia, serif' }}>
            Η άδεια που χρειάζεσαι ήταν δική σου από την αρχή.
          </p>
          
          <p>Απλά κανείς δεν σου είπε ποτέ ότι την είχες ήδη.</p>
        </div>

        <div className="mt-16 text-center">
          <a
            href="#pws"
            className="inline-block text-white px-10 py-4 rounded-full text-sm font-medium hover:opacity-90 transition-all hover:scale-[1.02] shadow-lg"
            style={{ backgroundColor: GOLD }}
          >
            Δες πως
          </a>
          <p className="text-xs text-gray-400 mt-4">Έναρξη 12 Μαΐου</p>
        </div>
      </section>

      {/* TRANSITION — REFRAME */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-2xl md:text-3xl font-semibold leading-snug mb-8" style={{ fontFamily: 'Georgia, serif' }}>
            Σταμάτα να κοιτάς την πόρτα.
          </p>
          <p className="text-2xl md:text-3xl font-semibold leading-snug mb-12" style={{ fontFamily: 'Georgia, serif', color: GOLD }}>
            Γύρνα μέσα.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Δώσε στον εαυτό σου όλα αυτά που δεν πήρες.
          </p>
          <p className="text-gray-600 leading-relaxed mt-2">
            Όλα. Χωρίς εξαιρέσεις. Χωρίς δικαιολογίες.
          </p>
        </div>
      </section>

      {/* ΤΙ ΕΙΝΑΙ — INFO */}
      <section id="pws" className="py-20 px-6 bg-white scroll-mt-8">
        <div className="max-w-3xl mx-auto">
          <SectionLabel>Τι είναι το 63 μέρες ζωής</SectionLabel>
          <div className="text-gray-700 leading-relaxed space-y-3 mb-12 text-center">
            <p className="text-2xl md:text-3xl font-semibold" style={{ fontFamily: 'Georgia, serif' }}>Ένα 63ήμερο πλαίσιο.</p>
            <p className="text-lg text-gray-500">Για να μάθεις να εμφανίζεσαι. Για τον εαυτό σου.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white" style={{ backgroundColor: GOLD }}>1</div>
                <h3 className="text-lg font-semibold" style={{ fontFamily: 'Georgia, serif' }}>Κάθε Κυριακή</h3>
              </div>
              <div className="space-y-3 text-gray-600 text-sm">
                <div className="flex items-start gap-3"><span className="text-gray-300 mt-0.5">—</span><span>Ηχητική καθοδήγηση 7 λεπτών</span></div>
                <div className="flex items-start gap-3"><span className="text-gray-300 mt-0.5">—</span><span>Το Playbook της εβδομάδας</span></div>
                <div className="flex items-start gap-3"><span className="text-gray-300 mt-0.5">—</span><span>Η συμφωνία με τον εαυτό σου</span></div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white" style={{ backgroundColor: GOLD }}>2</div>
                <h3 className="text-lg font-semibold" style={{ fontFamily: 'Georgia, serif' }}>Κάθε μέρα</h3>
              </div>
              <div className="space-y-3 text-gray-600 text-sm">
                <div className="flex items-start gap-3"><span className="text-gray-300 mt-0.5">—</span><span>Καθοδήγηση στο Viber channel</span></div>
                <div className="flex items-start gap-3"><span className="text-gray-300 mt-0.5">—</span><span>Μία πράξη 1-2 λεπτών</span></div>
                <div className="flex items-start gap-3"><span className="text-gray-300 mt-0.5">—</span><span>Καμία απόφαση. Μόνο εμφάνιση.</span></div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white" style={{ backgroundColor: GOLD }}>3</div>
                <h3 className="text-lg font-semibold" style={{ fontFamily: 'Georgia, serif' }}>Κάθε εβδομάδα</h3>
              </div>
              <div className="space-y-3 text-gray-600 text-sm">
                <div className="flex items-start gap-3"><span className="text-gray-300 mt-0.5">—</span><span>Αυτοστοχασμός</span></div>
                <div className="flex items-start gap-3"><span className="text-gray-300 mt-0.5">—</span><span>Δομημένη αυτοαξιολόγηση</span></div>
                <div className="flex items-start gap-3"><span className="text-gray-300 mt-0.5">—</span><span>Επόμενο επίπεδο</span></div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white" style={{ backgroundColor: GOLD }}>4</div>
                <h3 className="text-lg font-semibold" style={{ fontFamily: 'Georgia, serif' }}>Στο τέλος</h3>
              </div>
              <div className="space-y-3 text-gray-600 text-sm">
                <div className="flex items-start gap-3"><span className="text-gray-300 mt-0.5">—</span><span>Online τελετή αποφοίτησης</span></div>
                <div className="flex items-start gap-3"><span className="text-gray-300 mt-0.5">—</span><span>Πρόσβαση στο υλικό για πάντα</span></div>
                <div className="flex items-start gap-3"><span className="text-gray-300 mt-0.5">—</span><span>Η στιγμή που βλέπεις τι άλλαξε</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ΓΙΑΤΙ ΔΟΥΛΕΥΕΙ */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-2xl mx-auto text-center">
          <SectionLabel>Γιατί δουλεύει</SectionLabel>
          <p className="text-2xl md:text-3xl font-semibold mb-2" style={{ fontFamily: 'Georgia, serif' }}>Δεν βασίζεται στη διάθεση.</p>
          <p className="text-2xl md:text-3xl font-semibold mb-12" style={{ fontFamily: 'Georgia, serif', color: GOLD }}>Βασίζεται στη δράση.</p>
          
          <div className="space-y-3 text-gray-700">
            <p className="text-lg">63 πράξεις.</p>
            <p className="text-lg">63 αποδείξεις στον εαυτό σου.</p>
            <p className="text-lg">Ότι δεν χρειάζεσαι την άδεια κανενός.</p>
          </div>
        </div>
      </section>

      {/* WITHIN PATH */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-2xl mx-auto text-center">
          <SectionLabel>The Within Path™</SectionLabel>
          <p className="text-gray-600 mb-2">Η μέθοδος που χρησιμοποιώ σε 1-1 coaching 7 χρόνια.</p>
          <p className="text-gray-600 mb-10">Πρώτη φορά σε μορφή συστήματος.</p>

          <div className="space-y-3 max-w-md mx-auto">
            {[
              { stage: 'AWAKE', desc: 'Βλέπεις καθαρά' },
              { stage: 'PAUSE', desc: 'Σταματάς το νοητικό θόρυβο' },
              { stage: 'REMEMBER', desc: 'Επανασυνδέεσαι με αυτό που είσαι' },
              { stage: 'ALIGN', desc: 'Ευθυγραμμίζεσαι με ό,τι έχει νόημα' },
              { stage: 'EMBODY', desc: 'Ζεις τη νέα σου εκδοχή' },
            ].map((item, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-5 flex items-center gap-4 text-left">
                <span className="text-xs font-bold tracking-widest" style={{ color: GOLD, minWidth: 90 }}>{item.stage}</span>
                <span className="text-gray-700 text-sm">{item.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <SectionLabel>Αυτοί το έζησαν</SectionLabel>
          <Carousel images={testimonialImages} />
        </div>
      </section>

      {/* Η ΑΠΟΦΑΣΗ */}
      <section id="apofasi" className="py-20 px-6 bg-white scroll-mt-8">
        <div className="max-w-xl mx-auto text-center">
          <SectionLabel>Η απόφαση</SectionLabel>
          <h2 className="text-3xl md:text-4xl font-semibold mb-10 leading-tight" style={{ fontFamily: 'Georgia, serif' }}>
            Δώσε στον εαυτό σου<br />
            όλα αυτά που δεν πήρες.
          </h2>
          <div className="text-gray-700 leading-relaxed space-y-3 mb-12">
            <p>63 μέρες δομής.</p>
            <p>Για να μάθεις να εμφανίζεσαι.</p>
            <p>Για τον μοναδικό άνθρωπο που σε περιμένει πραγματικά.</p>
            <p className="font-semibold pt-2" style={{ fontFamily: 'Georgia, serif' }}>Τον εαυτό σου.</p>
          </div>
          <PricingBlock onCheckout={handleCheckout} loading={checkoutLoading} />
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <SectionLabel>Συχνές ερωτήσεις</SectionLabel>
          <div className="space-y-3">
            {[
              { q: 'Πόσο χρόνο χρειάζεται καθημερινά;', a: '1-2 λεπτά στο Viber. 5-10 λεπτά για το εβδομαδιαίο ηχητικό.' },
              { q: 'Τι γίνεται αν χάσω μία μέρα;', a: 'Θα χάσεις. Δεν θα είναι η πρώτη φορά. Συνεχίζεις την επόμενη χωρίς το βάρος του χθες.' },
              { q: 'Τι γίνεται αν δεν έχω διάθεση;', a: 'Η διάθεση δεν είναι προϋπόθεση. Η πράξη είναι μικρή ακριβώς γι\' αυτόν τον λόγο.' },
              { q: 'Είναι 1-1;', a: 'Όχι. Είναι πρόγραμμα με ιδιωτικό Viber channel για όλους.' },
              { q: 'Θα χρειαστεί να μιλήσω σε άλλους;', a: 'Όχι. Το Viber channel είναι μονόδρομο. Λαμβάνεις, δεν εκτίθεσαι.' },
              { q: 'Χρειάζεται εμπειρία σε αυτοβελτίωση;', a: 'Όχι. Κάθε μέρα ένα ξεκάθαρο βήμα.' },
              { q: 'Τι αλλάζει σε 63 μέρες;', a: 'Η σχέση με τον εαυτό σου. Όχι επειδή γίνεσαι διαφορετικός. Επειδή γίνεσαι δικός σου.' },
            ].map((item, i) => (
              <details key={i} className="bg-white rounded-xl px-6 group border border-gray-100">
                <summary className="py-5 cursor-pointer flex items-center justify-between text-sm font-medium text-gray-800 hover:text-black list-none">
                  <span>{item.q}</span>
                  <span className="text-gray-400 group-open:rotate-45 transition-transform text-lg ml-4">+</span>
                </summary>
                <p className="pb-5 text-sm text-gray-600 leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-xl mx-auto text-center">
          <p className="text-2xl md:text-3xl font-semibold mb-4 leading-snug" style={{ fontFamily: 'Georgia, serif' }}>
            Δεν θα σου ανοίξουν την πόρτα.
          </p>
          <p className="text-gray-600 mb-12">Και δεν χρειάζεται.</p>
          <PricingBlock onCheckout={handleCheckout} loading={checkoutLoading} />
          <p className="text-xs text-gray-400 mt-10">
            hello@withinsuccess.gr
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 px-6 bg-gray-50 border-t border-gray-100">
        <div className="max-w-6xl mx-auto flex flex-col items-center gap-4 text-center">
          <span className="text-lg font-semibold tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>WithinSuccess</span>
          <p className="text-xs text-gray-400">© 2026 WithinSuccess · Προκόπης Κούκης</p>
        </div>
      </footer>
    </main>
  )
}

export default function DoorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <PageContent />
    </Suspense>
  )
}