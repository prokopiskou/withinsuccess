import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import QRCode from 'qrcode'
import { supabaseAdmin } from '@/lib/manychat-utils'
import ReceiptDocument, { type ReceiptDoc } from '@/components/ReceiptDocument'
import PrintButton from './PrintButton'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Απόδειξη · WithinSuccess', robots: { index: false, follow: false } }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Δημόσια απόδειξη για τον πελάτη (link στο email). Μόνο με το μυστικό token, ποτέ με id. */
export default async function PublicReceipt({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  if (!UUID.test(token)) notFound()
  const { data: doc } = await supabaseAdmin.from('mydata_docs').select('*').eq('public_token', token).maybeSingle()
  if (!doc || !doc.mark) notFound()
  const qrSvg = doc.qr_url ? await QRCode.toString(doc.qr_url, { type: 'svg', margin: 0, width: 112 }) : null
  return (
    <main className="min-h-screen bg-gray-100 print:bg-white py-8 px-3 print:p-0">
      <ReceiptDocument doc={doc as ReceiptDoc} qrSvg={qrSvg} test={doc.env === 'dev'} />
      <div className="max-w-2xl mx-auto mt-4 text-center print:hidden">
        <PrintButton />
      </div>
    </main>
  )
}
