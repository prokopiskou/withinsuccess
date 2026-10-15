import { NextResponse } from 'next/server'
import { getLiveSeatsLeft } from '@/lib/seminarSeats'
import { isSeminarSalesClosed, SEMINAR } from '@/lib/seminar'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const left = await getLiveSeatsLeft()
    return NextResponse.json({
      liveLeft: left,
      liveCapacity: SEMINAR.liveCapacity,
      closed: isSeminarSalesClosed(),
    })
  } catch (err) {
    console.error('seminar availability failed:', err)
    // Αν πέσει το Stripe, η σελίδα συνεχίζει να πουλάει (ο έλεγχος γίνεται ξανά στο checkout)
    return NextResponse.json({ liveLeft: null, liveCapacity: SEMINAR.liveCapacity, closed: isSeminarSalesClosed() })
  }
}
