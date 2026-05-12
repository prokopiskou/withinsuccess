import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error) {
    return new NextResponse(
      `<html><body style="font-family:Inter,sans-serif;padding:40px;max-width:600px;margin:auto">
        <h1 style="color:#dc2626">OAuth Error</h1>
        <p>${error}</p>
        <a href="/api/auth/google">Try again</a>
      </body></html>`,
      { headers: { 'Content-Type': 'text/html' } }
    )
  }

  if (!code) {
    return NextResponse.json({ error: 'No code provided' }, { status: 400 })
  }

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

  try {
    const { tokens } = await oauth2Client.getToken(code)
    
    const refreshToken = tokens.refresh_token
    
    if (!refreshToken) {
      return new NextResponse(
        `<html><body style="font-family:Inter,sans-serif;padding:40px;max-width:600px;margin:auto">
          <h1 style="color:#dc2626">No Refresh Token Returned</h1>
          <p>Google didn't return a refresh token. This usually happens if you've already authorized this app before.</p>
          <p>To fix:</p>
          <ol>
            <li>Go to <a href="https://myaccount.google.com/permissions" target="_blank">Google Account permissions</a></li>
            <li>Find "WithinSuccess Dashboard"</li>
            <li>Remove access</li>
            <li>Then <a href="/api/auth/google">try again</a></li>
          </ol>
        </body></html>`,
        { headers: { 'Content-Type': 'text/html' } }
      )
    }

    // Display the refresh token to copy
    return new NextResponse(
      `<html><body style="font-family:Inter,sans-serif;padding:40px;max-width:700px;margin:auto;background:#fafafa">
        <div style="background:white;padding:40px;border-radius:16px;box-shadow:0 4px 20px rgba(0,0,0,0.05)">
          <div style="height:4px;background:#C9A96E;margin:-40px -40px 30px;border-radius:16px 16px 0 0"></div>
          <h1 style="font-family:Georgia,serif;color:#1a1a1a;margin:0 0 20px">✅ Authorization Successful</h1>
          <p style="color:#525252">Copy this refresh token and add it to your environment variables:</p>
          <p style="font-size:13px;color:#737373;margin-top:30px"><strong>Variable name:</strong> GA4_REFRESH_TOKEN</p>
          <p style="font-size:13px;color:#737373;margin-bottom:5px"><strong>Value:</strong></p>
          <div style="background:#1a1a1a;color:#C9A96E;padding:20px;border-radius:8px;font-family:Monaco,monospace;font-size:13px;word-break:break-all;margin:10px 0">
            ${refreshToken}
          </div>
          <button onclick="navigator.clipboard.writeText('${refreshToken}');this.innerText='✓ Copied!'" 
            style="background:#1a1a1a;color:white;border:none;padding:12px 24px;border-radius:24px;cursor:pointer;font-size:14px;margin-top:10px">
            Copy to Clipboard
          </button>
          <hr style="margin:30px 0;border:none;border-top:1px solid #e5e5e5">
          <h3 style="color:#1a1a1a">Next steps:</h3>
          <ol style="color:#525252;line-height:1.8">
            <li>Copy the refresh token above</li>
            <li>Add to Vercel env vars as <code>GA4_REFRESH_TOKEN</code> (Production + Preview + Development)</li>
            <li>Add to local <code>.env.local</code> too</li>
            <li>Redeploy on Vercel</li>
            <li>Your dashboard will now be able to fetch GA4 data</li>
          </ol>
          <p style="color:#737373;font-size:13px;margin-top:30px">⚠️ Keep this token secret. Don't commit to git.</p>
        </div>
      </body></html>`,
      { headers: { 'Content-Type': 'text/html' } }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return new NextResponse(
      `<html><body style="font-family:Inter,sans-serif;padding:40px;max-width:600px;margin:auto">
        <h1 style="color:#dc2626">Token Exchange Failed</h1>
        <p>${message}</p>
        <a href="/api/auth/google">Try again</a>
      </body></html>`,
      { headers: { 'Content-Type': 'text/html' } }
    )
  }
}
