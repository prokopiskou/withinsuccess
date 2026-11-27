'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'

type Doc = {
  id: string
  doc_type: string
  series: string
  aa: number
  issue_date: string
  amount: number
  payment_type: number
  description: string | null
  mark: string | null
  qr_url: string | null
  correlated_mark: string | null
  status: string
  error: string | null
  created_at: string
}
type Data = {
  config: { env: string; configured: boolean; vat: string; series: string; creditSeries: string; vatExemption: string }
  docs: Doc[]
  dbError: string | null
}

const PAY: Record<number, string> = { 7: 'Κάρτα (POS/e-POS)', 8: 'IRIS', 6: 'Web banking', 3: 'Μετρητά', 1: 'Τραπεζικός λογ.' }
const STATUS: Record<string, string> = { sent: 'Διαβιβάστηκε', failed: 'Απέτυχε', pending: 'Σε αναμονή', cancelled: 'Ακυρώθηκε' }

export default function MyDataPage() {
  const [data, setData] = useState<Data | null>(null)
  const [amount, setAmount] = useState('9')
  const [pay, setPay] = useState('7')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const load = useCallback(async () => {
    const r = await fetch('/api/dashboard/mydata', { cache: 'no-store' })
    setData(await r.json())
  }, [])
  useEffect(() => {
    const t = setTimeout(load, 0)
    return () => clearTimeout(t)
  }, [load])

  async function act(body: Record<string, unknown>) {
    setBusy(true)
    setMsg(null)
    const r = await fetch('/api/dashboard/mydata', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const j = await r.json()
    setBusy(false)
    if (!r.ok) setMsg(j.error || 'Σφάλμα')
    else if (j.doc) setMsg(j.doc.status === 'sent' ? `OK · MARK ${j.doc.mark}` : `Απέτυχε: ${j.doc.error}`)
    else if (j.result) setMsg(j.result.ok ? 'Ακυρώθηκε' : `Απέτυχε: ${j.result.errors?.join(' | ')}`)
    load()
  }

  const c = data?.config
  const isDev = c?.env === 'dev'

  return (
    <main className="min-h-screen bg-[#FAFAF8] text-[#171717]">
      <div className="max-w-5xl mx-auto px-5 py-8">
        <Link href="/dashboard" className="text-xs text-gray-400 hover:text-black">← Dashboard</Link>
        <h1 className="text-2xl font-semibold mt-1">myDATA · δοκιμές</h1>
        <p className="text-sm text-gray-500 mt-1">Αποδείξεις απευθείας στην ΑΑΔΕ, χωρίς Oxygen. Δεν είναι συνδεδεμένο με τις πληρωμές.</p>

        {c && (
          <div className="mt-5 flex flex-wrap gap-2 text-xs">
            <span className={`px-3 py-1.5 rounded-full border ${isDev ? 'border-amber-300 bg-amber-50 text-amber-800' : 'border-red-300 bg-red-50 text-red-800'}`}>
              Περιβάλλον: {isDev ? 'ΔΟΚΙΜΑΣΤΙΚΟ (dev)' : 'ΠΑΡΑΓΩΓΗ'}
            </span>
            <span className={`px-3 py-1.5 rounded-full border ${c.configured ? 'border-green-300 bg-green-50 text-green-800' : 'border-gray-300 bg-white text-gray-600'}`}>
              {c.configured ? 'Κλειδιά: OK' : 'Κλειδιά: λείπουν'}
            </span>
            <span className="px-3 py-1.5 rounded-full border border-gray-200 bg-white">ΑΦΜ {c.vat}</span>
            <span className="px-3 py-1.5 rounded-full border border-gray-200 bg-white">Σειρές {c.series} / {c.creditSeries}</span>
            <span className="px-3 py-1.5 rounded-full border border-gray-200 bg-white">Εξαίρεση ΦΠΑ: κατ. {c.vatExemption}</span>
          </div>
        )}
        {data?.dbError && <p className="mt-3 text-sm text-red-600">Βάση: {data.dbError}. Έτρεξες το supabase/mydata.sql;</p>}

        {isDev && (
          <section className="mt-6 bg-white rounded-2xl border border-gray-200 p-5">
            <p className="font-medium mb-3">Δοκιμαστική ΑΠΥ (11.2)</p>
            <div className="flex flex-wrap items-end gap-3">
              <label className="text-sm">Ποσό €
                <input value={amount} onChange={e => setAmount(e.target.value)} className="block mt-1 w-24 border border-gray-200 rounded-lg px-2 py-1.5" />
              </label>
              <label className="text-sm">Πληρωμή
                <select value={pay} onChange={e => setPay(e.target.value)} className="block mt-1 border border-gray-200 rounded-lg px-2 py-1.5">
                  {Object.entries(PAY).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </label>
              <button disabled={busy || !c?.configured} onClick={() => act({ action: 'issue', amount, paymentType: pay })}
                className="bg-black text-white text-sm px-4 py-2 rounded-full disabled:opacity-40">
                {busy ? 'Αποστολή…' : 'Αποστολή στο myDATA (dev)'}
              </button>
            </div>
            {msg && <p className="mt-3 text-sm">{msg}</p>}
          </section>
        )}

        <section className="mt-6 bg-white rounded-2xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-[10px] uppercase tracking-wider text-gray-400 text-left">
              <tr className="border-b border-gray-100">
                <th className="px-4 py-3 font-normal">Παραστατικό</th>
                <th className="px-4 py-3 font-normal">Ημ/νία</th>
                <th className="px-4 py-3 font-normal">Ποσό</th>
                <th className="px-4 py-3 font-normal">Πληρωμή</th>
                <th className="px-4 py-3 font-normal">Κατάσταση</th>
                <th className="px-4 py-3 font-normal">MARK</th>
                <th className="px-4 py-3 font-normal"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data?.docs.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Κανένα παραστατικό ακόμα.</td></tr>}
              {data?.docs.map(d => (
                <tr key={d.id}>
                  <td className="px-4 py-2.5">{d.doc_type === '11.4' ? 'Πιστωτικό' : 'ΑΠΥ'} {d.series} {d.aa}</td>
                  <td className="px-4 py-2.5 text-gray-500">{d.issue_date}</td>
                  <td className="px-4 py-2.5">{Number(d.amount).toFixed(2)} €</td>
                  <td className="px-4 py-2.5 text-gray-500">{PAY[d.payment_type] || d.payment_type}</td>
                  <td className={`px-4 py-2.5 ${d.status === 'failed' ? 'text-red-600' : d.status === 'sent' ? 'text-green-700' : 'text-gray-500'}`} title={d.error || ''}>
                    {STATUS[d.status] || d.status}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs">
                    {d.mark || '—'}{d.qr_url && <a href={d.qr_url} target="_blank" rel="noreferrer" className="ml-2 underline">QR</a>}
                  </td>
                  <td className="px-4 py-2.5 text-xs whitespace-nowrap">
                    {isDev && d.status === 'sent' && d.doc_type === '11.2' && (
                      <button onClick={() => act({ action: 'credit', id: d.id })} className="text-gray-500 hover:text-black mr-3">Πιστωτικό</button>
                    )}
                    {isDev && d.status === 'sent' && (
                      <button onClick={() => act({ action: 'cancel', id: d.id })} className="text-gray-400 hover:text-red-600 mr-3">Ακύρωση</button>
                    )}
                    {isDev && d.status === 'failed' && (
                      <button onClick={() => act({ action: 'retry', id: d.id })} className="text-gray-500 hover:text-black">Ξανά</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        {data?.docs.some(d => d.error) && (
          <details className="mt-4 text-xs text-gray-500">
            <summary className="cursor-pointer">Σφάλματα ΑΑΔΕ</summary>
            {data.docs.filter(d => d.error).map(d => <p key={d.id} className="mt-1">{d.series} {d.aa}: {d.error}</p>)}
          </details>
        )}
      </div>
    </main>
  )
}
