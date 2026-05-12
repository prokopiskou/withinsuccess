const MAILERLITE_API_BASE = 'https://connect.mailerlite.com/api'

export type MailerLiteFetchOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: Record<string, unknown>
  query?: Record<string, string | number>
}

export async function mailerLiteFetch<T = unknown>(
  endpoint: string,
  options: MailerLiteFetchOptions = {}
): Promise<T> {
  const apiKey = process.env.MAILERLITE_API_KEY
  if (!apiKey) {
    throw new Error('Missing MAILERLITE_API_KEY env var')
  }

  let url = `${MAILERLITE_API_BASE}${endpoint}`
  if (options.query) {
    const params = new URLSearchParams()
    Object.entries(options.query).forEach(([k, v]) => params.set(k, String(v)))
    url += `?${params.toString()}`
  }

  const response = await fetch(url, {
    method: options.method || 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`MailerLite API error ${response.status}: ${text}`)
  }

  return response.json() as Promise<T>
}
