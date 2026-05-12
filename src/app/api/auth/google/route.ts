import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.json(
      { error: 'Missing Google OAuth configuration' },
      { status: 500 }
    )
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  )

  // Generate auth URL with offline access (gets refresh token)
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent', // Force consent to ensure refresh_token is returned
    scope: [
      'https://www.googleapis.com/auth/analytics.readonly'
    ]
  })

  return NextResponse.redirect(authUrl)
}
