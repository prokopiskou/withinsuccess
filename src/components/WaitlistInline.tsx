'use client'

import { useState } from 'react'

const GOLD = '#C9A96E'

type Props = {
  source?: string
  label?: string
}

export default function WaitlistInline({ source = 'within_path', label = 'Μπες στη λίστα αναμονής →' }: Props) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  async function submit() {
    if (submitting) return
    if (!/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
      setError(true)
      return
    }
    setError(false)
    setSubmitting(true)
    try {
      await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source }),
      })
    } catch (e) {
      console.error('waitlist failed', e)
    }
    setDone(true)
    setSubmitting(false)
  }

  if (done) {
    return (
      <p className="text-sm text-gray-700">
        Είσαι μέσα. Θα σε ειδοποιήσουμε πρώτο για τον επόμενο κύκλο.
      </p>
    )
  }

  return (
    <div className="max-w-md">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="το email σου"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(false) }}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          className="flex-1 rounded-full border border-gray-200 px-5 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
          style={{ borderColor: error ? '#EF4444' : undefined }}
        />
        <button
          type="button"
          onClick={submit}
          disabled={submitting}
          className="whitespace-nowrap text-black px-6 py-3 rounded-full text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-70"
          style={{ backgroundColor: GOLD }}
        >
          {submitting ? '...' : label}
        </button>
      </div>
      {error && <p className="text-xs text-red-500 mt-2">Βάλε ένα έγκυρο email.</p>}
    </div>
  )
}
