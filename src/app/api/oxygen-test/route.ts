import { NextResponse } from 'next/server'

export async function GET() {
  const res = await fetch('https://api.oxygen.gr/v1/taxes', {
    headers: {
      'Authorization': `Bearer ${process.env.OXYGEN_API_KEY}`,
      'Content-Type': 'application/json',
    }
  })
  const data = await res.json()
  return NextResponse.json(data)
}
