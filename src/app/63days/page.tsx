'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const STRIPE_LINK = 'https://buy.stripe.com/00wdRadbFgPz1YBcNz4ZG1N'

function getPersonalizedHeadline(painPoint: string | null): string {
  if (!painPoint) return 'Η πιο επώδυνη ανθρώπινη ύπαρξη δεν είναι να χάσεις τα πάντα. Είναι να μην τολμήσεις να χάσεις ποτέ τίποτα.'
  return `Αυτό που κουβαλάς — "${painPoint}" — είναι ακριβώς από εκεί που ξεκινάμε.`
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
      <h1 style={{ fontSize: 28, fontWeight: 400, lineHeight: 1.4, textAlign: 'center', marginBottom: 48 }}>{getPersonalizedHeadline(painPoint)}</h1>
      <div style={{ width: 40, height: 1, background: '#fff', opacity: 0.3, marginBottom: 48 }} />
      <p style={{ fontSize: 16, lineHeight: 1.8, textAlign: 'center', opacity: 0.7, marginBottom: 48 }}>63 ημέρες. Κάθε εβδομάδα ένα θέμα. Κάθε μέρα μία πράξη. Όχι τεχνικές. Όχι λίστες. Μόνο αυτό που ξέρεις ήδη αλλά δεν έχεις ζήσει.</p>
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
      <p style={{ marginTop: 32, fontSize: 13, opacity: 0.3, textAlign: 'center' }}>Περιορισμένες θέσεις. Έναρξη 12 Μαΐου 2026.</p>
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