// ============================================================
// Analytics helper — GA4 + Meta Pixel
// Fires events to both platforms with consistent IDs for deduplication
// ============================================================

declare global {
  interface Window {
    gtag?: (...args: any[]) => void
    fbq?: (...args: any[]) => void
  }
}

// Check if marketing consent is granted for Meta Pixel
function hasMarketingConsent(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const raw = localStorage.getItem('ws_consent')
    if (!raw) return false
    const consent = JSON.parse(raw)
    return consent.marketing === true
  } catch {
    return false
  }
}

// Check if statistics consent is granted for GA4
// Note: GA4 uses Consent Mode v2, but we still respect the user choice strictly
function hasStatisticsConsent(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const raw = localStorage.getItem('ws_consent')
    if (!raw) return false
    const consent = JSON.parse(raw)
    return consent.statistics === true
  } catch {
    return false
  }
}

type ProductInfo = {
  id: string
  name: string
  price: number
}

// Generate unique event ID for server CAPI deduplication
function generateEventId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

// ============================================================
// PURCHASE — Fires on thank-you page (KEY EVENT in GA4)
// ============================================================
export function trackPurchase(product: ProductInfo, transactionId?: string) {
  if (typeof window === 'undefined') return

  const eventId = transactionId || generateEventId('purchase')

  // GA4
  if (hasStatisticsConsent()) {
    window.gtag?.('event', 'purchase', {
      transaction_id: eventId,
      value: product.price,
      currency: 'EUR',
      items: [{
        item_id: product.id,
        item_name: product.name,
        price: product.price,
        quantity: 1
      }]
    })
  }

  // Meta Pixel
  if (hasMarketingConsent()) {
    window.fbq?.('track', 'Purchase', {
      value: product.price,
      currency: 'EUR',
      content_name: product.name,
      content_type: 'product',
      content_ids: [product.id]
    }, { eventID: eventId })
  }

  console.log('[Analytics] Purchase tracked:', eventId, product)
}

// ============================================================
// BEGIN CHECKOUT — Fires on Stripe button click (REGULAR EVENT)
// ============================================================
export function trackBeginCheckout(product: ProductInfo) {
  if (typeof window === 'undefined') return

  const eventId = generateEventId('checkout')

  // GA4 — NOT a key event, just for funnel analysis
  if (hasStatisticsConsent()) {
    window.gtag?.('event', 'begin_checkout', {
      value: product.price,
      currency: 'EUR',
      items: [{
        item_id: product.id,
        item_name: product.name,
        price: product.price,
        quantity: 1
      }]
    })
  }

  // Meta Pixel — InitiateCheckout (standard event for ads optimization)
  if (hasMarketingConsent()) {
    window.fbq?.('track', 'InitiateCheckout', {
      value: product.price,
      currency: 'EUR',
      content_name: product.name,
      content_ids: [product.id]
    }, { eventID: eventId })
  }

  console.log('[Analytics] Begin checkout tracked:', product.name)
}

// ============================================================
// LEAD CATEGORIES — for segmentation in GA4 + Meta
// ============================================================
export type LeadCategory = 
  | 'quiz'        // Assessment email submission
  | 'seminars'    // Seminar waitlist
  | '1-1'         // Coaching application
  | 'newsletter'  // Newsletter signup
  | 'general'     // Generic fallback

export function trackLead(category: LeadCategory, source?: string) {
  if (typeof window === 'undefined') return

  const eventId = generateEventId('lead')
  const eventSource = source || category

  // GA4 — event with custom parameter for segmentation
  if (hasStatisticsConsent()) {
    window.gtag?.('event', 'generate_lead', {
      lead_type: category,
      source: eventSource
    })
  }

  // Meta Pixel — Lead event with content_category for segmentation
  if (hasMarketingConsent()) {
    window.fbq?.('track', 'Lead', {
      content_category: category,
      content_name: eventSource
    }, { eventID: eventId })
  }

  console.log(`[Analytics] Lead tracked: ${category} from ${eventSource}`)
}

// Helper shortcuts for common lead actions
export const trackQuizLead = () => trackLead('quiz', 'assessment')
export const trackSeminarWaitlist = (seminarName: string) => trackLead('seminars', seminarName)
export const trackCoachingApplication = () => trackLead('1-1', 'application_form')
export const trackNewsletterSignup = (location: string) => trackLead('newsletter', location)

// ============================================================
// CUSTOM EVENTS — For specific funnel steps
// ============================================================
export function trackEvent(eventName: string, params?: Record<string, any>) {
  if (typeof window === 'undefined') return

  if (hasStatisticsConsent()) {
    window.gtag?.('event', eventName, params || {})
  }
  console.log('[Analytics] Event:', eventName, params)
}

// Pre-defined custom events
export const trackAssessmentStarted = () => trackEvent('assessment_started')
export const trackAssessmentCompleted = () => trackEvent('assessment_completed')
export const trackViberClick = () => trackEvent('viber_link_click')
export const trackArticleToAssessment = (articleSlug: string) => 
  trackEvent('article_to_assessment', { article_slug: articleSlug })

// ============================================================
// VIEW PRICING — Fires when user sees pricing section
// (high-intent signal in funnel)
// ============================================================
export const trackViewPricing = (page: string) =>
  trackEvent('view_pricing', { page })

// ============================================================
// SCROLL DEPTH — Fires at 25%, 50%, 75%, 100% milestones
// ============================================================
export const trackScrollDepth = (depth: 25 | 50 | 75 | 100, page: string) =>
  trackEvent('scroll_depth', { depth, page })
