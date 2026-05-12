import { google, analyticsdata_v1beta } from 'googleapis'

let cachedClient: analyticsdata_v1beta.Analyticsdata | null = null

/**
 * Get a configured GA4 Data API client using googleapis library with OAuth2.
 * Uses googleapis instead of @google-analytics/data because OAuth2 integration
 * is more reliable with this approach.
 */
export function getGA4Client(): analyticsdata_v1beta.Analyticsdata {
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

  cachedClient = google.analyticsdata({
    version: 'v1beta',
    auth: oauth2Client,
  })

  return cachedClient
}

/**
 * Get the GA4 property ID (numeric).
 */
export function getPropertyId(): string {
  const propertyId = process.env.GA4_PROPERTY_ID
  if (!propertyId) {
    throw new Error('Missing GA4_PROPERTY_ID env var')
  }
  return propertyId
}

/**
 * Get the GA4 property path for Data API requests.
 * Format: properties/{property_id}
 */
export function getPropertyPath(): string {
  return `properties/${getPropertyId()}`
}
