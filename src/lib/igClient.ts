import { AsyncLocalStorage } from 'node:async_hooks'
import { supabaseAdmin } from '@/lib/manychat-utils'

/**
 * Within DM — Instagram API with Instagram Login (graph.instagram.com).
 * Env (μόνο στο Vercel, ποτέ στον κώδικα): IG_ACCESS_TOKEN, IG_APP_SECRET, IG_VERIFY_TOKEN, προαιρετικά IG_USER_ID.
 * Το token ανανεώνεται κάθε εβδομάδα από το /api/ig/cron και αποθηκεύεται στο ig_settings.
 *
 * Dry-run: όσο δεν υπάρχει token ή είναι ανοιχτό το «Dry-run» στο dashboard, δεν φεύγει τίποτα.
 */
const API_VERSION = process.env.IG_API_VERSION || 'v24.0'
const BASE = `https://graph.instagram.com/${API_VERSION}`

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://withinsuccess.gr'

export type IgAutomation = {
  id: string
  name: string
  keywords: string[]
  media_id: string | null
  media_caption: string | null
  media_thumb: string | null
  public_replies: string[]
  dm_text: string
  button_label: string | null
  link_url: string | null
  trigger_dm: boolean
  active: boolean
  use_tap: boolean
  tap_label: string
  link_text: string
  follow_gate: boolean
  follow_text: string
  follow_label: string
  followup_enabled: boolean
  followup_minutes: number
  followup_text: string
}

// ---------- settings / token ----------

async function getSetting(key: string): Promise<string | null> {
  const { data } = await supabaseAdmin.from('ig_settings').select('value').eq('key', key).maybeSingle()
  return data?.value ?? null
}

export async function setSetting(key: string, value: string) {
  await supabaseAdmin.from('ig_settings').upsert({ key, value, updated_at: new Date().toISOString() })
}

async function tokenOrNull(): Promise<string | null> {
  return (await getSetting('access_token')) || process.env.IG_ACCESS_TOKEN || null
}

export async function getToken(): Promise<string> {
  const token = await tokenOrNull()
  if (!token) throw new Error('Δεν έχει μπει ακόμα IG_ACCESS_TOKEN')
  return token
}

export async function hasToken() {
  return !!(await tokenOrNull())
}

export async function isDryRun(): Promise<boolean> {
  if (!(await hasToken())) return true
  return (await getSetting('dry_run')) === '1'
}

let cachedUserId: string | null = null

/** Το ID του δικού μας IG λογαριασμού (όπως έρχεται στα webhooks) */
export async function getIgUserId(): Promise<string> {
  if (process.env.IG_USER_ID) return process.env.IG_USER_ID
  if (cachedUserId) return cachedUserId
  const stored = await getSetting('ig_user_id')
  if (stored) return (cachedUserId = stored)
  const me = await getAccount()
  await setSetting('ig_user_id', me.user_id)
  return (cachedUserId = me.user_id)
}

export async function getAccount(): Promise<{ user_id: string; username: string }> {
  const token = await getToken()
  const res = await fetch(`${BASE}/me?fields=user_id,username`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`IG /me ${res.status}: ${await res.text()}`)
  return res.json()
}

export async function refreshToken(): Promise<{ ok: boolean; expiresInDays?: number; error?: string }> {
  const token = await tokenOrNull()
  if (!token) return { ok: true, error: 'no token yet' }
  const url = `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(token)}`
  const res = await fetch(url, { cache: 'no-store' })
  const json = await res.json().catch(() => ({}))
  if (!res.ok || !json.access_token) return { ok: false, error: JSON.stringify(json).slice(0, 300) }
  await setSetting('access_token', json.access_token)
  return { ok: true, expiresInDays: Math.round((json.expires_in || 0) / 86400) }
}

// ---------- capture (για τη «Δοκιμή» στο dashboard) ----------

export type Outgoing = { kind: 'public_reply' | 'dm'; to: string; text: string; buttons?: { title: string; url?: string; payload?: string }[] }
const captureStore = new AsyncLocalStorage<Outgoing[]>()
const capturing = () => captureStore.getStore()

/** Τρέχει τη ροή χωρίς να στείλει τίποτα και επιστρέφει τα μηνύματα που θα έφευγαν */
export async function withCapture(fn: () => Promise<void>): Promise<Outgoing[]> {
  const out: Outgoing[] = []
  await captureStore.run(out, fn)
  return out
}

type Result = { ok: boolean; status: number; text: string }

