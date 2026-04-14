'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const STRIPE_LINK = 'https://buy.stripe.com/00wdRadbFgPz1YBcNz4ZG1N'

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

function getPersonalizedHeadline(painPoint: string | null): string {
  if (!painPoint) return 'Η πιο επώδυνη ανθρώπινη ύπαρξη δεν είναι να χάσεις τα πάντα. Είναι να μην τολμήσεις να χάσεις ποτέ τίποτα.'
  return `Αυτό που κουβαλάς — "${painPoint}" — είναι ακριβώς από εκεί που ξεκινάμε.`
}

function Carousel({ images }: { images: string[] }) {
  const [current, setCurrent] = useState(0)
  const scrollerRef = useRef<HTMLDivElement>(null)

  const scrollToIndex = (index: number) => {
    const el = scrollerRef.current
    if (!el) return
    const clamped = Math.max(0, Math.min(images.length - 1, index))
    const w = el.clientWidth
    el.scrollTo({ left: clamped * w, behavior: 'smooth' })
    setCurrent(clamped)
  }

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    const onScroll = () => {
      const w = el.clientWidth
      if (w === 0) return
      const idx = Math.round(el.scrollLeft / w)
      setCurrent(Math.min(images.length - 1, Math.max(0, idx)))
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [images.length])

  const arrowStyle = {
    background: 'transparent',
    border: '0.5px solid rgba(255,255,255,0.25)',
    color: '#fff',
    padding: '10px 18px',
    cursor: 'pointer',
    borderRadius: 4,
    fontSize: 18,
    lineHeight: 1,
  } as const

  return (
    <div style={{ width: '100%', position: 'relative', background: '#000' }}>
      <div
        ref={scrollerRef}
        style={{
          display: 'flex',
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          borderRadius: 4,
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
        className="carousel-scroller"
      >
        <style>{`.carousel-scroller::-webkit-scrollbar { display: none; }`}</style>
        {images.map((src, i) => (
          <div
            key={`${i}-${src}`}
            style={{
              flex: '0 0 100%',
              width: '100%',
              minWidth: '100%',
              scrollSnapAlign: 'start',
              boxSizing: 'border-box',
            }}
          >
            <img
              src={src}
              alt=""
              style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 4 }}
            />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 16 }}>
        {images.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => scrollToIndex(i)}
            aria-label={`Slide ${i + 1}`}
            style={{
              width: i === current ? 24 : 8,
              height: 8,
              borderRadius: 4,
              background: i === current ? '#fff' : 'rgba(255,255,255,0.35)',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              transition: 'width 0.2s, background 0.2s',
            }}
          />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
        <button
          type="button"
          onClick={() => scrollToIndex(current - 1)}
          style={arrowStyle}
        >
          ←
        </button>
        <span style={{ fontSize: 13, opacity: 0.45, color: '#fff' }}>
          {current + 1} / {images.length}
        </span>
        <button
          type="button"
          onClick={() => scrollToIndex(current + 1)}
          style={arrowStyle}
        >
          →
        </button>
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
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ width: 40, height: 40, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#000', color: '#fff', fontFamily: '"Playfair Display", Georgia, serif', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 24px', maxWidth: 640, margin: '0 auto' }}>

      <div style={{ fontSize: 120, fontWeight: 700, lineHeight: 1, marginBottom: 48, letterSpacing: -4 }}>63</div>

      <h1 style={{ fontSize: 28, fontWeight: 400, lineHeight: 1.4, textAlign: 'center', marginBottom: 48 }}>
        {getPersonalizedHeadline(painPoint)}
      </h1>

      <div style={{ width: 40, height: 1, background: '#fff', opacity: 0.3, marginBottom: 48 }} />

      <p style={{ fontSize: 16, lineHeight: 1.8, textAlign: 'center', opacity: 0.7, marginBottom: 48 }}>
        63 ημέρες. Κάθε εβδομάδα ένα θέμα. Κάθε μέρα μία πράξη. Όχι τεχνικές. Όχι λίστες. Μόνο αυτό που ξέρεις ήδη αλλά δεν έχεις ζήσει.
      </p>

      <div style={{ width: '100%', marginBottom: 48 }}>
        {['9 φωνητικά μηνύματα — κάθε Κυριακή', '9 Playbooks — καθημερινές πράξεις 1-3 λεπτών', 'Πρόσβαση στην κοινότητα για 63 ημέρες', 'Ξεκινάς 12 Μαΐου'].map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
            <span style={{ opacity: 0.4, fontSize: 14, marginTop: 2 }}>—</span>
            <span style={{ fontSize: 16, lineHeight: 1.6, opacity: 0.85 }}>{item}</span>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 40, textAlign: 'center' }}>
        <span style={{ fontSize: 14, opacity: 0.5, letterSpacing: 2, textTransform: 'uppercase' }}>Επένδυση</span>
        <div style={{ fontSize: 48, fontWeight: 700, marginTop: 8 }}>€69</div>
      </div>

      <a href={STRIPE_LINK} style={{ display: 'block', width: '100%', padding: '18px 0', background: '#fff', color: '#000', textAlign: 'center', fontSize: 16, fontWeight: 600, letterSpacing: 1, textDecoration: 'none' }}>
        Κατοχύρωσε τη θέση σου
      </a>

      <p style={{ fontSize: 13, opacity: 0.4, letterSpacing: 2, textTransform: 'uppercase', marginTop: 48, marginBottom: 20, textAlign: 'center' }}>
        Μέσα στο broadcast channel
      </p>

      <div style={{ width: '100%', marginBottom: 48 }}>
        <Carousel images={broadcastImages} />
      </div>

      <div style={{ width: '100%', marginBottom: 48 }}>
        <Carousel images={testimonialImages} />
      </div>

      <a href={STRIPE_LINK} style={{ display: 'block', width: '100%', padding: '18px 0', background: '#fff', color: '#000', textAlign: 'center', fontSize: 16, fontWeight: 600, letterSpacing: 1, textDecoration: 'none' }}>
        Κατοχύρωσε τη θέση σου
      </a>

      <p style={{ marginTop: 32, fontSize: 13, opacity: 0.3, textAlign: 'center' }}>
        Περιορισμένες θέσεις. Έναρξη 12 Μαΐου 2026.
      </p>

    </div>
  )
}

export default function SixtyThreeDaysPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#000' }} />}>
      <PageContent />
    </Suspense>
  )
}