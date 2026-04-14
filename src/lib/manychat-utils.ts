import { createClient } from '@supabase/supabase-js'

export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export const LANDING_PAGE_BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://withinsuccess.gr'

export function isWithinBusinessHours(): boolean {
  const now = new Date()
  const greeceHour = (now.getUTCHours() + 3) % 24
  return greeceHour >= 9 && greeceHour < 21
}

export function hoursSince(dateStr: string): number {
  return (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60)
}

export async function sendManyChatMessage(subscriberId: string, message: string): Promise<boolean> {
  try {
    const res = await fetch('https://api.manychat.com/fb/sending/sendContent', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MANYCHAT_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        subscriber_id: parseInt(subscriberId),
        data: {
          version: 'v2',
          content: {
            messages: [{ type: 'text', text: message }]
          }
        }
      })
    })
    if (!res.ok) {
      console.error(`ManyChat error (${res.status}):`, await res.text())
      return false
    }
    return true
  } catch (err) {
    console.error('ManyChat send failed:', err)
    return false
  }
}
