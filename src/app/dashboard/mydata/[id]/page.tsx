'use client'

import { use, useEffect, useState } from 'react'
import ReceiptDocument, { type ReceiptDoc } from '@/components/ReceiptDocument'

/** Εκτυπώσιμη απόδειξη (Ctrl/Cmd+P → PDF) */
export default function ReceiptView({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [doc, setDoc] = useState<(ReceiptDoc & { public_token?: string }) | null>(null)
  const [env, setEnv] = useState('')
  const [qrSvg, setQrSvg] = useState<string | null>(null)
  useEffect(() => {
    fetch(`/api/dashboard/mydata?id=${id}`).then(r => r.json()).then(j => { setDoc(j.doc); setEnv(j.config?.env); setQrSvg(j.qrSvg || null) })
  }, [id])
  if (!doc) return <main className="p-10 text-sm text-gray-400">Φόρτωση…</main>
  return (
    <main className="min-h-screen bg-gray-100 print:bg-white py-10 print:py-0">
      <ReceiptDocument doc={doc} qrSvg={qrSvg} test={(doc.env || env) === 'dev'} />
      <div className="max-w-2xl mx-auto mt-4 flex flex-wrap gap-3 items-center print:hidden">
        <button onClick={() => window.print()} className="bg-black text-white text-sm px-5 py-2 rounded-full">Εκτύπωση / PDF</button>
        {doc.public_token && doc.mark && (
          <button onClick={() => navigator.clipboard.writeText(`${location.origin}/apodeiksi/${doc.public_token}`)} className="text-sm px-5 py-2 rounded-full border border-gray-300 bg-white">
            Αντιγραφή link για τον πελάτη
          </button>
        )}
      </div>
    </main>
  )
}
