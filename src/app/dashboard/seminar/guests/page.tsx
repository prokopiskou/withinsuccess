'use client'

import { useEffect, useMemo, useState } from 'react'

type Guest = { email: string; name: string; seats: number; ticket: 'live' | 'online'; at: string }
type Data = { guests: Guest[]; totals: { live: number; online: number } }

export default function SeminarGuestsPage() {
  const [data, setData] = useState<Data | null>(null)
  const [error, setError] = useState(false)
  const [q, setQ] = useState('')
  const [showOnline, setShowOnline] = useState(false)

  useEffect(() => {
    fetch('/api/dashboard/seminar-guests')
      .then(r => r.json())
      .then(d => (d.success ? setData(d) : setError(true)))
      .catch(() => setError(true))
  }, [])

  const list = useMemo(() => {
    if (!data) return []
    const term = q.trim().toLowerCase()
    return data.guests
      .filter(g => (showOnline ? g.ticket === 'online' : g.ticket === 'live'))
      .filter(g => !term || g.email.includes(term) || g.name.toLowerCase().includes(term))
  }, [data, q, showOnline])

  return (
    <main className="min-h-screen bg-white px-4 py-8 md:px-6 md:py-12">
      <div className="max-w-3xl mx-auto">
        <p className="text-xs tracking-widest uppercase text-gray-400 mb-2 print:hidden">Ανοιχτή Συζήτηση · 15/11</p>
        <h1 className="text-3xl font-semibold mb-6" style={{ fontFamily: 'Georgia, serif' }}>
          {showOnline ? 'Online συμμετέχοντες' : 'Λίστα εισόδου'}
        </h1>

        {error && <p className="text-red-500">Κάτι πήγε στραβά. Ανανέωσε τη σελίδα.</p>}
        {!data && !error && <p className="text-gray-400">Φόρτωση…</p>}

        {data && (
          <>
            <div className="flex flex-wrap gap-8 mb-6">
              <div><p className="text-3xl font-semibold">{data.totals.live}</p><p className="text-sm text-gray-500">θέσεις στην αίθουσα</p></div>
              <div><p className="text-3xl font-semibold">{data.totals.online}</p><p className="text-sm text-gray-500">online</p></div>
            </div>

            <div className="flex flex-wrap gap-3 mb-6 print:hidden">
              <input
                type="search"
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Αναζήτηση email ή ονόματος…"
                className="flex-1 min-w-[220px] border border-gray-300 rounded-full px-5 py-3 text-base"
                autoFocus
              />
              <button type="button" onClick={() => setShowOnline(v => !v)} className="px-5 py-3 rounded-full border border-gray-300 text-sm">
                {showOnline ? 'Δείξε αίθουσα' : 'Δείξε online'}
              </button>
              <button type="button" onClick={() => window.print()} className="px-5 py-3 rounded-full bg-black text-white text-sm">
                Εκτύπωση
              </button>
            </div>

            <div className="divide-y divide-gray-200 border-y border-gray-200">
              {list.map((g, i) => (
                <div key={`${g.email}-${i}`} className="flex items-center gap-4 py-4">
                  <span className="w-6 h-6 border border-gray-400 rounded flex-shrink-0" aria-hidden="true" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 break-all">{g.email || '(χωρίς email)'}</p>
                    <p className="text-sm text-gray-500">{g.name || '—'}</p>
                  </div>
                  <p className="text-xl font-semibold flex-shrink-0">× {g.seats}</p>
                </div>
              ))}
              {list.length === 0 && <p className="py-6 text-gray-400">Κανένα αποτέλεσμα.</p>}
            </div>
            <p className="text-xs text-gray-400 mt-6">Δεν περιλαμβάνονται αγορές με επιστροφή χρημάτων.</p>
          </>
        )}
      </div>
    </main>
  )
}
