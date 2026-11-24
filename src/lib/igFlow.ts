import { supabaseAdmin } from '@/lib/manychat-utils'
import {
  type Button,
  type IgAutomation,
  type Outgoing,
  type Recipient,
  fill,
  followsMe,
  getIgUserId,
  matches,
  pick,
  replyToComment,
  sendDm,
  withCapture,
  trackedLink,
} from '@/lib/igClient'

/**
 * Ροή Within DM:
 * σχόλιο → δημόσια απάντηση → DM με κουμπί «Στείλε μου το link»
 *   → (αν ζητείται follow και δεν ακολουθεί: «Κάνε follow» + κουμπί «Σε ακολουθώ»)
 *   → link με κουμπί → αν δεν πατήσει σε Χ λεπτά, ένα follow-up.
 *
 * Instagram κανόνας: μετά το σχόλιο επιτρέπεται ΕΝΑ μήνυμα μέχρι να απαντήσει ο χρήστης.
 * Γι' αυτό το follow-up στέλνεται μόνο σε όσους πάτησαν το πρώτο κουμπί.
 */

type Thread = {
  id: string
  automation_id: string
  ig_user_id: string
  username: string | null
  source: string
  stage: string
  follows: boolean | null
  follow_asks: number
  tapped_at: string | null
  link_sent_at: string | null
  clicked_at: string | null
  followup_sent_at: string | null
}

// ---------- webhook entry ----------

export type WebhookBody = {
  object?: string
  entry?: Array<{
    id?: string
    changes?: Array<{ field: string; value: CommentValue }>
    field?: string
    value?: CommentValue
    messaging?: Array<MessagingEvent>
  }>
}
export type CommentValue = {
  id?: string
  comment_id?: string
  text?: string
  parent_id?: string
  from?: { id: string; username?: string }
  media?: { id: string; media_product_type?: string }
}
export type MessagingEvent = {
  sender?: { id: string }
  recipient?: { id: string }
  message?: { mid: string; text?: string; is_echo?: boolean; is_deleted?: boolean; is_self?: boolean }
  postback?: { mid?: string; title?: string; payload?: string }
}

export async function handleWebhook(body: WebhookBody) {
  if (body.object !== 'instagram') return
  for (const entry of body.entry || []) {
    const myId = entry.id || (await getIgUserId())
    const changes = entry.changes || (entry.field && entry.value ? [{ field: entry.field, value: entry.value }] : [])
    for (const change of changes) {
      if (change.field === 'comments') await onComment(change.value, myId)
    }
    for (const m of entry.messaging || []) {
      if (m.postback) await onPostback(m, myId)
      else if (m.message) await onMessage(m, myId)
    }
  }
}

// ---------- helpers ----------

async function activeAutomations(): Promise<IgAutomation[]> {
  const { data, error } = await supabaseAdmin.from('ig_automations').select('*').eq('active', true).order('created_at')
  if (error) throw error
  return (data || []) as IgAutomation[]
}

async function getAutomation(id: string): Promise<IgAutomation | null> {
  const { data } = await supabaseAdmin.from('ig_automations').select('*').eq('id', id).maybeSingle()
  return (data as IgAutomation) || null
}

async function log(e: { automation_id?: string | null; type: string; ig_user_id?: string | null; username?: string | null; detail?: string | null }) {
  await supabaseAdmin.from('ig_events').insert(e)
}

async function updateThread(id: string, patch: Record<string, unknown>) {
  await supabaseAdmin.from('ig_threads').update(patch).eq('id', id)
}

/** Ένα άτομο ανά αυτοματισμό ανά 24ωρο (όχι spam αν σχολιάσει 5 φορές) */
async function handledRecently(automationId: string, igUserId: string) {
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString()
  const { count } = await supabaseAdmin
    .from('ig_threads')
    .select('id', { count: 'exact', head: true })
    .eq('automation_id', automationId)
    .eq('ig_user_id', igUserId)
    .gte('created_at', since)
  return (count || 0) > 0
}

const payload = (threadId: string, action: 'LINK' | 'FOLLOW') => `WD:${threadId}:${action}`
const minutesFromNow = (m: number) => new Date(Date.now() + Math.max(5, Math.min(m, 1380)) * 60000).toISOString()

async function startThread(
  a: IgAutomation,
  t: { igUserId: string; username?: string | null; source: 'comment' | 'dm'; refId: string; text: string },
): Promise<Thread | null> {
  if (await handledRecently(a.id, t.igUserId)) return null
  const { data, error } = await supabaseAdmin
    .from('ig_threads')
    .insert({
      automation_id: a.id,
      ig_user_id: t.igUserId,
      username: t.username || null,
      source: t.source,
      ref_id: t.refId,
      comment_text: t.text.slice(0, 300),
    })
    .select('*')
    .single()
  if (error) {
    if (error.code !== '23505') console.error('[IG] startThread', error) // 23505 = ίδιο event ξανά από το Meta
    return null
  }
  return data as Thread
}

