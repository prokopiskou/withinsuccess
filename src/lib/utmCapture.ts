/**
 * UTM tracking utility.
 * - On every page load with UTM params in URL, save them to localStorage
 * - Always overwrites previous (last-touch attribution)
 * - Provides helper to read UTMs when initiating checkout
 */

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const

export type UTMData = {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string
  utm_captured_at?: string
  utm_landing_path?: string
}

/**
 * Call on landing page mount. Captures UTMs from URL → localStorage.
 * Last-touch (always overwrites).
 */
export function captureUTMs(): UTMData {
  if (typeof window === 'undefined') return {}

  const params = new URLSearchParams(window.location.search)
  const captured: UTMData = {}
  let hasAny = false

  for (const key of UTM_KEYS) {
    const value = params.get(key)
    if (value) {
      captured[key] = value
      hasAny = true
    }
  }

  if (hasAny) {
    captured.utm_captured_at = new Date().toISOString()
    captured.utm_landing_path = window.location.pathname

    try {
      localStorage.setItem('utm_attribution', JSON.stringify(captured))
    } catch (err) {
      // Silently fail if localStorage unavailable
      console.warn('Could not save UTMs:', err)
    }
  }

  return captured
}

/**
 * Read currently stored UTMs from localStorage.
 * Returns empty object if none stored.
 */
export function getStoredUTMs(): UTMData {
  if (typeof window === 'undefined') return {}

  try {
    const stored = localStorage.getItem('utm_attribution')
    if (!stored) return {}
    return JSON.parse(stored) as UTMData
  } catch {
    return {}
  }
}

/**
 * Clear stored UTMs (e.g. after successful purchase).
 */
export function clearUTMs(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem('utm_attribution')
  } catch {
    // ignore
  }
}
