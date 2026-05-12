import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  // Show only first 20 chars of secrets — don't reveal full value
  const masked = (val: string | undefined) => {
    if (!val) return 'MISSING'
    return val.substring(0, 20) + '...' + val.substring(val.length - 10)
  }

  return NextResponse.json({
    GOOGLE_CLIENT_ID: masked(process.env.GOOGLE_CLIENT_ID),
    GOOGLE_CLIENT_SECRET: masked(process.env.GOOGLE_CLIENT_SECRET),
    GOOGLE_OAUTH_REDIRECT_URI: process.env.GOOGLE_OAUTH_REDIRECT_URI || 'MISSING',
    GA4_PROPERTY_ID: process.env.GA4_PROPERTY_ID || 'MISSING',
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
  })
}
