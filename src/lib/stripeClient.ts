import Stripe from 'stripe'

let cachedClient: Stripe | null = null

export function getStripeClient(): Stripe {
  if (cachedClient) return cachedClient

  const apiKey = process.env.STRIPE_SECRET_KEY
  if (!apiKey) {
    throw new Error('Missing STRIPE_SECRET_KEY env var')
  }

  cachedClient = new Stripe(apiKey, {
    apiVersion: '2026-03-25.dahlia',
    typescript: true,
  })

  return cachedClient
}
