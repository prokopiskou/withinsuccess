import { NextRequest, NextResponse } from 'next/server'

const WAITLIST_GROUP_ID = '187457343070405693'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const email = (body.email || '').trim().toLowerCase()
    const source = body.source || 'unknown'

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

    // Subscribe to MailerLite + add to waitlist group + tag source
    const res = await fetch('https://connect.mailerlite.com/api/subscribers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        email,
        groups: [WAITLIST_GROUP_ID],
        fields: {
          source,
          waitlist_signup_date: new Date().toISOString(),
        },
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