async function igPost(path: string, body: unknown, describe: Outgoing): Promise<Result> {
  const capture = capturing()
  if (capture) {
    capture.push(describe)
    return { ok: true, status: 200, text: 'captured' }
  }
  if (await isDryRun()) {
    await supabaseAdmin.from('ig_events').insert({ type: 'dry_run', detail: JSON.stringify(describe).slice(0, 900) })
    return { ok: true, status: 200, text: 'dry-run' }
  }
  const token = await getToken()
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return { ok: res.ok, status: res.status, text: await res.text() }
}

// ---------- sending ----------

export type Recipient = { comment_id: string } | { id: string }
export type Button = { type: 'web_url'; title: string; url: string } | { type: 'postback'; title: string; payload: string }

function who(r: Recipient) {
  return 'comment_id' in r ? `σχόλιο ${r.comment_id}` : r.id
}

/** Μήνυμα με έως 3 κουμπιά. Αν το template αποτύχει και υπάρχει link, στέλνει απλό κείμενο με το link. */
export async function sendDm(recipient: Recipient, text: string, buttons: Button[] = []): Promise<Result> {
  const describe: Outgoing = {
    kind: 'dm',
    to: who(recipient),
    text,
    buttons: buttons.map(b => ({ title: b.title, ...(b.type === 'web_url' ? { url: b.url } : { payload: b.payload }) })),
  }
  const igId = capturing() || (await isDryRun()) ? 'me' : await getIgUserId()

  if (buttons.length) {
    const r = await igPost(
      `/${igId}/messages`,
      {
        recipient,
        message: {
          attachment: {
            type: 'template',
            payload: {
              template_type: 'button',
              text: text.slice(0, 640),
              buttons: buttons.slice(0, 3).map(b => ({ ...b, title: b.title.slice(0, 20) })),
            },
          },
        },
      },
      describe,
    )
    if (r.ok) return r
    console.warn('[IG] button template failed:', r.status, r.text.slice(0, 300))
    const url = buttons.find(b => b.type === 'web_url') as { url: string } | undefined
    if (!url) return r
    return igPost(`/${igId}/messages`, { recipient, message: { text: `${text}\n\n${url.url}`.slice(0, 1000) } }, describe)
  }
  return igPost(`/${igId}/messages`, { recipient, message: { text: text.slice(0, 1000) } }, describe)
}

export async function replyToComment(commentId: string, message: string) {
  return igPost(`/${commentId}/replies`, { message }, { kind: 'public_reply', to: `σχόλιο ${commentId}`, text: message })
}

/** Σε ακολουθεί; null = δεν ξέρουμε (τότε δεν μπλοκάρουμε). */
export async function followsMe(igsid: string): Promise<boolean | null> {
  if (capturing()) return true
  if (await isDryRun()) return true
  try {
    const token = await getToken()
    const res = await fetch(`${BASE}/${igsid}?fields=is_user_follow_business`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!res.ok) {
      console.warn('[IG] follow check failed', res.status, (await res.text()).slice(0, 200))
      return null
    }
    const json = await res.json()
    return typeof json.is_user_follow_business === 'boolean' ? json.is_user_follow_business : null
  } catch {
    return null
  }
}

export type IgMedia = {
  id: string
  caption?: string
  media_type: string
  media_product_type?: string
  thumbnail_url?: string
  media_url?: string
  permalink: string
  timestamp: string
}

export async function listMedia(limit = 24): Promise<IgMedia[]> {
  const token = await getToken()
  const fields = 'id,caption,media_type,media_product_type,thumbnail_url,media_url,permalink,timestamp'
  const res = await fetch(`${BASE}/me/media?fields=${fields}&limit=${limit}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`IG media ${res.status}: ${await res.text()}`)
  const json = await res.json()
  return json.data || []
}

// ---------- matching / helpers ----------

export function normalize(s: string): string {
  return ` ${s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ς/g, 'σ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()} `
}

/** Ταιριάζει αν το κείμενο περιέχει λέξη-κλειδί ως ολόκληρη λέξη/φράση (χωρίς τόνους, κεφαλαία). */
export function matches(text: string, keywords: string[]): boolean {
  const t = normalize(text)
  return keywords.some(k => {
    const kw = normalize(k).trim()
    return kw.length > 0 && t.includes(` ${kw} `)
  })
}

export function pick<T>(arr: T[]): T | undefined {
  return arr.length ? arr[Math.floor(Math.random() * arr.length)] : undefined
}

export function fill(text: string, username?: string | null): string {
  return text.replace(/\{username\}/g, username ? `@${username}` : '').replace(/ {2,}/g, ' ').trim()
}

/** Link που περνάει από εμάς για να μετράμε κλικ */
export function trackedLink(threadId: string) {
  return `${SITE_URL}/api/ig/go/${threadId}`
}
