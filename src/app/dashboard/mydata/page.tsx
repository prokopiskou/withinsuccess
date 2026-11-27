'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

const GOLD = '#C9A96E'

type Doc = {
  id: string
  doc_type: string
  series: string
  aa: number
  issue_date: string
  amount: number
  payment_type: number
  description: string | null
  product: string | null
  quantity: number
  unit_price: number | null
  customer_name: string | null
  customer_email: string | null
  source: string
  vat_rate?: number
  mark: string | null
  qr_url: string | null
  correlated_mark: string | null
  status: string
  error: string | null
  created_at: string
}
type Config = { env: string; configured: boolean; live: boolean; canIssue: boolean; vat: string; series: string; creditSeries: string; vatExemption: string }
type Product = { id: string; name: string; price: number; active: boolean }

const PAY: Record<number, string> = { 7: 'Κάρτα', 8: 'IRIS', 6: 'Web banking', 3: 'Μετρητά', 1: 'Τράπεζα' }
const STATUS: Record<string, string> = { sent: 'Διαβιβάστηκε', failed: 'Απέτυχε', pending: 'Σε αναμονή', cancelled: 'Ακυρώθηκε' }
const TABS = [
  ['home', 'Αρχή'],
  ['new', '+ Νέα απόδειξη'],
  ['docs', 'Παραστατικά'],
  ['customers', 'Πελάτες'],
  ['products', 'Προϊόντα'],
  ['reports', 'Αναφορές'],
] as const
type Tab = (typeof TABS)[number][0]

