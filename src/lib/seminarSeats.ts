import { getStripeClient } from '@/lib/stripeClient'
import { SEMINAR } from '@/lib/seminar'

// Μετράει τα πληρωμένα εισιτήρια δια ζώσης από το Stripe (metadata.product = seminar_live), μαζί με την ποσότητα.
// Το Stripe Search έχει καθυστέρηση ~1 λεπτό, οπότε κρατάμε cache 60''.
let cache: { at: number; sold: number } | null = null

export async function getLiveSeatsSold(): Promise<number> {
  if (cache && Date.now() - cache.at < 60_000) return cache.sold
  const stripe = getStripeClient()
  let sold = 0
  let page: string | undefined
  for (let i = 0; i < 20; i++) {
    const res = await stripe.paymentIntents.search({
      query: "status:'succeeded' AND metadata['product']:'seminar_live'",
      limit: 100,
      ...(page ? { page } : {}),
    })
    // Ένα PaymentIntent μπορεί να έχει πολλά εισιτήρια (ποσότητα στο checkout): θέσεις = ποσό / τιμή
    for (const pi of res.data) {
      sold += Math.max(1, Math.round((pi.amount_received || pi.amount) / (SEMINAR.priceEur * 100)))
    }
    if (!res.has_more || !res.next_page) break
    page = res.next_page
  }
  cache = { at: Date.now(), sold }
  return sold
}

export async function getLiveSeatsLeft(): Promise<number> {
  const sold = await getLiveSeatsSold()
  return Math.max(0, SEMINAR.liveCapacity - sold)
}
