import crypto from 'crypto'

// ============================================================
// TIKTOK EVENTS API (server-side) — αντίστοιχο του Meta CAPI
// Docs: POST https://business-api.tiktok.com/open_api/v1.3/event/track/
// Dedup με το browser pixel μέσω κοινού event_id.
// Pixel: withinsuccess.gr (DATCRTBC77U88MSOAST0). Απαιτεί env: TIKTOK_EVENTS_ACCESS_TOKEN
// ============================================================

const ENDPOINT = 'https://business-api.tiktok.com/open_api/v1.3/event/track/'

function sha256(v: string): string {
  return crypto.createHash('sha256').update(v).digest('hex')
}

function hashEmail(email: string): string {
  return sha256(email.trim().toLowerCase())
}

// E.164 (+30...) πριν το hash. Ελληνικά νούμερα χωρίς πρόθεμα → +30.
function hashPhone(phone: string): string {
  let p = phone.replace(/[^\d+]/g, '')
  if (!p.startsWith('+')) {
    p = p.startsWith('00') ? '+' + p.slice(2) : p.length === 10 ? '+30' + p : '+' + p
  }
  return sha256(p)
}

export type TikTokEventParams = {
  event: 'CompletePayment' | 'InitiateCheckout' | 'ViewContent'
  eventId: string
  value: number
  contentId: string
  contentName: string
  pageUrl: string
  email?: string | null
  phone?: string | null
  ttclid?: string | null
  ttp?: string | null
  ip?: string | null
  userAgent?: string | null
}

export async function sendTikTokEvent(p: TikTokEventParams) {
  const pixelId = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID || 'DATCRTBC77U88MSOAST0'
  const token = process.env.TIKTOK_EVENTS_ACCESS_TOKEN
  if (!pixelId || !token) {
    console.log('TikTok Events API not configured, skipping', p.event)
    return
  }

  const user: Record<string, string> = {}
  if (p.email) {
    user.email = hashEmail(p.email)
    user.external_id = hashEmail(p.email)
  }
  if (p.phone) user.phone = hashPhone(p.phone)
  if (p.ttclid) user.ttclid = p.ttclid
  if (p.ttp) user.ttp = p.ttp
  if (p.ip) user.ip = p.ip
  if (p.userAgent) user.user_agent = p.userAgent

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Access-Token': token },
      body: JSON.stringify({
        event_source: 'web',
        event_source_id: pixelId,
        data: [
          {
            event: p.event,
            event_time: Math.floor(Date.now() / 1000),
            event_id: p.eventId,
            user,
            page: { url: p.pageUrl },
            properties: {
              currency: 'EUR',
              value: p.value,
              content_type: 'product',
              contents: [
                { content_id: p.contentId, content_name: p.contentName, price: p.value, quantity: 1 },
              ],
            },
          },
        ],
      }),
    })
    const text = await res.text()
    if (!res.ok || !text.includes('"code":0')) {
      console.error(`TikTok Events API error (${res.status}):`, text)
    } else {
      console.log(`TikTok ${p.event} sent: €${p.value} (${p.contentName})`)
    }
  } catch (err) {
    console.error('TikTok Events API fetch failed:', err)
  }
}
