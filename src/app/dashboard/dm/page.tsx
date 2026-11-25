'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'

const GOLD = '#C9A96E'
const IG_BLUE = '#3797F0'

type Automation = {
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
type Funnel = { automation_id: string; commented: number; dm_sent: number; tapped: number; link_sent: number; clicked: number; followups: number; failed: number }
type Contact = {
  id: string; automation_id: string; username: string | null; ig_user_id: string; source: string; comment_text: string | null
  stage: string; follows: boolean | null; created_at: string; tapped_at: string | null; clicked_at: string | null; followup_sent_at: string | null; last_error: string | null
}
type Media = { id: string; caption: string; thumb: string | null; type: string; permalink: string; timestamp: string }
type Outgoing = { kind: 'public_reply' | 'dm'; to: string; text: string; buttons?: { title: string; url?: string; payload?: string }[] }
type Data = {
  automations: Automation[]
  funnel: Funnel[]
  contacts: Contact[]
  account: { ok: true; username: string } | { ok: false; error: string }
  tokenSet: boolean
  dryRun: boolean
}

type Form = Omit<Automation, 'id' | 'keywords' | 'public_replies' | 'active' | 'button_label' | 'link_url'> & {
  id?: string
  keywords: string
  public_replies: string
  button_label: string
  link_url: string
}

const EMPTY: Form = {
  name: '',
  keywords: '',
  media_id: null,
  media_caption: null,
  media_thumb: null,
  public_replies: 'Σου το έστειλα στα μηνύματα 🤍\nΔες τα DM σου\nΜόλις σου ήρθε στα μηνύματα',
  dm_text: 'Γεια σου! Πάτα το κουμπί και σου στέλνω το link.',
  use_tap: true,
  tap_label: 'Στείλε μου το link',
  follow_gate: false,
  follow_text: 'Για να σου το στείλω, κάνε πρώτα follow στο προφίλ και μετά πάτα το κουμπί.',
  follow_label: 'Σε ακολουθώ',
  link_text: 'Ορίστε 👇',
  button_label: 'Άνοιξε το link',
  link_url: 'https://withinsuccess.gr/30days',
  followup_enabled: true,
  followup_minutes: 60,
  followup_text: 'Το link σου είναι ακόμα εδώ 👇',
  trigger_dm: true,
}

const STAGE: Record<string, string> = {
  new: 'Νέο',
  dm_sent: 'Πήρε DM',
  follow_asked: 'Του ζητήθηκε follow',
  link_sent: 'Πήρε link',
  clicked: 'Πάτησε link',
  failed: 'Αποτυχία',
}

function timeAgo(iso: string) {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (m < 1) return 'τώρα'
  if (m < 60) return `${m}λ`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}ώ`
  return `${Math.round(h / 24)}μ`
}

export default function DmPage() {
  const [data, setData] = useState<Data | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<'automations' | 'contacts'>('automations')
  const [form, setForm] = useState<Form | null>(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [media, setMedia] = useState<Media[] | null>(null)
  const [mediaError, setMediaError] = useState<string | null>(null)
  const [mediaOpen, setMediaOpen] = useState(false)
  const [sim, setSim] = useState<{ name: string; messages: Outgoing[] | null } | null>(null)
  const [igId, setIgId] = useState('')
  const [connectMsg, setConnectMsg] = useState<string | null>(null)

  const load = useCallback(async () => {
    const res = await fetch('/api/dashboard/dm', { cache: 'no-store' })
    const json = await res.json()
    if (!res.ok) setError(json.error || 'Σφάλμα')
    else {
      setError(null)
      setData(json)
    }
  }, [])

  useEffect(() => {
    const first = setTimeout(load, 0)
    const t = setInterval(load, 30000)
    return () => { clearTimeout(first); clearInterval(t) }
  }, [load])

  async function openMedia() {
    setMediaOpen(true)
    if (!media) {
      const res = await fetch('/api/dashboard/dm/media')
      const json = await res.json()
      setMedia(json.media || [])
      setMediaError(json.error || null)
    }
  }

  function edit(a: Automation) {
    setFormError(null)
    setForm({
      ...a,
      keywords: a.keywords.join(', '),
      public_replies: a.public_replies.join('\n'),
      button_label: a.button_label || '',
      link_url: a.link_url || '',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function save() {
    if (!form) return
    setSaving(true)
    setFormError(null)
    const { id, ...rest } = form
    const payload = { ...rest, keywords: form.keywords.split(/[,\n]/), public_replies: form.public_replies.split('\n') }
    const res = await fetch(id ? `/api/dashboard/dm/${id}` : '/api/dashboard/dm', {
      method: id ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json = await res.json()
    setSaving(false)
    if (!res.ok) return setFormError(json.error || 'Σφάλμα')
    setForm(null)
    load()
  }

  async function patch(a: Automation, body: Partial<Automation>) {
    await fetch(`/api/dashboard/dm/${a.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    load()
  }

  async function remove(a: Automation) {
    if (!confirm(`Διαγραφή του «${a.name}»; Χάνονται και οι επαφές του.`)) return
    await fetch(`/api/dashboard/dm/${a.id}`, { method: 'DELETE' })
    load()
  }

  async function test(a: Automation) {
    setSim({ name: a.name, messages: null })
    const res = await fetch('/api/dashboard/dm/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: a.id }),
    })
    const json = await res.json()
    setSim({ name: a.name, messages: json.messages || [] })
  }

  async function setDryRun(on: boolean) {
    await fetch('/api/dashboard/dm/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dry_run: on }),
    })
    load()
  }

  async function saveIgId() {
    const res = await fetch('/api/dashboard/dm/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ig_user_id: igId }),
    })
    const json = await res.json()
    setConnectMsg(res.ok ? 'Αποθηκεύτηκε.' : json.error || 'Σφάλμα')
    load()
  }

  async function subscribe() {
    setConnectMsg('Σύνδεση…')
    const res = await fetch('/api/dashboard/dm/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'subscribe' }),
    })
    const json = await res.json()
    setConnectMsg(res.ok ? 'Τα webhooks συνδέθηκαν.' : `Αποτυχία: ${json.text || ''}`)
  }

  const funnelFor = (id: string) => data?.funnel.find(s => s.automation_id === id)
  const nameFor = (id: string) => data?.automations.find(a => a.id === id)?.name || ''
  const set = <K extends keyof Form>(k: K, v: Form[K]) => form && setForm({ ...form, [k]: v })

  return (
    <main className="min-h-screen bg-[#FAFAF8] text-[#171717]">
      <div className="max-w-6xl mx-auto px-5 py-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <Link href="/dashboard" className="text-xs text-gray-400 hover:text-black transition-colors">← Dashboard</Link>
            <h1 className="text-2xl font-semibold tracking-tight mt-1">Within DM</h1>
            <p className="text-sm text-gray-500 mt-1">Σχόλιο σε reel → DM → link.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {data && (
              <span className="text-xs px-3 py-1.5 rounded-full border border-gray-200 bg-white" title={data.account.ok ? '' : data.account.error}>
                {data.account.ok ? <><span className="text-green-600">●</span> @{data.account.username}</> : <><span className="text-red-500">●</span> Instagram μη συνδεδεμένο</>}
              </span>
            )}
            {data && (
              <button
                onClick={() => data.tokenSet && setDryRun(!data.dryRun)}
                disabled={!data.tokenSet}
                className={`text-xs px-3 py-1.5 rounded-full border ${data.dryRun ? 'border-amber-300 bg-amber-50 text-amber-800' : 'border-green-300 bg-green-50 text-green-800'}`}
                title={data.tokenSet ? 'Πάτα για αλλαγή' : 'Μένει σε dry-run μέχρι να μπει το token'}
              >
                {data.dryRun ? 'Dry-run: δεν στέλνεται τίποτα' : 'Live: στέλνει κανονικά'}
              </button>
            )}
            {!form && (
              <button onClick={() => { setFormError(null); setForm({ ...EMPTY }) }}
                className="text-sm bg-black text-white px-4 py-2 rounded-full hover:bg-neutral-800 transition-colors">
                + Νέος αυτοματισμός
              </button>
            )}
          </div>
        </div>

        {error && <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-700 text-sm">{error}</div>}

        {/* Σύνδεση: ID λογαριασμού + webhooks */}
        {data && data.tokenSet && !form && (
          <details className="mb-6 bg-white rounded-2xl border border-gray-200 px-5 py-3 text-sm" open={!data.account.ok}>
            <summary className="cursor-pointer text-gray-600">Σύνδεση Instagram</summary>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <input className={`${inp} max-w-xs`} placeholder="Instagram account ID (αριθμός)" value={igId} onChange={e => setIgId(e.target.value)} />
              <button onClick={saveIgId} className="text-xs border border-gray-300 rounded-full px-3 py-1.5 hover:border-black">Αποθήκευση ID</button>
              <button onClick={subscribe} className="text-xs bg-black text-white rounded-full px-3 py-1.5">Σύνδεση webhooks</button>
              {connectMsg && <span className="text-xs text-gray-500">{connectMsg}</span>}
            </div>
            {!data.account.ok && <p className="mt-2 text-xs text-red-600">{data.account.error}</p>}
          </details>
        )}

        {/* Form */}
        {form && (
          <section className="mb-10 bg-white rounded-2xl border border-gray-200 p-6 grid lg:grid-cols-[1fr_340px] gap-8">
            <div className="space-y-6">
              <h2 className="font-semibold">{form.id ? 'Επεξεργασία' : 'Νέος αυτοματισμός'}</h2>

              <Group title="1. Πότε">
                <Field label="Όνομα" hint="Για σένα. Μπαίνει και ως utm_campaign.">
                  <input className={inp} value={form.name} placeholder="π.χ. Reel 30 Μέρες" onChange={e => set('name', e.target.value)} />
                </Field>
                <Field label="Λέξη-κλειδί" hint="Χωρίζεις με κόμμα. Δεν μετράνε τόνοι και κεφαλαία.">
                  <input className={inp} value={form.keywords} placeholder="30, ΘΕΛΩ" onChange={e => set('keywords', e.target.value)} />
                </Field>
                <Field label="Σε ποιο reel">
                  <div className="flex items-center gap-3">
                    {form.media_thumb && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={form.media_thumb} alt="" className="w-12 h-12 rounded-lg object-cover" />
                    )}
                    <span className="text-sm text-gray-600 line-clamp-2 flex-1">
                      {form.media_id ? form.media_caption || 'Επιλεγμένο reel' : 'Οποιοδήποτε post ή reel'}
                    </span>
                    <button onClick={openMedia} className="text-xs border border-gray-300 rounded-full px-3 py-1.5 hover:border-black">Διάλεξε</button>
                  </div>
                </Field>
                <Toggle on={form.trigger_dm} set={v => set('trigger_dm', v)} label="Και όταν μου στέλνουν τη λέξη σε DM" />
              </Group>

              <Group title="2. Απάντηση στο σχόλιο">
                <Field label="Δημόσιες απαντήσεις" hint="Μία ανά γραμμή, εναλλάσσονται τυχαία. Άδειο = καμία.">
                  <textarea className={`${inp} h-20`} value={form.public_replies} onChange={e => set('public_replies', e.target.value)} />
                </Field>
              </Group>

              <Group title="3. Πρώτο DM">
                <Field label="Μήνυμα">
                  <textarea className={`${inp} h-20`} maxLength={640} value={form.dm_text} onChange={e => set('dm_text', e.target.value)} />
                </Field>
                <Toggle on={form.use_tap} set={v => set('use_tap', v)} label="Κουμπί «Στείλε μου το link» πριν το link"
                  hint="Προτείνεται. Ανοίγει συνομιλία, άρα επιτρέπει έλεγχο follow και follow-up." />
                {form.use_tap && (
                  <Field label="Κείμενο κουμπιού">
                    <input className={inp} maxLength={20} value={form.tap_label} onChange={e => set('tap_label', e.target.value)} />
                  </Field>
                )}
              </Group>

              <Group title="4. Follow πρώτα" muted={!form.use_tap}>
                {!form.use_tap ? (
                  <p className="text-xs text-gray-400">Θέλει ενεργό το κουμπί «Στείλε μου το link».</p>
                ) : (
                  <>
                    <Toggle on={form.follow_gate} set={v => set('follow_gate', v)} label="Ζήτα follow πριν το link"
                      hint="Αν δεν σε ακολουθεί, του ζητάει follow. Μετά από 2 φορές του το στέλνει έτσι κι αλλιώς." />
                    {form.follow_gate && (
                      <>
                        <Field label="Μήνυμα">
                          <textarea className={`${inp} h-16`} maxLength={640} value={form.follow_text} onChange={e => set('follow_text', e.target.value)} />
                        </Field>
                        <Field label="Κουμπί">
                          <input className={inp} maxLength={20} value={form.follow_label} onChange={e => set('follow_label', e.target.value)} />
                        </Field>
                      </>
                    )}
                  </>
                )}
              </Group>

              <Group title="5. Link">
                {form.use_tap && (
                  <Field label="Μήνυμα με το link">
                    <input className={inp} value={form.link_text} onChange={e => set('link_text', e.target.value)} />
                  </Field>
                )}
                <div className="grid grid-cols-[1fr_2fr] gap-3">
                  <Field label="Κουμπί">
                    <input className={inp} maxLength={20} value={form.button_label} onChange={e => set('button_label', e.target.value)} />
                  </Field>
                  <Field label="Link">
                    <input className={inp} value={form.link_url} placeholder="https://..." onChange={e => set('link_url', e.target.value)} />
                  </Field>
                </div>
              </Group>

              <Group title="6. Follow-up" muted={!form.use_tap}>
                {!form.use_tap ? (
                  <p className="text-xs text-gray-400">Το Instagram επιτρέπει follow-up μόνο σε όσους πάτησαν κουμπί.</p>
                ) : (
                  <>
                    <Toggle on={form.followup_enabled} set={v => set('followup_enabled', v)} label="Ένα υπενθυμιστικό αν δεν πατήσει το link" />
                    {form.followup_enabled && (
                      <div className="grid grid-cols-[120px_1fr] gap-3">
                        <Field label="Μετά από (λεπτά)">
                          <input type="number" min={5} max={1380} className={inp} value={form.followup_minutes}
                            onChange={e => set('followup_minutes', Number(e.target.value))} />
                        </Field>
                        <Field label="Μήνυμα">
                          <input className={inp} value={form.followup_text} onChange={e => set('followup_text', e.target.value)} />
                        </Field>
                      </div>
                    )}
                  </>
                )}
              </Group>

              {formError && <p className="text-sm text-red-600">{formError}</p>}

              <div className="flex gap-3 pt-2">
                <button onClick={save} disabled={saving} className="bg-black text-white text-sm px-5 py-2 rounded-full hover:bg-neutral-800 disabled:opacity-50">
                  {saving ? 'Αποθήκευση…' : form.id ? 'Αποθήκευση' : 'Δημιουργία'}
                </button>
                <button onClick={() => setForm(null)} className="text-sm text-gray-500 px-3 hover:text-black">Άκυρο</button>
              </div>
            </div>

            {/* Phone preview */}
            <div className="lg:sticky lg:top-6 self-start">
              <p className="text-xs uppercase tracking-widest text-gray-400 mb-3">Έτσι θα το δει</p>
              <Phone messages={previewFromForm(form)} />
            </div>
          </section>
        )}

        {/* Tabs */}
        {!form && (
          <div className="flex gap-6 border-b border-gray-200 mb-6 text-sm">
            {(['automations', 'contacts'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`pb-2 -mb-px border-b-2 ${tab === t ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-black'}`}>
                {t === 'automations' ? 'Αυτοματισμοί' : `Επαφές${data ? ` (${data.contacts.length})` : ''}`}
              </button>
            ))}
          </div>
        )}

        {/* Automations */}
        {!form && tab === 'automations' && (
          <>
            {data && data.automations.length === 0 && (
              <div className="text-center py-16 text-gray-500 text-sm">Δεν υπάρχει ακόμα αυτοματισμός. Πάτα «+ Νέος αυτοματισμός».</div>
            )}
            <div className="space-y-3">
              {data?.automations.map(a => {
                const f = funnelFor(a.id)
                const steps = [
                  { label: 'Σχόλια', v: Number(f?.commented || 0) },
                  { label: 'DM', v: Number(f?.dm_sent || 0) },
                  ...(a.use_tap ? [{ label: 'Πάτησαν', v: Number(f?.tapped || 0) }] : []),
                  { label: 'Πήραν link', v: Number(f?.link_sent || 0) },
                  { label: 'Κλικ', v: Number(f?.clicked || 0) },
                ]
                const top = steps[0].v || 1
                return (
                  <div key={a.id} className={`bg-white rounded-2xl border p-5 ${a.active ? 'border-gray-200' : 'border-gray-100 opacity-60'}`}>
                    <div className="flex flex-wrap items-center gap-4">
                      {a.media_thumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={a.media_thumb} alt="" className="w-14 h-14 rounded-lg object-cover" />
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center text-[10px] text-gray-400 text-center leading-tight">Όλα τα<br />posts</div>
                      )}
                      <div className="flex-1 min-w-[200px]">
                        <p className="font-medium">{a.name}</p>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {a.keywords.map(k => <span key={k} className="text-[11px] px-2 py-0.5 rounded-full bg-black text-white">{k}</span>)}
                          {a.follow_gate && <Tag>follow πρώτα</Tag>}
                          {a.use_tap && a.followup_enabled && <Tag>follow-up {a.followup_minutes}′</Tag>}
                          {a.trigger_dm && <Tag>+ DM</Tag>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button onClick={() => test(a)} className="text-xs border border-gray-300 rounded-full px-3 py-1.5 hover:border-black">Δοκιμή</button>
                        <button onClick={() => patch(a, { active: !a.active })} title={a.active ? 'Ενεργό' : 'Ανενεργό'}
                          className={`w-10 h-6 rounded-full relative transition-colors ${a.active ? 'bg-black' : 'bg-gray-300'}`}>
                          <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${a.active ? 'left-5' : 'left-1'}`} />
                        </button>
                        <button onClick={() => edit(a)} className="text-xs text-gray-500 hover:text-black">Επεξεργασία</button>
                        <button onClick={() => remove(a)} className="text-xs text-gray-300 hover:text-red-600">Διαγραφή</button>
                      </div>
                    </div>
                    {/* Funnel */}
                    <div className="mt-4 grid gap-2" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
                      {steps.map((s, i) => (
                        <div key={s.label}>
                          <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${Math.round((s.v / top) * 100)}%`, backgroundColor: i === steps.length - 1 ? GOLD : '#171717' }} />
                          </div>
                          <p className="mt-1.5 text-lg font-semibold tabular-nums">{s.v}</p>
                          <p className="text-[10px] uppercase tracking-wider text-gray-400">
                            {s.label}{i > 0 && steps[i - 1].v > 0 ? ` · ${Math.round((s.v / steps[i - 1].v) * 100)}%` : ''}
                          </p>
                        </div>
                      ))}
                    </div>
                    {Number(f?.failed || 0) > 0 && <p className="mt-2 text-xs text-red-600">{f?.failed} αποτυχίες. Δες τις Επαφές.</p>}
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Contacts */}
        {!form && tab === 'contacts' && data && (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-x-auto">
            {data.contacts.length === 0 ? (
              <p className="p-8 text-center text-sm text-gray-400">Καμία επαφή ακόμα.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="text-[10px] uppercase tracking-wider text-gray-400 text-left">
                  <tr className="border-b border-gray-100">
                    <th className="px-4 py-3 font-normal">Ποιος</th>
                    <th className="px-4 py-3 font-normal">Αυτοματισμός</th>
                    <th className="px-4 py-3 font-normal">Έγραψε</th>
                    <th className="px-4 py-3 font-normal">Στάδιο</th>
                    <th className="px-4 py-3 font-normal">Follow</th>
                    <th className="px-4 py-3 font-normal">Πότε</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.contacts.map(c => (
                    <tr key={c.id}>
                      <td className="px-4 py-2.5 font-medium">
                        {c.username ? <a href={`https://instagram.com/${c.username}`} target="_blank" rel="noreferrer" className="hover:underline">@{c.username}</a> : <span className="text-gray-400">DM</span>}
                      </td>
                      <td className="px-4 py-2.5 text-gray-500">{nameFor(c.automation_id)}</td>
                      <td className="px-4 py-2.5 text-gray-500 max-w-[200px] truncate">{c.comment_text}</td>
                      <td className="px-4 py-2.5">
                        <span className={c.stage === 'clicked' ? 'font-medium' : c.stage === 'failed' ? 'text-red-600' : 'text-gray-600'}
                          style={c.stage === 'clicked' ? { color: GOLD } : undefined} title={c.last_error || ''}>
                          {STAGE[c.stage] || c.stage}
                        </span>
                        {c.followup_sent_at && <span className="text-[10px] text-gray-400 ml-1">· follow-up</span>}
                      </td>
                      <td className="px-4 py-2.5 text-gray-500">{c.follows === true ? 'Ναι' : c.follows === false ? 'Όχι' : '—'}</td>
                      <td className="px-4 py-2.5 text-gray-400">{timeAgo(c.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Media picker */}
        {mediaOpen && form && (
          <Modal onClose={() => setMediaOpen(false)} title="Διάλεξε reel">
            <button onClick={() => { setForm({ ...form, media_id: null, media_caption: null, media_thumb: null }); setMediaOpen(false) }}
              className="w-full text-left text-sm border border-gray-200 rounded-xl p-3 mb-4 hover:border-black">
              Οποιοδήποτε post ή reel
            </button>
            {!media && <p className="text-sm text-gray-400">Φόρτωση…</p>}
            {media && media.length === 0 && (
              <p className="text-sm text-gray-400">{mediaError ? 'Τα reels εμφανίζονται όταν μπει το token.' : 'Δεν βρέθηκαν posts.'}</p>
            )}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {media?.map(m => (
                <button key={m.id}
                  onClick={() => { setForm({ ...form, media_id: m.id, media_caption: m.caption, media_thumb: m.thumb }); setMediaOpen(false) }}
                  className={`text-left rounded-xl overflow-hidden border-2 ${form.media_id === m.id ? 'border-black' : 'border-transparent'} hover:border-gray-400`}>
                  {m.thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.thumb} alt="" className="w-full aspect-[4/5] object-cover bg-gray-100" />
                  ) : <div className="w-full aspect-[4/5] bg-gray-100" />}
                  <div className="p-2">
                    <span className="text-[10px] uppercase tracking-wider text-gray-400">{m.type} · {new Date(m.timestamp).toLocaleDateString('el-GR')}</span>
                    <p className="text-xs text-gray-700 line-clamp-2">{m.caption || '—'}</p>
                  </div>
                </button>
              ))}
            </div>
          </Modal>
        )}

        {/* Simulation */}
        {sim && (
          <Modal onClose={() => setSim(null)} title={`Δοκιμή · ${sim.name}`}>
            <p className="text-xs text-gray-500 mb-4">Ψεύτικος χρήστης που δεν σε ακολουθεί σχολιάζει, πατάει τα κουμπιά και δεν ανοίγει το link. Δεν στάλθηκε τίποτα.</p>
            {!sim.messages ? <p className="text-sm text-gray-400">Τρέχει…</p> : (
              <div className="max-w-sm mx-auto"><Phone messages={sim.messages} /></div>
            )}
          </Modal>
        )}
      </div>
    </main>
  )
}

// ---------- preview ----------

function previewFromForm(f: Form): Outgoing[] {
  const out: Outgoing[] = []
  const reply = f.public_replies.split('\n').find(Boolean)
  if (reply) out.push({ kind: 'public_reply', to: '', text: reply })
  const link = f.link_url ? [{ title: f.button_label || 'Δες εδώ', url: f.link_url }] : []
  if (f.use_tap && f.link_url) {
    out.push({ kind: 'dm', to: '', text: f.dm_text, buttons: [{ title: f.tap_label, payload: 'LINK' }] })
    if (f.follow_gate) out.push({ kind: 'dm', to: '', text: f.follow_text, buttons: [{ title: f.follow_label, payload: 'FOLLOW' }] })
    out.push({ kind: 'dm', to: '', text: f.link_text, buttons: link })
    if (f.followup_enabled) out.push({ kind: 'dm', to: '', text: f.followup_text, buttons: link })
  } else {
    out.push({ kind: 'dm', to: '', text: f.dm_text, buttons: link })
  }
  return out
}

function Phone({ messages }: { messages: Outgoing[] }) {
  const comment = messages.filter(m => m.kind === 'public_reply')
  const dms = messages.filter(m => m.kind === 'dm')
  return (
    <div className="mx-auto w-[300px] rounded-[40px] border-[10px] border-black bg-white shadow-xl overflow-hidden">
      <div className="h-6 flex justify-center"><div className="w-20 h-4 bg-black rounded-b-xl" /></div>
      <div className="px-4 pb-2 border-b border-gray-100 flex items-center gap-2">
        <div className="w-7 h-7 rounded-full" style={{ background: `linear-gradient(135deg, ${GOLD}, #171717)` }} />
        <span className="text-sm font-semibold">withinsuccess</span>
      </div>
      <div className="h-[460px] overflow-y-auto p-3 space-y-2 bg-white">
        {comment.length > 0 && (
          <div className="rounded-xl bg-gray-50 p-2.5 text-[12px] mb-3">
            <p className="text-gray-400 mb-1">Στο σχόλιο:</p>
            {comment.map((c, i) => <p key={i}><span className="font-semibold">withinsuccess</span> {c.text}</p>)}
          </div>
        )}
        {dms.map((m, i) => (
          <div key={i} className="max-w-[85%] rounded-2xl rounded-bl-md bg-[#EFEFEF] text-[13px] overflow-hidden">
            <p className="px-3 py-2 whitespace-pre-wrap">{m.text || '…'}</p>
            {m.buttons?.map((b, j) => (
              <div key={j} className="border-t border-white px-3 py-2 text-center font-semibold" style={{ color: IG_BLUE }}>{b.title}</div>
            ))}
          </div>
        ))}
        {dms.length > 1 && <p className="text-[10px] text-center text-gray-300 pt-1">Τα επόμενα έρχονται όταν πατάει τα κουμπιά</p>}
      </div>
    </div>
  )
}

// ---------- ui bits ----------

const inp = 'w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-black'

function Group({ title, muted, children }: { title: string; muted?: boolean; children: React.ReactNode }) {
  return (
    <div className={`space-y-3 pt-4 border-t border-gray-100 ${muted ? 'opacity-60' : ''}`}>
      <p className="text-xs uppercase tracking-widest text-gray-400">{title}</p>
      {children}
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium mb-1">{label}</span>
      {children}
      {hint && <span className="block text-xs text-gray-400 mt-1">{hint}</span>}
    </label>
  )
}

function Toggle({ on, set, label, hint }: { on: boolean; set: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <button type="button" onClick={() => set(!on)} className="flex items-start gap-3 text-left w-full">
      <span className={`mt-0.5 w-9 h-5 rounded-full relative shrink-0 transition-colors ${on ? 'bg-black' : 'bg-gray-300'}`}>
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${on ? 'left-[18px]' : 'left-0.5'}`} />
      </span>
      <span>
        <span className="block text-sm">{label}</span>
        {hint && <span className="block text-xs text-gray-400 mt-0.5">{hint}</span>}
      </span>
    </button>
  )
}

function Tag({ children }: { children: React.ReactNode }) {
  return <span className="text-[11px] px-2 py-0.5 rounded-full border border-gray-200 text-gray-500">{children}</span>
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-auto p-5" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-black">✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}