/** Πρώτο μήνυμα: κουμπί «Στείλε μου το link» ή κατευθείαν το link */
async function sendOpening(a: IgAutomation, th: Thread, to: Recipient) {
  const now = new Date().toISOString()
  const text = fill(a.dm_text, th.username)
  if (a.use_tap || !a.link_url) {
    const buttons: Button[] = a.link_url ? [{ type: 'postback', title: a.tap_label || 'Στείλε μου το link', payload: payload(th.id, 'LINK') }] : []
    const r = await sendDm(to, text, buttons)
    await updateThread(th.id, r.ok ? { dm_sent_at: now, stage: 'dm_sent' } : { stage: 'failed', last_error: `${r.status} ${r.text.slice(0, 280)}` })
    return
  }
  // Χωρίς ενδιάμεσο κουμπί: link κατευθείαν (follow-up δυνατό μόνο αν μας έγραψε σε DM)
  const r = await sendDm(to, text, [{ type: 'web_url', title: a.button_label || 'Δες εδώ', url: trackedLink(th.id) }])
  const canFollowup = a.followup_enabled && th.source === 'dm'
  await updateThread(
    th.id,
    r.ok
      ? { dm_sent_at: now, link_sent_at: now, stage: 'link_sent', ...(canFollowup ? { followup_due_at: minutesFromNow(a.followup_minutes) } : {}) }
      : { stage: 'failed', last_error: `${r.status} ${r.text.slice(0, 280)}` },
  )
}

/** Μετά το tap: έλεγχος follow → link */
async function deliverLink(a: IgAutomation, th: Thread, igsid: string) {
  if (!a.link_url) return
  const to = { id: igsid }

  if (a.follow_gate) {
    const f = await followsMe(igsid)
    await updateThread(th.id, { follows: f })
    if (f === false && th.follow_asks < 2) {
      const r = await sendDm(to, fill(a.follow_text, th.username), [
        { type: 'postback', title: a.follow_label || 'Σε ακολουθώ', payload: payload(th.id, 'FOLLOW') },
      ])
      await updateThread(th.id, {
        stage: r.ok ? 'follow_asked' : 'failed',
        follow_asks: th.follow_asks + 1,
        ...(r.ok ? {} : { last_error: `${r.status} ${r.text.slice(0, 280)}` }),
        ...(a.followup_enabled && !th.followup_sent_at ? { followup_due_at: minutesFromNow(a.followup_minutes) } : {}),
      })
      return
    }
  }

  const r = await sendDm(to, fill(a.link_text, th.username), [{ type: 'web_url', title: a.button_label || 'Δες εδώ', url: trackedLink(th.id) }])
  await updateThread(th.id, {
    ...(r.ok ? { link_sent_at: th.link_sent_at || new Date().toISOString(), stage: th.clicked_at ? 'clicked' : 'link_sent' } : { stage: 'failed', last_error: `${r.status} ${r.text.slice(0, 280)}` }),
    ...(r.ok && a.followup_enabled && !th.followup_sent_at && !th.clicked_at ? { followup_due_at: minutesFromNow(a.followup_minutes) } : {}),
  })
}

// ---------- handlers ----------

export async function onComment(v: CommentValue, myId: string, only?: IgAutomation) {
  const commentId = v?.id || v?.comment_id
  if (!commentId || !v.text || !v.from?.id || v.from.id === myId) return
  const text = v.text
  const automations = only ? [only] : await activeAutomations()
  const a = automations.find(x => (!x.media_id || x.media_id === v.media?.id) && matches(text, x.keywords))
  if (!a) return

  const th = await startThread(a, { igUserId: v.from.id, username: v.from.username, source: 'comment', refId: commentId, text })
  if (!th) return
  await log({ automation_id: a.id, type: 'comment', ig_user_id: v.from.id, username: v.from.username, detail: text.slice(0, 300) })

  const reply = pick(a.public_replies.filter(Boolean))
  if (reply) {
    const r = await replyToComment(commentId, fill(reply, v.from.username))
    if (!r.ok) console.warn('[IG] public reply failed', r.status, r.text.slice(0, 300))
  }
  await sendOpening(a, th, { comment_id: commentId })
}

export async function onMessage(m: MessagingEvent, myId: string) {
  const msg = m.message
  const from = m.sender?.id
  if (!msg?.text || !from || msg.is_echo || msg.is_deleted || msg.is_self || from === myId) return
  const a = (await activeAutomations()).find(x => x.trigger_dm && matches(msg.text!, x.keywords))
  if (!a) return
  const th = await startThread(a, { igUserId: from, source: 'dm', refId: msg.mid, text: msg.text })
  if (!th) return
  await log({ automation_id: a.id, type: 'dm_in', ig_user_id: from, detail: msg.text.slice(0, 300) })
  await sendOpening(a, th, { id: from })
}

