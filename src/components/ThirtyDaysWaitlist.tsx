'use client'

import { useEffect, useState } from 'react'
import { trackEvent } from '@/components/MetaPixel'
import { THIRTY_DAYS_CLOSES_AT, isThirtyDaysClosed } from '@/lib/thirtyDays'

/** true μετά το κλείσιμο. Αλλάζει μόνο του τη στιγμή του κλεισίματος, χωρίς refresh. */
export function useThirtyDaysClosed(): boolean {
  const [closed, setClosed] = useState(false)
  useEffect(() => {
    if (isThirtyDaysClosed()) { setClosed(true); return }
    if (THIRTY_DAYS_CLOSES_AT === null) return
    const ms = THIRTY_DAYS_CLOSES_AT - Date.now()
    if (ms > 2147483647) return
    const t = setTimeout(() => setClosed(true), ms + 500)
    return () => clearTimeout(t)
  }, [])
  return closed
}

/** Μήνυμα «οι θέσεις έκλεισαν» + φόρμα waitlist (MailerLite group: 30day waitlist) */
export default function ThirtyDaysWaitlist({ dark = false, source = '30days' }: { dark?: boolean; source?: string }) {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (state === 'loading') return
    setState('loading'); setError('')
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.success) throw new Error(data.error || 'Κάτι πήγε στραβά. Δοκίμασε ξανά.')
      setState('done')
      trackEvent('Lead', { content_name: '30days_waitlist' })
    } catch (err) {
      setState('error')
      setError((err as Error).message)
    }
  }

  const title = dark ? 'text-white' : 'text-black'
  const sub = dark ? 'text-gray-400' : 'text-gray-500'

  return (
    <div className="max-w-md mx-auto">
      <p className={`text-xs font-medium tracking-widest uppercase mb-3 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
        Οι εγγραφες εκλεισαν
      </p>
      <p className={`text-2xl font-semibold mb-3 ${title}`} style={{ fontFamily: 'Georgia, serif' }}>
        Οι θέσεις για αυτόν τον κύκλο έκλεισαν.
      </p>
      <p className={`mb-6 leading-relaxed ${sub}`}>
        Ο επόμενος κύκλος ανοίγει σύντομα. Άφησε το email σου και θα είσαι από τους πρώτους που θα το μάθουν.
      </p>

      {state === 'done' ? (
        <p className={`text-base font-medium ${title}`}>
          Είσαι στη λίστα. Θα σου γράψω πρώτα σε εσένα.
        </p>
      ) : (
        <form onSubmit={submit} className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Το email σου"
            autoComplete="email"
            className={`flex-1 px-5 py-4 rounded-full text-base outline-none border ${
              dark ? 'bg-white/10 border-white/20 text-white placeholder-gray-500 focus:border-white/50'
                   : 'bg-white border-gray-300 text-black placeholder-gray-400 focus:border-black'
            }`}
          />
          <button
            type="submit"
            disabled={state === 'loading'}
            className={`px-8 py-4 rounded-full text-base font-medium border-0 cursor-pointer transition-colors disabled:opacity-60 ${
              dark ? 'bg-white text-black hover:bg-gray-100' : 'bg-black text-white hover:bg-gray-800'
            }`}
          >
            {state === 'loading' ? 'Μια στιγμή…' : 'Θέλω θέση →'}
          </button>
        </form>
      )}
      {state === 'error' && <p className="text-sm text-red-500 mt-3">{error}</p>}
    </div>
  )
}
