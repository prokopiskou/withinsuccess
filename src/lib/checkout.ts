import { getStoredUTMs } from './utmCapture'

export type CheckoutProduct = '63days' | '30days'

/** Διαβάζει ένα cookie από τον browser (π.χ. _fbp, _fbc του Meta pixel). */
function readCookie(name: string): string {
  if (typeof document === 'undefined') return ''
  const m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'))
  return m ? decodeURIComponent(m[1]) : ''
}

/**
 * Επιστρέφει το _fbc. Αν δεν υπάρχει cookie αλλά υπάρχει fbclid στο URL
 * (π.χ. πρώτο click από διαφήμιση), το φτιάχνει στη μορφή που θέλει το Meta.
 */
function getFbc(): string {
  const existing = readCookie('_fbc')
  if (existing) return existing
  if (typeof window === 'undefined') return ''
  const fbclid = new URLSearchParams(window.location.search).get('fbclid')
  return fbclid ? `fb.1.${Date.now()}.${fbclid}` : ''
}

/**
 * Initiates Stripe checkout with full UTM attribution.
 *
 * Flow:
 * 1. Reads stored UTMs from localStorage
 * 2. POSTs to /api/stripe/create-session with product + UTMs
 * 3. Redirects browser to Stripe checkout URL
 *
 * Pass the Stripe payment link as fallback in case API fails.
 */
export async function startCheckout(
  product: CheckoutProduct,
  fallbackUrl: string
): Promise<void> {
  if (typeof window === 'undefined') return

  const utm = getStoredUTMs()

  try {
    const res = await fetch('/api/stripe/create-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product, utm, fbp: readCookie('_fbp'), fbc: getFbc() }),
    })

    if (!res.ok) throw new Error(`Checkout API failed: ${res.status}`)

    const data = await res.json()

    if (data?.url) {
      window.location.href = data.url
      return
    }

    throw new Error('No checkout URL returned')
  } catch (err) {
    console.error('Checkout error, using fallback link:', err)
    // Fallback: redirect to direct payment link (loses attribution but user still pays)
    window.location.href = fallbackUrl
  }
}
