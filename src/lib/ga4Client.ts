import { google } from 'googleapis'
import { BetaAnalyticsDataClient } from '@google-analytics/data'

let cachedClient: BetaAnalyticsDataClient | null = null

/**
 * Get a configured GA4 Data API client using OAuth refresh token.
 * Cached singleton for performance.
 */
export function getGA4Client(): BetaAnalyticsDataClient {
  if (cachedClient) return cachedClient

  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const refreshToken = process.env.GA4_REFRESH_TOKEN

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      'Missing GA4 OAuth credentials. Check GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GA4_REFRESH_TOKEN.'
    )
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret)
  oauth2Client.setCredentials({ refresh_token: refreshToken })

  cachedClient = new BetaAnalyticsDataClient({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    authClient: oauth2Client as any,
  })

  return cachedClient
}

/**
 * Get the GA4 property path required by the Data API.
 * Format: properties/{property_id}
 */
export function getPropertyPath(): string {
  const propertyId = process.env.GA4_PROPERTY_ID
  if (!propertyId) {
    throw new Error('Missing GA4_PROPERTY_ID env var')
  }
  return `properties/${propertyId}`
}
