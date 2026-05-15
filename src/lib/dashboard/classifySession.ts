export type SessionBucket = 'paid' | 'organic' | 'newsletter' | 'unknown'

export type SessionUTM = {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
}

/**
 * Classify a Stripe checkout session into one of 4 mutually exclusive buckets.
 * Used by all dashboard endpoints for consistent attribution.
 */
export function classifySession(metadata: Record<string, string | undefined> = {}): SessionBucket {
  const source = (metadata.utm_source || '').toLowerCase().trim()
  const medium = (metadata.utm_medium || '').toLowerCase().trim()
  const campaign = (metadata.utm_campaign || '').toLowerCase().trim()
  
  const hasAnyUtm = !!(source || medium || campaign)
  
  // 1. PAID: explicit paid medium
  if (medium === 'cpc' || medium === 'paid' || medium === 'paid_social' || medium === 'paidsocial') {
    return 'paid'
  }
  
  // 2. NEWSLETTER: email medium or newsletter source
  if (medium === 'email' || medium === 'newsletter') return 'newsletter'
  if (source === 'newsletter' || source === 'mailerlite') return 'newsletter'
  
  // 3. ORGANIC: has any UTM but not paid/newsletter
  if (hasAnyUtm) return 'organic'
  
  // 4. UNKNOWN: no UTMs at all (direct, bookmark, etc.)
  return 'unknown'
}

/**
 * Helper to classify organic sub-source (only call if classifySession returned 'organic').
 * Returns finer-grained organic category for the organic dashboard.
 */
export type OrganicSubSource = 
  | 'ig_bio' | 'ig_stories' | 'ig_manychat'
  | 'fb_bio' | 'fb_stories' | 'fb_manychat'
  | 'tiktok_bio' | 'threads_bio'
  | 'google_organic'
  | 'other_organic'

export function classifyOrganicSubSource(metadata: Record<string, string | undefined> = {}): OrganicSubSource {
  const source = (metadata.utm_source || '').toLowerCase().trim()
  const medium = (metadata.utm_medium || '').toLowerCase().trim()
  
  // Instagram
  if (source === 'instagram' || source === 'ig') {
    if (medium === 'story' || medium === 'stories') return 'ig_stories'
    if (medium === 'manychat' || medium === 'dm') return 'ig_manychat'
    return 'ig_bio'
  }
  
  // ManyChat
  if (source === 'manychat') {
    if (medium === 'ig' || medium === 'instagram') return 'ig_manychat'
    if (medium === 'fb' || medium === 'facebook') return 'fb_manychat'
    return 'ig_manychat'  // default to IG
  }
  
  // Facebook
  if (source === 'facebook' || source === 'fb') {
    if (medium === 'story' || medium === 'stories') return 'fb_stories'
    if (medium === 'manychat' || medium === 'dm') return 'fb_manychat'
    return 'fb_bio'
  }
  
  // TikTok
  if (source === 'tiktok' || source === 'tt') return 'tiktok_bio'
  
  // Threads
  if (source === 'threads' || source === 'th') return 'threads_bio'
  
  // Google
  if (source === 'google' || source === 'google.com') return 'google_organic'
  
  return 'other_organic'
}
