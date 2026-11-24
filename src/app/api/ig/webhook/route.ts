import { NextRequest, NextResponse, after } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { handleWebhook, type WebhookBody } from '@/lib/igFlow'

export const dynamic = 'force-dynamic'

// Meta verification (μία φορά, όταν βάζεις το callback URL)
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams
  if (p.get('hub.mode') === 'subscribe' && p.get('hub.verify_token') === process.env.IG_VERIFY_TOKEN) {
    return new NextResponse(p.get('hub.challenge') || '', { status: 200 })
  }
  return new NextResponse('forbidden', { status: 403 })
}

/** X-Hub-Signature-256 σε ΚΑΘΕ webhook. Χωρίς έγκυρη υπογραφή δεν γίνεται τίποτα. */
function validSignature(raw: string, header: string | null): boolean {
  const secret = process.env.IG_APP_SECRET
  if (!secret || !header?.startsWith('sha256=')) return false
  const expected = createHmac('sha256', secret).update(raw).digest('hex')
  const got = header.slice(7)
  return got.length === expected.length && timingSafeEqual(Buffer.from(got), Buffer.from(expected))
}

export async function POST(req: NextRequest) {
  const raw = await req.text()
  if (!validSignature(raw, req.headers.get('x-hub-signature-256'))) {
    console.warn('[IG] invalid signature')
    return new NextResponse('invalid signature', { status: 401 })
  }

  let body: WebhookBody
  try {
    body = JSON.parse(raw)
  } catch {
    return NextResponse.json({ ok: true })
  }

  // Απαντάμε αμέσως 200 στο Meta, η δουλειά γίνεται μετά
  after(async () => {
    try {
      await handleWebhook(body)
    } catch (err) {
      console.error('[IG] handler error', err)
    }
  })
  return NextResponse.json({ ok: true })
}
