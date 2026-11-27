'use client'

import { use, useEffect, useState } from 'react'

type Doc = {
  doc_type: string
  series: string
  aa: number
  issue_date: string
  amount: number
  payment_type: number
  product: string | null
  description: string | null
  quantity: number
  unit_price: number | null
  customer_name: string | null
  customer_email: string | null
  mark: string | null
  uid: string | null
  qr_url: string | null
  correlated_mark: string | null
  status: string
  vat_rate?: number
}

const PAY: Record<number, string> = { 7: 'Κάρτα μέσω POS / e-POS', 8: 'IRIS', 6: 'Web banking', 3: 'Μετρητά', 1: 'Κατάθεση σε λογαριασμό' }
const eur = (n: number) => `${n.toFixed(2)} €`

/** Εκτυπώσιμη απόδειξη (Ctrl/Cmd+P → PDF) */
export default function ReceiptView({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [doc, setDoc] = useState<Doc | null>(null)
  const [env, setEnv] = useState('')
  useEffect(() => {
    fetch(`/api/dashboard/mydata?id=${id}`).then(r => r.json()).then(j => { setDoc(j.doc); setEnv(j.config?.env) })
  }, [id])
  if (!doc) return <main className="p-10 text-sm text-gray-400">Φόρτωση…</main>
  const credit = doc.doc_type === '11.4'
  const unit = Number(doc.unit_price ?? doc.amount)
  const rate = Number(doc.vat_rate) === 24 ? 24 : 0
  const gross = Number(doc.amount)
  const net = rate ? Math.round((gross / 1.24) * 100) / 100 : gross
  const vatAmt = Math.round((gross - net) * 100) / 100
  return (
    <main className="min-h-screen bg-gray-100 print:bg-white py-10 print:py-0">
      <div className="max-w-2xl mx-auto bg-white p-10 text-sm text-[#171717] shadow print:shadow-none">
        {env === 'dev' && <p className="mb-4 text-center text-xs font-semibold text-amber-700 border border-amber-300 bg-amber-50 py-1">ΔΟΚΙΜΑΣΤΙΚΟ — ΔΕΝ ΕΙΝΑΙ ΕΓΚΥΡΟ ΦΟΡΟΛΟΓΙΚΟ ΣΤΟΙΧΕΙΟ</p>}
        <div className="flex justify-between gap-6">
          <div>
            <p className="text-lg font-semibold">WITHINSUCCESS</p>
            <p>ΚΟΥΚΗΣ ΠΡΟΚΟΠΙΟΣ</p>
            <p className="text-gray-600">Υπηρεσίες εκπαίδευσης μέσω υπολογιστή</p>
            <p className="text-gray-600">ΑΦΜ 154067080 · ΔΟΥ Α΄ Αθηνών</p>
            <p className="text-gray-600">Ηρακλείου 4, Γλυφάδα 16675</p>
            <p className="text-gray-600">hello@withinsuccess.gr</p>
          </div>
          <div className="text-right">
            <p className="font-semibold">{credit ? 'ΠΙΣΤΩΤΙΚΟ ΣΤΟΙΧΕΙΟ ΛΙΑΝΙΚΗΣ' : 'ΑΠΟΔΕΙΞΗ ΠΑΡΟΧΗΣ ΥΠΗΡΕΣΙΩΝ'}</p>
            <p>Σειρά {doc.series} · Αρ. {doc.aa}</p>
            <p>Ημ/νία {doc.issue_date}</p>
            {doc.correlated_mark && <p className="text-gray-600">Σχετικό: {doc.correlated_mark}</p>}
          </div>
        </div>

        {(doc.customer_name || doc.customer_email) && (
          <div className="mt-6 border-t pt-3">
            <p className="text-xs text-gray-500">ΠΕΛΑΤΗΣ</p>
            <p>{doc.customer_name}</p>
            <p className="text-gray-600">{doc.customer_email}</p>
          </div>
        )}

        <table className="w-full mt-6 border-t">
          <thead className="text-xs text-gray-500 text-left">
            <tr><th className="py-2 font-normal">Περιγραφή</th><th className="font-normal">Ποσ.</th><th className="font-normal">Τιμή</th><th className="font-normal">ΦΠΑ</th><th className="font-normal text-right">Σύνολο</th></tr>
          </thead>
          <tbody>
            <tr className="border-t">
              <td className="py-2">{doc.product || doc.description}</td>
              <td>{doc.quantity}</td>
              <td>{eur(unit)}</td>
              <td>{rate}%</td>
              <td className="text-right">{eur(Number(doc.amount))}</td>
            </tr>
          </tbody>
        </table>

        <div className="mt-4 flex justify-end">
          <div className="w-60 space-y-1">
            <p className="flex justify-between"><span>Καθαρή αξία</span><span>{eur(net)}</span></p>
            <p className="flex justify-between"><span>ΦΠΑ {rate}%</span><span>{eur(vatAmt)}</span></p>
            <p className="flex justify-between font-semibold border-t pt-1"><span>Πληρωτέο</span><span>{eur(Number(doc.amount))}</span></p>
          </div>
        </div>

        <p className="mt-4 text-gray-600">Τρόπος πληρωμής: {PAY[doc.payment_type] || doc.payment_type}</p>
        {!rate && <p className="text-gray-600">Απαλλαγή ΦΠΑ βάσει άρθρου 22 – Εκπαιδευτικές υπηρεσίες</p>}

        <div className="mt-6 border-t pt-3 text-xs text-gray-600 space-y-1">
          <p>MARK: <span className="font-mono">{doc.mark || '—'}</span></p>
          {doc.uid && <p>UID: <span className="font-mono">{doc.uid}</span></p>}
          {doc.qr_url && <p>Έλεγχος ΑΑΔΕ: <a href={doc.qr_url} className="underline break-all">{doc.qr_url}</a></p>}
        </div>

        <button onClick={() => window.print()} className="mt-8 print:hidden bg-black text-white text-sm px-5 py-2 rounded-full">Εκτύπωση / PDF</button>
      </div>
    </main>
  )
}
