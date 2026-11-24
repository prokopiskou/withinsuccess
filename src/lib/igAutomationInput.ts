/** Καθαρισμός/έλεγχος φόρμας αυτοματισμού (Within DM) */
export type AutomationInput = {
  name?: string
  keywords?: string[]
  media_id?: string | null
  media_caption?: string | null
  media_thumb?: string | null
  public_replies?: string[]
  dm_text?: string
  button_label?: string | null
  link_url?: string | null
  trigger_dm?: boolean
  active?: boolean
  use_tap?: boolean
  tap_label?: string
  link_text?: string
  follow_gate?: boolean
  follow_text?: string
  follow_label?: string
  followup_enabled?: boolean
  followup_minutes?: number
  followup_text?: string
}

const txt = (v: unknown, max: number, fallback: string) => String(v ?? '').trim().slice(0, max) || fallback

/** Καθαρίζει/ελέγχει ό,τι έρχεται από τη φόρμα. Επιστρέφει string αν υπάρχει λάθος. */
export function clean(input: AutomationInput, partial = false): AutomationInput | string {
  const out: AutomationInput = {}
  if (input.name !== undefined) out.name = String(input.name).trim().slice(0, 80)
  if (input.keywords !== undefined)
    out.keywords = input.keywords.map(k => String(k).trim()).filter(Boolean).slice(0, 20)
  if (input.media_id !== undefined) out.media_id = input.media_id || null
  if (input.media_caption !== undefined) out.media_caption = input.media_caption?.slice(0, 200) || null
  if (input.media_thumb !== undefined) out.media_thumb = input.media_thumb || null
  if (input.public_replies !== undefined)
    out.public_replies = input.public_replies.map(r => String(r).trim()).filter(Boolean).slice(0, 10)
  if (input.dm_text !== undefined) out.dm_text = String(input.dm_text).trim().slice(0, 640)
  if (input.button_label !== undefined) out.button_label = input.button_label?.trim().slice(0, 20) || null
  if (input.link_url !== undefined) {
    const u = input.link_url?.trim() || null
    if (u && !/^https:\/\/\S+$/.test(u)) return 'Το link πρέπει να ξεκινάει με https://'
    out.link_url = u
  }
  if (input.trigger_dm !== undefined) out.trigger_dm = !!input.trigger_dm
  if (input.active !== undefined) out.active = !!input.active
  if (input.use_tap !== undefined) out.use_tap = !!input.use_tap
  if (input.tap_label !== undefined) out.tap_label = txt(input.tap_label, 20, 'Στείλε μου το link')
  if (input.link_text !== undefined) out.link_text = txt(input.link_text, 640, 'Ορίστε 👇')
  if (input.follow_gate !== undefined) out.follow_gate = !!input.follow_gate
  if (input.follow_text !== undefined) out.follow_text = txt(input.follow_text, 640, 'Κάνε πρώτα follow και πάτα το κουμπί.')
  if (input.follow_label !== undefined) out.follow_label = txt(input.follow_label, 20, 'Σε ακολουθώ')
  if (input.followup_enabled !== undefined) out.followup_enabled = !!input.followup_enabled
  if (input.followup_minutes !== undefined) {
    const m = Math.round(Number(input.followup_minutes))
    if (!Number.isFinite(m) || m < 5 || m > 1380) return 'Το follow-up θέλει από 5 λεπτά έως 23 ώρες'
    out.followup_minutes = m
  }
  if (input.followup_text !== undefined) out.followup_text = txt(input.followup_text, 640, 'Το link σου είναι ακόμα εδώ 👇')

  if (!partial) {
    if (!out.name) return 'Βάλε όνομα'
    if (!out.keywords?.length) return 'Βάλε τουλάχιστον μία λέξη-κλειδί'
    if (!out.dm_text) return 'Γράψε το μήνυμα του DM'
  } else {
    if (out.keywords && !out.keywords.length) return 'Βάλε τουλάχιστον μία λέξη-κλειδί'
    if (out.dm_text !== undefined && !out.dm_text) return 'Γράψε το μήνυμα του DM'
  }
  return out
}
