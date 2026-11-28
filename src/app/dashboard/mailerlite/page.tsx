'use client'

import { useState } from 'react'
import Link from 'next/link'

type Plan = {
  since: string
  unsubscribedInGroup?: number
  resubscribe?: { email: string; bought: string; unsubscribed_at: string | null }[]
  resubscribed?: string[]
  failed?: string[]
  skipped: { email: string; reason: string }[]
  error?: string
}

/** Αγοραστές 30 Μερών που είναι unsubscribed στο MailerLite → resubscribe */
export default function MailerLiteFix() {
  const [since, setSince] = useState('2026-11-20')
  const [plan, setPlan] = useState<Plan | null>(null)
  const [busy, setBusy] = useState(false)
  const [rt, setRt] = useState<{ automations?: { name: string }[]; buyers?: number; missing?: { email: string }[]; retriggered?: string[]; failed?: string[]; error?: string } | null>(null)

  async function retrigger(method: 'GET' | 'POST') {
    if (method === 'POST' && !confirm(`Βγάζω και ξαναβάζω ${rt?.missing?.length ?? 0} άτομα στο group 30 Μέρες για να ξεκινήσει ο αυτοματισμός. Συνέχεια;`)) return
    setBusy(true)
    const r = await fetch(`/api/dashboard/mailerlite-retrigger?since=${since}`, { method, cache: 'no-store' })
    setRt(await r.json())
    setBusy(false)
  }

  async function call(method: 'GET' | 'POST') {
    if (method === 'POST' && !confirm(`Resubscribe ${plan?.resubscribe?.length ?? 0} αγοραστών;`)) return
    setBusy(true)
    const r = await fetch(`/api/dashboard/mailerlite-resubscribe?since=${since}`, { method, cache: 'no-store' })
    setPlan(await r.json())
    setBusy(false)
  }

  return (
    <main className="min-h-screen bg-[#FAFAF8] text-[#171717]">
      <div className="max-w-3xl mx-auto px-5 py-8 space-y-5">
        <div>
          <Link href="/dashboard" className="text-xs text-gray-400 hover:text-black">← Dashboard</Link>
          <h1 className="text-2xl font-semibold mt-1">MailerLite · 30 Μέρες</h1>
          <p className="text-sm text-gray-500 mt-1">Αγοραστές που είναι unsubscribed και δεν παίρνουν τα emails του προγράμματος.</p>
        </div>
        <div className="flex flex-wrap items-end gap-3 bg-white border border-gray-200 rounded-2xl p-4">
          <label className="text-xs text-gray-500">Αγορές από
            <input type="date" value={since} onChange={e => setSince(e.target.value)} className="block mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-black" />
          </label>
          <button onClick={() => call('GET')} disabled={busy} className="text-sm px-5 py-2.5 rounded-full border border-gray-300 bg-white disabled:opacity-40">Έλεγχος</button>
          <button onClick={() => call('POST')} disabled={busy || !plan?.resubscribe?.length} className="text-sm px-5 py-2.5 rounded-full bg-black text-white disabled:opacity-40">Resubscribe</button>
        </div>
        {busy && <p className="text-sm text-gray-400">Φόρτωση…</p>}
        {plan?.error && <p className="text-sm text-red-600">{plan.error}</p>}
        {plan && !plan.error && (
          <div className="bg-white border border-gray-200 rounded-2xl p-5 text-sm space-y-4">
            {plan.resubscribed ? (
              <p className="font-medium text-green-700">✓ Έγιναν resubscribe: {plan.resubscribed.length}{plan.failed?.length ? ` · απέτυχαν: ${plan.failed.length}` : ''}</p>
            ) : (
              <>
                <p>Unsubscribed στο group: <b>{plan.unsubscribedInGroup}</b> · αγόρασαν από {plan.since}: <b>{plan.resubscribe?.length}</b></p>
                <ul className="divide-y divide-gray-100">
                  {plan.resubscribe?.map(s => (
                    <li key={s.email} className="py-1.5 flex justify-between gap-3"><span>{s.email}</span><span className="text-gray-400 text-xs">αγορά {s.bought.slice(0, 10)}</span></li>
                  ))}
                </ul>
              </>
            )}
            {plan.skipped.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">Δεν τους αγγίζουμε</p>
                {plan.skipped.map(s => <p key={s.email} className="text-gray-500">{s.email} · {s.reason}</p>)}
              </div>
            )}
          </div>
        )}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 text-sm space-y-3">
          <p className="font-medium">Αυτοματισμός που δεν ξεκίνησε</p>
          <p className="text-gray-500">Αγοραστές που είναι στο group αλλά δεν μπήκαν ποτέ στον αυτοματισμό (π.χ. ήταν unsubscribed όταν μπήκαν). Τους βγάζει και τους ξαναβάζει στο group, ώστε να ξεκινήσει.</p>
          <div className="flex gap-3">
            <button onClick={() => retrigger('GET')} disabled={busy} className="text-sm px-5 py-2.5 rounded-full border border-gray-300 bg-white disabled:opacity-40">Έλεγχος</button>
            <button onClick={() => retrigger('POST')} disabled={busy || !rt?.missing?.length} className="text-sm px-5 py-2.5 rounded-full bg-black text-white disabled:opacity-40">Ξεκίνα τον αυτοματισμό</button>
          </div>
          {rt?.error && <p className="text-red-600">{rt.error}</p>}
          {rt?.automations && <p className="text-gray-500">Αυτοματισμός: {rt.automations.map(a => a.name).join(', ')}{rt.buyers != null ? ` · αγοραστές από ${since}: ${rt.buyers}` : ''}</p>}
          {rt?.missing && <>
            <p>Λείπουν από τον αυτοματισμό: <b>{rt.missing.length}</b></p>
            {rt.missing.map(m => <p key={m.email} className="text-gray-600">{m.email}</p>)}
          </>}
          {rt?.retriggered && <p className="font-medium text-green-700">✓ Ξεκίνησαν: {rt.retriggered.length}{rt.failed?.length ? ` · απέτυχαν: ${rt.failed.join(', ')}` : ''}</p>}
        </div>
      </div>
    </main>
  )
}
