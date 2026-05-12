'use client'

// ============================================================
// COOKIE CONSENT STATE MANAGEMENT — GDPR + Google Consent Mode v2
// ============================================================

export type ConsentState = {
  necessary: true       // Always true (essential)
  statistics: boolean   // Google Analytics
  marketing: boolean    // Meta Pixel
  timestamp: string     // ISO date when consent was given
  version: string       // Consent version (for tracking updates)
}

const CONSENT_KEY = 'ws_consent'
const CURRENT_VERSION = '1.0'

declare global {
  interface Window {
    gtag?: (...args: any[]) => void
    fbq?: (...args: any[]) => void
    _fbq?: any
  }
}

// ============================================================
// READ — Get current consent state from localStorage
// ============================================================
export function getConsent(): ConsentState | null {
  if (typeof window === 'undefined') return null
  
  try {
    const raw = localStorage.getItem(CONSENT_KEY)
    if (!raw) return null
    
    const parsed = JSON.parse(raw) as ConsentState
    
    // Force re-consent if version changed
    if (parsed.version !== CURRENT_VERSION) return null
    
    return parsed
  } catch {
    return null
  }
}

// ============================================================
// SAVE — Persist consent + update tracking systems
// ============================================================
export function saveConsent(consent: Omit<ConsentState, 'necessary' | 'timestamp' | 'version'>) {
  if (typeof window === 'undefined') return
  
  const fullConsent: ConsentState = {
    necessary: true,
    statistics: consent.statistics,
    marketing: consent.marketing,
    timestamp: new Date().toISOString(),
    version: CURRENT_VERSION,
  }
  
  localStorage.setItem(CONSENT_KEY, JSON.stringify(fullConsent))
  
  // Update Google Consent Mode v2
  updateGoogleConsent(fullConsent)
  
  // Activate/deactivate Meta Pixel based on marketing consent
  updateMetaPixel(fullConsent.marketing)
  
  // Dispatch event for components to listen
  window.dispatchEvent(new CustomEvent('consent-updated', { detail: fullConsent }))
}

// ============================================================
// ACCEPT ALL — Shortcut for full consent
// ============================================================
export function acceptAll() {
  saveConsent({ statistics: true, marketing: true })
}

// ============================================================
// REJECT ALL — Only necessary cookies
// ============================================================
export function rejectAll() {
  saveConsent({ statistics: false, marketing: false })
}

// ============================================================
// GOOGLE CONSENT MODE v2 — Update GA4 consent signals
// ============================================================
function updateGoogleConsent(consent: ConsentState) {
  if (typeof window === 'undefined' || !window.gtag) return
  
  window.gtag('consent', 'update', {
    'analytics_storage': consent.statistics ? 'granted' : 'denied',
    'ad_storage': consent.marketing ? 'granted' : 'denied',
    'ad_user_data': consent.marketing ? 'granted' : 'denied',
    'ad_personalization': consent.marketing ? 'granted' : 'denied',
    'functionality_storage': 'granted',
    'personalization_storage': consent.statistics ? 'granted' : 'denied',
    'security_storage': 'granted',
  })
}

// ============================================================
// META PIXEL — Enable/disable based on marketing consent
// ============================================================
function updateMetaPixel(marketingConsent: boolean) {
  if (typeof window === 'undefined') return
  
  if (marketingConsent) {
    // Grant consent + fire delayed PageView
    if (window.fbq) {
      window.fbq('consent', 'grant')
      window.fbq('track', 'PageView')
    }
  } else {
    // Revoke consent
    if (window.fbq) {
      window.fbq('consent', 'revoke')
    }
  }
}

// ============================================================
// INITIALIZE — Call on app load to set Google Consent Mode defaults
// ============================================================
export function initializeConsent() {
  if (typeof window === 'undefined') return
  
  const existing = getConsent()
  
  if (existing) {
    // User has already given consent — apply their preferences
    updateGoogleConsent(existing)
    updateMetaPixel(existing.marketing)
  }
  // If no existing consent, the default 'denied' state from layout.tsx remains
}