const eur = (n: number) => `${n.toLocaleString('el-GR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Athens' }).format(new Date())
const signed = (d: Doc) => (d.doc_type === '11.4' ? -1 : 1) * Number(d.amount)
const counts = (d: Doc) => d.status === 'sent'

export default function TameioPage() {
  const [tab, setTab] = useState<Tab>('home')
  const [config, setConfig] = useState<Config | null>(null)
  const [docs, setDocs] = useState<Doc[]>([])
  const [dbError, setDbError] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const [r1, r2] = await Promise.all([fetch('/api/dashboard/mydata', { cache: 'no-store' }), fetch('/api/dashboard/mydata/products', { cache: 'no-store' })])
    const j1 = await r1.json()
    const j2 = await r2.json()
    setConfig(j1.config)
    setDocs(j1.docs || [])
    setDbError(j1.dbError)
    setProducts((j2.products || []).filter((p: Product) => p.active))
  }, [])
  useEffect(() => {
    const t = setTimeout(load, 0)
    return () => clearTimeout(t)
  }, [load])

  async function act(body: Record<string, unknown>) {
    setBusy(true)
    setMsg(null)
    const r = await fetch('/api/dashboard/mydata', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const j = await r.json()
    setBusy(false)
    if (!r.ok) setMsg(j.error || 'Σφάλμα')
    else if (j.doc) setMsg(j.doc.status === 'sent' ? `✓ ${j.doc.doc_type === '11.4' ? 'Πιστωτικό' : 'ΑΠΥ'} ${j.doc.series} ${j.doc.aa} · MARK ${j.doc.mark}` : `Απέτυχε: ${j.doc.error}`)
    else if (j.result) setMsg(j.result.ok ? 'Ακυρώθηκε' : `Απέτυχε: ${j.result.errors?.join(' | ')}`)
    load()
    return j
  }

  return (
    <main className="min-h-screen bg-[#FAFAF8] text-[#171717]">
      <div className="max-w-6xl mx-auto px-5 py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <Link href="/dashboard" className="text-xs text-gray-400 hover:text-black">← Dashboard</Link>
            <h1 className="text-2xl font-semibold mt-1">Ταμείο · myDATA</h1>
          </div>
          {config && (
            <div className="flex flex-wrap gap-2 text-xs">
              <span className={`px-3 py-1.5 rounded-full border ${config.env === 'dev' ? 'border-amber-300 bg-amber-50 text-amber-800' : 'border-green-300 bg-green-50 text-green-800'}`}>
                {config.env === 'dev' ? 'ΔΟΚΙΜΑΣΤΙΚΟ · τίποτα δεν πάει στην εφορία' : config.live ? 'ΠΑΡΑΓΩΓΗ · ενεργό' : 'ΠΑΡΑΓΩΓΗ · έκδοση κλειστή'}
              </span>
              <span className={`px-3 py-1.5 rounded-full border ${config.configured ? 'border-gray-200 bg-white' : 'border-red-300 bg-red-50 text-red-700'}`}>
                {config.configured ? `ΑΦΜ ${config.vat}` : 'Λείπουν κλειδιά myDATA'}
              </span>
            </div>
          )}
        </div>
        {dbError && <p className="mt-3 text-sm text-red-600">Βάση: {dbError}</p>}

        <nav className="mt-6 flex flex-wrap gap-1 border-b border-gray-200">
          {TABS.map(([k, label]) => (
            <button key={k} onClick={() => { setTab(k); setMsg(null) }}
              className={`px-4 py-2 text-sm -mb-px border-b-2 ${tab === k ? 'border-black font-medium' : 'border-transparent text-gray-500 hover:text-black'}`}>
              {label}
            </button>
          ))}
        </nav>

        {msg && <div className="mt-4 p-3 rounded-xl bg-white border border-gray-200 text-sm">{msg}</div>}

        <div className="mt-6">
          {tab === 'home' && <Home docs={docs} onNew={() => setTab('new')} />}
          {tab === 'new' && <NewReceipt products={products} canIssue={!!config?.canIssue && !!config?.configured} busy={busy} onIssue={act} />}
          {tab === 'docs' && <Docs docs={docs} canIssue={!!config?.canIssue} onAct={act} />}
          {tab === 'customers' && <Customers docs={docs} />}
          {tab === 'products' && <Products products={products} reload={load} />}
          {tab === 'reports' && <Reports docs={docs} />}
        </div>
      </div>
    </main>
  )
}

// ---------- Αρχή ----------
function Home({ docs, onNew }: { docs: Doc[]; onNew: () => void }) {
  const t = today()
  const month = t.slice(0, 7)
  const year = t.slice(0, 4)
  const ok = docs.filter(counts)
  const sum = (f: (d: Doc) => boolean) => ok.filter(f).reduce((s, d) => s + signed(d), 0)
  const failed = docs.filter(d => d.status === 'failed').length
  const monthTotals: Record<string, number> = {}
  for (let i = 1; i <= 12; i++) monthTotals[`${year}-${String(i).padStart(2, '0')}`] = 0
  ok.forEach(d => { const k = d.issue_date.slice(0, 7); if (k in monthTotals) monthTotals[k] += signed(d) })
  const byMonth = Object.entries(monthTotals)
  const max = Math.max(1, ...byMonth.map(([, v]) => v))
  const MONTHS = ['ΙΑΝ', 'ΦΕΒ', 'ΜΑΡ', 'ΑΠΡ', 'ΜΑΪ', 'ΙΟΥΝ', 'ΙΟΥΛ', 'ΑΥΓ', 'ΣΕΠ', 'ΟΚΤ', 'ΝΟΕ', 'ΔΕΚ']
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Σήμερα" v={eur(sum(d => d.issue_date === t))} />
        <Kpi label="Αυτόν τον μήνα" v={eur(sum(d => d.issue_date.startsWith(month)))} />
        <Kpi label={`Έτος ${year}`} v={eur(sum(d => d.issue_date.startsWith(year)))} />
        <Kpi label="Αποτυχίες διαβίβασης" v={String(failed)} red={failed > 0} />
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <p className="text-xs uppercase tracking-widest text-gray-400 mb-4">Εισπράξεις {year}</p>
        <div className="flex items-end gap-2 h-40">
          {byMonth.map(([k, v], i) => (
            <div key={k} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full rounded-t" style={{ height: `${(v / max) * 100}%`, minHeight: v ? 4 : 1, backgroundColor: v ? GOLD : '#eee' }} title={eur(v)} />
              <span className="text-[10px] text-gray-400">{MONTHS[i]}</span>
            </div>
          ))}
        </div>
      </div>
      <button onClick={onNew} className="bg-black text-white text-sm px-5 py-2.5 rounded-full">+ Νέα απόδειξη</button>
    </div>
  )
}

function Kpi({ label, v, red }: { label: string; v: string; red?: boolean }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4">
      <p className="text-[10px] uppercase tracking-widest text-gray-400">{label}</p>
      <p className={`text-xl font-semibold mt-1 tabular-nums ${red ? 'text-red-600' : ''}`}>{v}</p>
    </div>
  )
}

// ---------- Νέα απόδειξη (online ταμειακή) ----------
function NewReceipt({ products, canIssue, busy, onIssue }: { products: Product[]; canIssue: boolean; busy: boolean; onIssue: (b: Record<string, unknown>) => Promise<{ doc?: Doc }> }) {
  const [product, setProduct] = useState('')
  const [price, setPrice] = useState('')
  const [qty, setQty] = useState('1')
  const [pay, setPay] = useState('7')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [vatRate, setVatRate] = useState<0 | 24>(0)
  const [last, setLast] = useState<Doc | null>(null)
  const total = Math.round((Number(price) || 0) * (Number(qty) || 0) * 100) / 100
  const net = vatRate ? Math.round((total / 1.24) * 100) / 100 : total
  const vatAmt = Math.round((total - net) * 100) / 100

  async function submit() {
    if (vatRate === 24 && !confirm(`Κανονική απόδειξη με ΦΠΑ 24%.\nΚαθαρό ${eur(net)} + ΦΠΑ ${eur(vatAmt)} = ${eur(total)}\n\nΣυνέχεια;`)) return
    const j = await onIssue({ action: 'issue', product, unitPrice: price, quantity: qty, paymentType: pay, customerName: name, customerEmail: email, vatRate })
    if (j.doc) setLast(j.doc)
    if (j.doc?.status === 'sent') { setName(''); setEmail('') }
  }

  return (
    <div className="grid md:grid-cols-[1fr_320px] gap-6">
      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
        <p className="font-medium">Απόδειξη Παροχής Υπηρεσιών (11.2)</p>
        <div className="flex flex-wrap gap-2">
          {products.map(p => (
            <button key={p.id} onClick={() => { setProduct(p.name); setPrice(String(p.price)) }}
              className={`text-xs px-3 py-1.5 rounded-full border ${product === p.name ? 'border-black bg-black text-white' : 'border-gray-200 hover:border-black'}`}>
              {p.name} · {eur(Number(p.price))}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-[1fr_120px_90px] gap-3">
          <F label="Περιγραφή"><input className={inp} value={product} onChange={e => setProduct(e.target.value)} placeholder="π.χ. 30 Μέρες Μεταμόρφωσης" /></F>
          <F label="Τιμή €"><input className={inp} value={price} onChange={e => setPrice(e.target.value)} inputMode="decimal" /></F>
          <F label="Ποσότητα"><input className={inp} value={qty} onChange={e => setQty(e.target.value)} inputMode="numeric" /></F>
        </div>
        <F label="Τύπος απόδειξης">
          <div className="flex flex-wrap gap-2">
            {([[0, 'Απαλλαγή ΦΠΑ · άρθρο 22'], [24, 'Κανονική · ΦΠΑ 24%']] as const).map(([k, v]) => (
              <button key={k} onClick={() => setVatRate(k)} className={`text-xs px-3 py-1.5 rounded-full border ${vatRate === k ? 'border-black bg-black text-white' : 'border-gray-200'}`}>{v}</button>
            ))}
          </div>
        </F>
        <F label="Τρόπος πληρωμής">
          <div className="flex flex-wrap gap-2">
            {Object.entries(PAY).map(([k, v]) => (
              <button key={k} onClick={() => setPay(k)} className={`text-xs px-3 py-1.5 rounded-full border ${pay === k ? 'border-black bg-black text-white' : 'border-gray-200'}`}>{v}</button>
            ))}
          </div>
        </F>
        <div className="grid grid-cols-2 gap-3">
          <F label="Πελάτης (προαιρετικό)"><input className={inp} value={name} onChange={e => setName(e.target.value)} /></F>
          <F label="Email (προαιρετικό)"><input className={inp} value={email} onChange={e => setEmail(e.target.value)} /></F>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div>
            <p className="text-lg font-semibold">Σύνολο {eur(total)}</p>
            {vatRate === 24 && <p className="text-xs text-gray-500">Καθαρό {eur(net)} · ΦΠΑ 24% {eur(vatAmt)}</p>}
          </div>
          <button disabled={!canIssue || busy || !product || !(total > 0)} onClick={submit}
            className="bg-black text-white text-sm px-6 py-2.5 rounded-full disabled:opacity-40">
            {busy ? 'Έκδοση…' : 'Έκδοση & διαβίβαση'}
          </button>
        </div>
        {!canIssue && <p className="text-xs text-red-600">Η έκδοση είναι κλειστή (λείπουν κλειδιά ή παραγωγή χωρίς MYDATA_LIVE=1).</p>}
        <p className="text-xs text-gray-400">{vatRate === 24 ? 'Η τιμή που γράφεις είναι τελική (με ΦΠΑ). Το καθαρό και ο ΦΠΑ βγαίνουν αυτόματα.' : 'ΦΠΑ 0% · απαλλαγή άρθρο 22 (εκπαιδευτικές υπηρεσίες)'}</p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">Τελευταία έκδοση</p>
        {last ? <ReceiptCard d={last} /> : <div className="text-sm text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200 p-6 text-center">Εδώ θα δεις την απόδειξη.</div>}
      </div>
    </div>
  )
}

function ReceiptCard({ d }: { d: Doc }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 text-sm space-y-1">
      <p className="font-semibold">{d.doc_type === '11.4' ? 'Πιστωτικό στοιχείο λιανικής' : 'Απόδειξη Παροχής Υπηρεσιών'}</p>
      <p className="text-gray-500">{d.series} {d.aa} · {d.issue_date}</p>
      <p>{d.product || d.description} × {d.quantity}</p>
      <p className="text-lg font-semibold">{eur(Number(d.amount))}{Number(d.vat_rate) === 24 && <span className="text-xs font-normal text-gray-500"> · με ΦΠΑ 24%</span>}</p>
      <p className={d.status === 'sent' ? 'text-green-700' : 'text-red-600'}>{STATUS[d.status]}{d.mark ? ` · MARK ${d.mark}` : ''}</p>
      {d.error && <p className="text-xs text-red-600 break-words">{d.error}</p>}
      <Link href={`/dashboard/mydata/${d.id}`} target="_blank" className="inline-block mt-2 text-xs underline">Προβολή / εκτύπωση</Link>
    </div>
  )
}

// ---------- Παραστατικά ----------
function Docs({ docs, canIssue, onAct }: { docs: Doc[]; canIssue: boolean; onAct: (b: Record<string, unknown>) => Promise<unknown> }) {
  const [qText, setQ] = useState('')
  const [status, setStatus] = useState('')
  const list = docs.filter(d => (!status || d.status === status) && (!qText || `${d.series} ${d.aa} ${d.customer_name || ''} ${d.customer_email || ''} ${d.product || ''} ${d.mark || ''}`.toLowerCase().includes(qText.toLowerCase())))
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <input className={`${inp} max-w-xs`} placeholder="Αναζήτηση (πελάτης, MARK, αριθμός)" value={qText} onChange={e => setQ(e.target.value)} />
        <select className={`${inp} max-w-[180px]`} value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">Όλες οι καταστάσεις</option>
          {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-[10px] uppercase tracking-wider text-gray-400 text-left">
            <tr className="border-b border-gray-100">
              {['Παραστατικό', 'Ημ/νία', 'Πελάτης', 'Περιγραφή', 'Ποσό', 'Πληρωμή', 'Κατάσταση', 'MARK', ''].map(h => <th key={h} className="px-3 py-3 font-normal">{h}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {list.length === 0 && <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">Κανένα παραστατικό.</td></tr>}
            {list.map(d => (
              <tr key={d.id}>
                <td className="px-3 py-2.5 whitespace-nowrap">
                  <Link href={`/dashboard/mydata/${d.id}`} target="_blank" className="hover:underline">{d.doc_type === '11.4' ? 'ΠΙΣΤ' : 'ΑΠΥ'} {d.series} {d.aa}</Link>
                </td>
                <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap">{d.issue_date}</td>
                <td className="px-3 py-2.5 text-gray-600 max-w-[160px] truncate">{d.customer_name || d.customer_email || '—'}</td>
                <td className="px-3 py-2.5 text-gray-600 max-w-[180px] truncate">{d.product || d.description}</td>
                <td className={`px-3 py-2.5 tabular-nums whitespace-nowrap ${d.doc_type === '11.4' ? 'text-red-600' : ''}`}>{eur(signed(d))}</td>
                <td className="px-3 py-2.5 text-gray-500">{PAY[d.payment_type] || d.payment_type}</td>
                <td className={`px-3 py-2.5 ${d.status === 'failed' ? 'text-red-600' : d.status === 'sent' ? 'text-green-700' : 'text-gray-500'}`} title={d.error || ''}>{STATUS[d.status] || d.status}</td>
                <td className="px-3 py-2.5 font-mono text-xs">{d.mark || '—'}</td>
                <td className="px-3 py-2.5 text-xs whitespace-nowrap">
                  {canIssue && d.status === 'sent' && d.doc_type === '11.2' && (
                    <button onClick={() => confirm('Έκδοση πιστωτικού για όλο το ποσό;') && onAct({ action: 'credit', id: d.id })} className="text-gray-500 hover:text-black mr-3">Πιστωτικό</button>
                  )}
                  {canIssue && d.status === 'sent' && (
                    <button onClick={() => confirm('Ακύρωση στο myDATA; (μόνο για λάθος έκδοση — για επιστροφή χρημάτων κάνε πιστωτικό)') && onAct({ action: 'cancel', id: d.id })} className="text-gray-400 hover:text-red-600 mr-3">Ακύρωση</button>
                  )}
                  {canIssue && d.status === 'failed' && <button onClick={() => onAct({ action: 'retry', id: d.id })} className="text-gray-500 hover:text-black">Ξανά</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ---------- Πελάτες ----------
function Customers({ docs }: { docs: Doc[] }) {
  const rows = useMemo(() => {
    const m = new Map<string, { name: string; email: string; n: number; total: number; last: string }>()
    docs.filter(counts).forEach(d => {
      const key = (d.customer_email || d.customer_name || '').toLowerCase()
      if (!key) return
      const r = m.get(key) || { name: d.customer_name || '', email: d.customer_email || '', n: 0, total: 0, last: d.issue_date }
      r.n += d.doc_type === '11.4' ? 0 : 1
      r.total += signed(d)
      if (d.issue_date > r.last) r.last = d.issue_date
      if (!r.name && d.customer_name) r.name = d.customer_name
      m.set(key, r)
    })
    return [...m.values()].sort((a, b) => b.total - a.total)
  }, [docs])
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-[10px] uppercase tracking-wider text-gray-400 text-left">
          <tr className="border-b border-gray-100">{['Πελάτης', 'Email', 'Αγορές', 'Σύνολο', 'Τελευταία'].map(h => <th key={h} className="px-4 py-3 font-normal">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {rows.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Οι πελάτες εμφανίζονται όταν οι αποδείξεις έχουν όνομα ή email.</td></tr>}
          {rows.map(r => (
            <tr key={r.email + r.name}>
              <td className="px-4 py-2.5">{r.name || '—'}</td>
              <td className="px-4 py-2.5 text-gray-500">{r.email || '—'}</td>
              <td className="px-4 py-2.5">{r.n}</td>
              <td className="px-4 py-2.5 tabular-nums">{eur(r.total)}</td>
              <td className="px-4 py-2.5 text-gray-500">{r.last}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ---------- Προϊόντα ----------
function Products({ products, reload }: { products: Product[]; reload: () => void }) {
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  async function call(body: Record<string, unknown>) {
    await fetch('/api/dashboard/mydata/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    reload()
  }
  return (
    <div className="space-y-4 max-w-2xl">
      <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-50">
        {products.map(p => (
          <div key={p.id} className="flex items-center justify-between px-4 py-3 text-sm">
            <span>{p.name}</span>
            <span className="flex items-center gap-4">
              <span className="tabular-nums">{eur(Number(p.price))}</span>
              <button onClick={() => confirm(`Αφαίρεση «${p.name}»;`) && call({ action: 'delete', id: p.id })} className="text-xs text-gray-400 hover:text-red-600">Αφαίρεση</button>
            </span>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input className={inp} placeholder="Όνομα" value={name} onChange={e => setName(e.target.value)} />
        <input className={`${inp} max-w-[120px]`} placeholder="Τιμή €" value={price} onChange={e => setPrice(e.target.value)} />
        <button onClick={() => { call({ action: 'add', name, price }); setName(''); setPrice('') }} className="bg-black text-white text-sm px-4 rounded-full">Προσθήκη</button>
      </div>
    </div>
  )
}

// ---------- Αναφορές ----------
function Reports({ docs }: { docs: Doc[] }) {
  const t = today()
  const [from, setFrom] = useState(`${t.slice(0, 7)}-01`)
  const [to, setTo] = useState(t)
  const inRange = docs.filter(d => counts(d) && d.issue_date >= from && d.issue_date <= to)
  const byDay = useMemo(() => {
    const m: Record<string, { n: number; total: number; byPay: Record<string, number> }> = {}
    inRange.forEach(d => {
      const r = (m[d.issue_date] ||= { n: 0, total: 0, byPay: {} })
      r.n += 1
      r.total += signed(d)
      const k = PAY[d.payment_type] || String(d.payment_type)
      r.byPay[k] = (r.byPay[k] || 0) + signed(d)
    })
    return Object.entries(m).sort((a, b) => b[0].localeCompare(a[0]))
  }, [inRange])
  const total = inRange.reduce((s, d) => s + signed(d), 0)
  const credits = inRange.filter(d => d.doc_type === '11.4').reduce((s, d) => s + Number(d.amount), 0)
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <F label="Από"><input type="date" className={inp} value={from} onChange={e => setFrom(e.target.value)} /></F>
        <F label="Έως"><input type="date" className={inp} value={to} onChange={e => setTo(e.target.value)} /></F>
        <a href={`/api/dashboard/mydata/export?from=${from}&to=${to}`} className="text-sm border border-gray-300 rounded-full px-4 py-2 hover:border-black">Εξαγωγή CSV για λογιστή</a>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Kpi label="Καθαρά έσοδα" v={eur(total)} />
        <Kpi label="Παραστατικά" v={String(inRange.length)} />
        <Kpi label="Πιστωτικά" v={eur(credits)} />
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-[10px] uppercase tracking-wider text-gray-400 text-left">
            <tr className="border-b border-gray-100">{['Ημέρα (Ζ)', 'Παραστατικά', 'Ανά τρόπο πληρωμής', 'Σύνολο'].map(h => <th key={h} className="px-4 py-3 font-normal">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {byDay.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">Τίποτα στο διάστημα.</td></tr>}
            {byDay.map(([day, r]) => (
              <tr key={day}>
                <td className="px-4 py-2.5">{day}</td>
                <td className="px-4 py-2.5">{r.n}</td>
                <td className="px-4 py-2.5 text-gray-500">{Object.entries(r.byPay).map(([k, v]) => `${k} ${eur(v)}`).join(' · ')}</td>
                <td className="px-4 py-2.5 tabular-nums font-medium">{eur(r.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ---------- ui ----------
const inp = 'w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-black'
function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="block text-xs text-gray-500 mb-1">{label}</span>
      {children}
    </label>
  )
}
