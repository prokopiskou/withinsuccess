import { NextRequest, NextResponse } from 'next/server'
import { guardFormRequest, clip } from '@/lib/guard'

const GROUP_PROGRAM_WAITLIST = '187457343070405693'  // 63 Days + variants
const GROUP_SEMINAR_WAITLIST = '187522640873784777'  // Seminars
const GROUP_WITHIN_PATH_WAITLIST = '190255541091567097'  // Within Path
const GROUP_30DAYS_WAITLIST = '148306489548736139'  // 30day waitlist

function getGroupForSource(source: string): string {
  const s = source.toLowerCase()
  if (s === 'seminar' || s === 'seminars' || s.startsWith('seminar_')) {
    return GROUP_SEMINAR_WAITLIST
  }
  if (s === '30days' || s.startsWith('30days')) {
    return GROUP_30DAYS_WAITLIST
  }
  if (s === 'within_path' || s === 'withinpath' || s.startsWith('within_path')) {
    return GROUP_WITHIN_PATH_WAITLIST
  }
  return GROUP_PROGRAM_WAITLIST
}

export async function POST(req: NextRequest) {
  const blocked = guardFormRequest(req, 'waitlist', 5)
  if (blocked) return blocked
  try {
    const body = await req.json()
    const email = clip(body.email, 200).trim().toLowerCase()
    const name = clip(body.name, 120).trim()
    const source = clip(body.source, 60) || 'unknown'

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Έγκυρο email απαιτείται' },
        { status: 400 }
      )
    }

    const apiKey = process.env.MAILERLITE_API_KEY
    if (!apiKey) {
      console.error('MAILERLITE_API_KEY missing')
      return NextResponse.json(
        { success: false, error: 'Server config error' },
        { status: 500 }
      )
    }

    const groupId = getGroupForSource(source)

    const fields: Record<string, string> = {
      source,
      waitlist_signup_date: new Date().toISOString(),
    }
    if (name) {
      fields.name = name
    }

    const res = await fetch('https://connect.mailerlite.com/api/subscribers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        email,
        groups: [groupId],
        fields,
        status: 'active',
      }),
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      console.error('MailerLite error:', errorData)
      return NextResponse.json(
        { 
          success: false, 
          error: errorData.message || 'Αποτυχία εγγραφής. Δοκίμασε ξανά.' 
        },
        { status: res.status }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Στη waitlist',
      source,
      group: groupId,
    })
  } catch (err) {
    const e = err as Error
    console.error('Waitlist endpoint error:', e.message)
    return NextResponse.json(
      { success: false, error: 'Σφάλμα server' },
      { status: 500 }
    )
  }
}
