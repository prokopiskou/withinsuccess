'use client'

import { useState, type FormEvent } from 'react'

const GOLD = '#C9A96E'

type Props = {
  source?: string  // tracks which page user came from
}

export default function ClosedProgramCTA({ source = '63days' }: Props) {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email || submitting) return

    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Κάτι πήγε στραβά')
      }

      setSubmitted(true)
    } catch (err) {
      const e = err as Error
      setError(e.message || 'Σφάλμα. Δοκίμασε ξανά.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="text-center bg-white rounded-3xl px-8 py-6 shadow-sm border border-gray-100 max-w-2xl mx-auto">
        <p className="text-xs tracking-widest uppercase mb-2" style={{ color: GOLD }}>Είσαι μέσα στη waitlist</p>
        <p className="text-xl sm:text-2xl font-semibold mb-2" style={{ fontFamily: 'Georgia, serif' }}>
          Θα είσαι ο πρώτος που θα μάθει
        </p>
        <p className="text-sm text-gray-500">
          Λίγο πριν ανοίξει ο επόμενος κύκλος θα ενημερωθείς με email.
        </p>
      </div>
    )
  }

  return (
    <div className="text-center bg-white rounded-3xl px-8 py-6 shadow-sm border border-gray-100 max-w-2xl mx-auto">
      <p className="text-xs tracking-widest uppercase mb-2" style={{ color: GOLD }}>Πρόγραμμα κλειστό</p>
      <p className="text-2xl sm:text-3xl font-semibold mb-3" style={{ fontFamily: 'Georgia, serif' }}>
        Έκλεισε για αυτόν τον κύκλο
      </p>
      <p className="text-sm text-gray-500 mb-5 max-w-md mx-auto leading-relaxed">
        Άσε το email σου εδώ. Μόλις ανοίξει ο επόμενος κύκλος, θα μάθεις πρώτος.
      </p>
      
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@σου.gr"
          required
          disabled={submitting}
          className="flex-1 px-4 py-3 rounded-full border border-gray-200 text-sm focus:outline-none focus:border-gray-400 transition-colors"
        />
        <button
          type="submit"
          disabled={submitting || !email}
          className="text-white px-8 py-3 rounded-full text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50"
          style={{ backgroundColor: GOLD }}
        >
          {submitting ? 'Φόρτωση...' : 'Μπες στη waitlist'}
        </button>
      </form>

      {error && (
        <p className="text-xs text-red-600 mt-3">{error}</p>
      )}

      <p className="text-xs text-gray-400 mt-3">
        Τα δεδομένα σου είναι ασφαλή.
      </p>
    </div>
  )
}
