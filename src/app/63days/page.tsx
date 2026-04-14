'use client'

import { Suspense, useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import SiteNav from '@/components/SiteNav'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const STRIPE_LINK = 'https://buy.stripe.com/00wdRadbFgPz1YBcNz4ZG1N'
const GOLD = '#C9A96E'

function getPersonalizedHeadline(painPoint: string | null): string {
  if (!painPoint) return 'Η πιο επώδυνη ανθρώπινη ύπαρξη δεν είναι να χάσεις τα πάντα. Είναι να μην τολμήσεις να χάσεις ποτέ τίποτα.'
  return `Αυτό που κουβαλάς — "${painPoint}" — είναι ακριβώς από εκεί που ξεκινάμε.`
}

const broadcastImages = [
  '/broadcast.webp',
  '/broadcast1.webp',
  '/broadcast2.webp',
  '/broadcast3.webp',
  '/broadcast4.webp',
  '/broadcast5.webp',
  '/broadcast6.webp',
]

const testimonialImages = [
  '/testimonial63_1.webp',
  '/Testimonial63_2.webp',
  '/testimonial63_3.webp',
]

function Carousel({ images }: { images: string[] }) {
  const [current, setCurrent] = useState(0)
  const trackRef = useRef<HTMLDivElement>(null)

  const goTo = (i: number) => {
    setCurrent(i)
    trackRef.current?.scrollTo({ left: i * trackRef.current.offsetWidth, behavior: 'smooth' })
  }

  const prev = () => goTo(Math.max(0, current - 1))
  const next = () => goTo(Math.min(images.length - 1, current + 1))

  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    const onScroll = () => {
      const i = Math.round(el.scrollLeft / el.offsetWidth)
      setCurrent(i)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="w-full">
      <style>{`.hide-scroll::-webkit-scrollbar{display:none}`}</style>
      <div
        ref={trackRef}
        className="hide-scroll flex overflow-x-auto"
        style={{ scrollSnapType: 'x mandatory', scrollbarWidth: 'none' }}
      >
        {images.map((src, i) => (
          <div key={`${i}-${src}`} className="flex-shrink-0 w-full" style={{ scrollSnapAlign: 'start' }}>
            <img src={src} alt="" className="w-full rounded-2xl object-cover" />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-4">
        <button onClick={prev} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:border-gray-400 hover:text-black transition-all text-sm">←</button>
        <div className="flex gap-2">
          {images.map((_, i) => (
            <button key={i} onClick={() => goTo(i)} className={`h-1.5 rounded-full transition-all ${i === current ? 'bg-black w-4' : 'bg-gray-300 w-1.5'}`} />
          ))}
        </div>
        <button onClick={next} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:border-gray-400 hover:text-black transition-all text-sm">→</button>
      </div>
    </div>
  )
}

function PageContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [painPoint, setPainPoint] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchConversation() {
      if (!token) { setLoading(false); return }
      const { data } = await supabase
        .from('manychat_conversations')
        .select('last_user_message')
        .eq('subscriber_id', token)
        .single()
      if (data?.last_user_message) setPainPoint(data.last_user_message)
      setLoading(false)
    }
    fetchConversation()
  }, [token])

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ width: 40, height: 40, border: '2px solid #000', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  return (
    <main className="min-h-screen bg-white text-black font-sans">
      <SiteNav ctaHref="/assessment" ctaLabel="Ξεκίνα εδώ →" />

      {/* HERO */}
      <section className="pt-32 pb-16 px-6 max-w-3xl mx-auto text-center">
        <p className="text-sm font-medium tracking-widest text-gray-400 uppercase mb-6">63 Μέρες της Ζωής σου</p>
        <h1 className="text-3xl md:text-5xl font-semibold leading-tight tracking-tight mb-8" style={{ fontFamily: 'Georgia, serif' }}>
          {getPersonalizedHeadline(painPoint)}
        </h1>
        <p className="text-lg text-gray-500 leading-relaxed mb-12">
          63 ημέρες. Κάθε εβδομάδα ένα θέμα. Κάθε μέρα μία πράξη.<br />
          Όχι τεχνικές. Όχι λίστες. Μόνο αυτό που ξέρεις ήδη αλλά δεν έχεις ζήσει.
        </p>
        <div className="flex flex-col gap-3 max-w-sm mx-auto mb-12 text-left">
          {[
            '9 φωνητικά μηνύματα — κάθε Κυριακή',
            '9 Playbooks — καθημερινές πράξεις 1-3 λεπτών',
            'Πρόσβαση στην κοινότητα για 63 ημέρες',
            'Ξεκινάς 12 Μαΐου'
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="text-gray-300 mt-1">—</span>
              <span className="text-gray-600 text-sm leading-relaxed">{item}</span>
            </div>
          ))}
        </div>
        <div className="mb-8">
          <p className="text-xs font-medium tracking-widest text-gray-400 uppercase mb-2">Επένδυση</p>
          <p className="text-5xl font-semibold" style={{ fontFamily: 'Georgia, serif' }}>€69</p>
        </div>
        
          href={STRIPE_LINK}
          className="inline-block text-white px-10 py-4 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
          style={{ backgroundColor: GOLD }}
        >
          Κατοχύρωσε τη θέση σου →
        </a>
      </section>

      {/* BROADCAST */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <p className="text-sm font-medium tracking-widest text-gray-400 uppercase mb-8 text-center">Μέσα στο broadcast channel</p>
          <Carousel images={broadcastImages} />
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-2xl mx-auto">
          <p className="text-sm font-medium tracking-widest text-gray-400 uppercase mb-8 text-center">Αυτοί το έζησαν</p>
          <Carousel images={testimonialImages} />
        </div>
      </section>

      {/* SECOND CTA */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-3xl font-semibold mb-6" style={{ fontFamily: 'Georgia, serif' }}>
            Η στιγμή είναι τώρα.
          </h2>
          <p className="text-gray-500 mb-8">
            Ο χειμώνας πέρασε. Η άνοιξη τελειώνει.<br />
            Το καλοκαίρι έρχεται και έχεις ακόμα 63 μέρες μπροστά σου.
          </p>
          
            href={STRIPE_LINK}
            className="inline-block text-white px-10 py-4 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
            style={{ backgroundColor: GOLD }}
          >
            Κατοχύρωσε τη θέση σου →
          </a>
          <p className="text-xs text-gray-400 mt-4">Περιορισμένες θέσεις. Έναρξη 12 Μαΐου 2026.</p>
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

export default function SixtyThreeDaysPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <PageContent />
    </Suspense>
  )
}