export async function onPostback(m: MessagingEvent, myId: string) {
  const from = m.sender?.id
  const p = m.postback?.payload || ''
  if (!from || from === myId) return
  const match = /^WD:([0-9a-f-]{36}):(LINK|FOLLOW)$/.exec(p)
  if (!match) return

  // Το Meta μπορεί να ξαναστείλει το ίδιο event
  if (m.postback?.mid) {
    const { error } = await supabaseAdmin.from('ig_events').insert({ type: 'postback', ref_id: m.postback.mid, ig_user_id: from, detail: p })
    if (error?.code === '23505') return
  }

  const { data } = await supabaseAdmin.from('ig_threads').select('*').eq('id', match[1]).maybeSingle()
  const th = data as Thread | null
  if (!th) return
  const a = await getAutomation(th.automation_id)
  if (!a) return

  // Από εδώ και πέρα στέλνουμε στο messaging ID του (ανοιχτό παράθυρο 24 ωρών)
  const patch: Record<string, unknown> = { ig_user_id: from }
  if (!th.tapped_at) patch.tapped_at = new Date().toISOString()
  await updateThread(th.id, patch)
  await deliverLink(a, { ...th, ig_user_id: from }, from)
}

/** Καλείται κάθε λεπτό: στέλνει όσα follow-up έχουν «λήξει» */
export async function processFollowups(): Promise<{ sent: number; skipped: number }> {
  const { data } = await supabaseAdmin
    .from('ig_threads')
    .select('*')
    .lte('followup_due_at', new Date().toISOString())
    .is('followup_sent_at', null)
    .is('clicked_at', null)
    .limit(50)

  let sent = 0
  let skipped = 0
  for (const th of (data || []) as (Thread & { tapped_at: string | null; created_at: string })[]) {
    // «Κλείδωμα» ώστε να μη σταλεί δύο φορές αν τρέξουν δύο cron μαζί
    const { data: claimed } = await supabaseAdmin
      .from('ig_threads')
      .update({ followup_sent_at: new Date().toISOString() })
      .eq('id', th.id)
      .is('followup_sent_at', null)
      .select('id')
    if (!claimed?.length) continue

    const a = await getAutomation(th.automation_id)
    const windowStart = new Date(th.tapped_at || th.created_at).getTime()
    if (!a || !a.followup_enabled || !a.link_url || Date.now() - windowStart > 23.5 * 3600 * 1000) {
      skipped++
      continue
    }
    const to = { id: th.ig_user_id }
    const r =
      th.stage === 'follow_asked'
        ? await sendDm(to, fill(a.follow_text, th.username), [{ type: 'postback', title: a.follow_label || 'Σε ακολουθώ', payload: payload(th.id, 'FOLLOW') }])
        : await sendDm(to, fill(a.followup_text, th.username), [{ type: 'web_url', title: a.button_label || 'Δες εδώ', url: trackedLink(th.id) }])
    if (r.ok) sent++
    else await updateThread(th.id, { last_error: `followup ${r.status} ${r.text.slice(0, 260)}` })
  }
  return { sent, skipped }
}

/**
 * «Δοκιμή» από το dashboard: τρέχει όλη τη ροή με ψεύτικο χρήστη που ΔΕΝ σε ακολουθεί,
 * χωρίς να στείλει τίποτα, και επιστρέφει τα μηνύματα με τη σειρά. Μετά σβήνει τα ίχνη.
 */
export async function simulate(automationId: string): Promise<Outgoing[]> {
  const a = await getAutomation(automationId)
  if (!a) return []
  const fakeUser = `sim_${crypto.randomUUID()}`
  const fakeComment = `sim_${crypto.randomUUID()}`
  try {
    return await withCapture(async () => {
      await onComment(
        { id: fakeComment, text: a.keywords[0] || 'test', from: { id: fakeUser, username: 'dokimi' }, media: { id: a.media_id || 'any' } },
        'me',
        { ...a, active: true },
      )
      const { data } = await supabaseAdmin.from('ig_threads').select('*').eq('ref_id', fakeComment).maybeSingle()
      const th = data as Thread | null
      if (!th || !a.use_tap || !a.link_url) return
      // 1ο tap: προσομοίωση «δεν ακολουθεί»
      if (a.follow_gate) {
        await sendDm({ id: fakeUser }, fill(a.follow_text, 'dokimi'), [{ type: 'postback', title: a.follow_label, payload: payload(th.id, 'FOLLOW') }])
      }
      // 2ο tap: ακολουθεί → link
      await deliverLink(a, { ...th, follow_asks: 2 }, fakeUser)
      if (a.followup_enabled) {
        await sendDm({ id: fakeUser }, fill(a.followup_text, 'dokimi'), [{ type: 'web_url', title: a.button_label || 'Δες εδώ', url: trackedLink(th.id) }])
      }
    })
  } finally {
    await supabaseAdmin.from('ig_threads').delete().like('ig_user_id', 'sim_%')
    await supabaseAdmin.from('ig_events').delete().like('ig_user_id', 'sim_%')
  }
}
