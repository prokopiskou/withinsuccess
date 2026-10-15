'use client'

import { useEffect, useState } from 'react'

type Q = { at: string; name: string; question: string }
type Data = { sold: { live: number; online: number }; questions: Q[] }

export default function SeminarQuestionsPage() {
  const [data, setData] = useState<Data | null>(null)
  const [error, setError] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch('/api/dashboard/seminar-questions')
      .then(r => r.json())
      .then(d => (d.success ? setData(d) : setError(true)))
      .catch(() => setError(true))
  }, [])

  function copyAll() {
    if (!data) return
    const text = data.questions.map((q, i) => `${i + 1}. ${q.name}: ${q.question}`).join('\n')
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <main className="min-h-screen bg-white px-6 py-12">
      <div className="max-w-3xl mx-auto">
        <p className="text-xs tracking-widest uppercase text-gray-400 mb-2">Ανοιχτή Συζήτηση · 15/11</p>
        <h1 className="text-3xl font-semibold mb-8" style={{ fontFamily: 'Georgia, serif' }}>Ερωτήσεις online</h1>

        {error && <p className="text-red-500">Κάτι πήγε στραβά. Ανανέωσε τη σελίδα.</p>}
        {!data && !error && <p className="text-gray-400">Φόρτωση…</p>}

        {data && (
          <>
            <div className="flex gap-8 mb-8">
              <div><p className="text-3xl font-semibold">{data.sold.live}</p><p className="text-sm text-gray-500">δια ζώσης</p></div>
              <div><p className="text-3xl font-semibold">{data.sold.online}</p><p className="text-sm text-gray-500">online</p></div>
              <div><p className="text-3xl font-semibold">{data.questions.length}</p><p className="text-sm text-gray-500">ερωτήσεις</p></div>
            </div>

            <button
              type="button"
              onClick={copyAll}
              disabled={data.questions.length === 0}
              className="mb-6 bg-black text-white px-6 py-3 rounded-full text-sm cursor-pointer border-0 disabled:opacity-40"
            >
              {copied ? 'Αντιγράφηκαν ✓' : 'Αντιγραφή όλων'}
            </button>

            <ol className="flex flex-col gap-3">
              {data.questions.map((q, i) => (
                <li key={i} className="p-5 border border-gray-100 rounded-2xl">
                  <p className="text-xs text-gray-400 mb-2">
                    {i + 1} · {q.name} · {new Date(q.at).toLocaleString('el-GR', { timeZone: 'Europe/Athens' })}
                  </p>
                  <p className="text-gray-800 leading-relaxed">{q.question}</p>
                </li>
              ))}
            </ol>
            {data.questions.length === 0 && <p className="text-gray-400">Δεν υπάρχουν ακόμα ερωτήσεις.</p>}
          </>
        )}
      </div>
    </main>
  )
}
