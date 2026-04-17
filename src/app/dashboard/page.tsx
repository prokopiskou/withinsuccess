'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

const DASHBOARD_PASSWORD = 'prokopis2026'

type Conversation = {
  id: string
  subscriber_id: string
  flow: string
  status: string
  lead_score: string
  last_user_message: string
  messages: Array<{ role: string; content: string }>
  received_at: string
  answered_at: string | null
  link_sent_at: string | null
  link_clicked_at: string | null
  checkout_started_at: string | null
  payment_completed_at: string | null
  product_interest: string | null
  source: string | null
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Περιμένει AI',
  answered: 'Απάντησε AI',
  link_sent: 'Στάλθηκε Link',
  page_visited: 'Είδε Σελίδα',
  checkout_started: 'Ξεκίνησε Checkout',
  paid: 'Πλήρωσε',
  human_needed: 'Θέλει Άνθρωπο',
  expired: 'Έληξε',
}

const PRODUCT_LABELS: Record<string, string> = {
  '63': '63 Μέρες',
  'concierge': 'Concierge',
  'coaching': 'Coaching 1-1',
  'ebook': 'Ebook',
  'quiz': 'Quiz',
}

function hoursSince(dateStr: string): number {
  return (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60)
}

function formatTime(h: number): string {
  if (h < 1) return `${Math.round(h * 60)}λ`
  if (h < 24) return `${Math.round(h)}ω`
  return `${Math.round(h / 24)}μ`
}

function DashboardContent() {
  const searchParams = useSearchParams()
  const pw = searchParams.get('pw')
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Conversation | null>(null)
  const [filterFlow, setFilterFlow] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [fromDate, setFromDate] = useState<string>('')
  const [toDate, setToDate] = useState<string>('')

  useEffect(() => {
    if (pw !== DASHBOARD_PASSWORD) return
    async function load() {
      const params = new URLSearchParams()
      if (fromDate) params.set('from', fromDate)
      if (toDate) params.set('to', toDate)
      const res = await fetch(`/api/manychat/dashboard-full?${params}`, {
        headers: { 'x-dashboard-pw': pw! }
      })
      const data = await res.json()
      setConversations(data.conversations || [])
      setLoading(false)
    }
    load()
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [pw, fromDate, toDate])

  const handleDelete = async (id: string) => {
    if (!confirm('Σίγουρα διαγραφή;')) return
    await fetch('/api/manychat/dashboard-full', {
      method: 'DELETE',
      headers: { 'x-dashboard-pw': pw!, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    setSelected(null)
    setConversations(conversations.filter(c => c.id !== id))
  }

  const handleStatusChange = async (id: string, newStatus: string) => {
    await fetch('/api/manychat/dashboard-full', {
      method: 'PATCH',
      headers: { 'x-dashboard-pw': pw!, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: newStatus })
    })
    setConversations(conversations.map(c => c.id === id ? { ...c, status: newStatus } : c))
    setSelected(prev => prev ? { ...prev, status: newStatus } : null)
  }

  if (pw !== DASHBOARD_PASSWORD) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-sm max-w-sm w-full text-center">
          <h1 className="text-xl font-semibold mb-2">Πρόσβαση</h1>
          <p className="text-sm text-gray-500">Προσθέστε το password στο URL: <br/><code className="text-xs bg-gray-100 px-2 py-1 rounded mt-2 inline-block">/dashboard?pw=XXXXX</code></p>
        </div>
      </div>
    )
  }

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-500">Φόρτωση...</p></div>

  const filtered = conversations.filter(c => {
    if (filterFlow !== 'all' && c.flow !== filterFlow) return false
    if (filterStatus !== 'all' && c.status !== filterStatus) return false
    return true
  })

  const paidCount = conversations.filter(c => c.payment_completed_at).length
  const revenue = paidCount * 69 // assuming 63 at 69€, rough estimate
  const stats = {
    total: conversations.length,
    pending: conversations.filter(c => c.status === 'pending').length,
    linkSent: conversations.filter(c => c.link_sent_at).length,
    linkClicked: conversations.filter(c => c.link_clicked_at).length,
    checkoutStarted: conversations.filter(c => c.checkout_started_at).length,
    paid: paidCount,
    humanNeeded: conversations.filter(c => c.status === 'human_needed').length,
    revenue: revenue,
    conversionRate: conversations.length > 0 ? Math.round((paidCount / conversations.length) * 100) : 0,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-lg font-semibold">WithinSuccess Dashboard</h1>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 pt-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-xs text-gray-500 mb-1">Συνολικά Leads</p>
            <p className="text-2xl font-semibold">{stats.total}</p>
            <p className="text-xs text-gray-400 mt-1">Άτομα που έγραψαν DM</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-xs text-gray-500 mb-1">Links Απεσταλμένα</p>
            <p className="text-2xl font-semibold text-blue-600">{stats.linkSent}</p>
            <p className="text-xs text-gray-400 mt-1">Ο AI πρότεινε σελίδα</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-xs text-gray-500 mb-1">Άνοιξαν Σελίδα</p>
            <p className="text-2xl font-semibold text-purple-600">{stats.linkClicked}</p>
            <p className="text-xs text-gray-400 mt-1">{stats.linkSent > 0 ? Math.round(stats.linkClicked / stats.linkSent * 100) : 0}% click rate</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-xs text-gray-500 mb-1">Ξεκίνησαν Checkout</p>
            <p className="text-2xl font-semibold text-orange-600">{stats.checkoutStarted}</p>
            <p className="text-xs text-gray-400 mt-1">{stats.linkClicked > 0 ? Math.round(stats.checkoutStarted / stats.linkClicked * 100) : 0}% of visits</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-xs text-gray-500 mb-1">Πληρωμές</p>
            <p className="text-2xl font-semibold text-green-600">{stats.paid}</p>
            <p className="text-xs text-gray-400 mt-1">{stats.total > 0 ? Math.round(stats.paid / stats.total * 100) : 0}% overall conversion</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-xs text-gray-500 mb-1">Έσοδα</p>
            <p className="text-2xl font-semibold text-green-700">{stats.revenue}€</p>
            <p className="text-xs text-gray-400 mt-1">Από {stats.paid} πληρωμές</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-6">
        <div className="flex gap-4 mb-6 flex-wrap items-center">
          <select value={filterFlow} onChange={e => setFilterFlow(e.target.value)} className="border rounded-lg px-3 py-2 text-sm bg-white">
            <option value="all">Όλα τα flows</option>
            <option value="63">63 Μέρες</option>
            <option value="concierge">Concierge</option>
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border rounded-lg px-3 py-2 text-sm bg-white">
            <option value="all">Όλα τα status</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <div className="flex items-center gap-2 text-sm">
            <label className="text-gray-500 text-xs">Από:</label>
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="border rounded-lg px-3 py-2 text-sm bg-white" />
          </div>
          <div className="flex items-center gap-2 text-sm">
            <label className="text-gray-500 text-xs">Έως:</label>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="border rounded-lg px-3 py-2 text-sm bg-white" />
          </div>
          {(fromDate || toDate) && (
            <button onClick={() => { setFromDate(''); setToDate('') }} className="text-xs text-gray-500 underline">Καθάρισμα</button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Subscriber</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Flow</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Source</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Τελευταίο μήνυμα</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Ώρες</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} onClick={() => setSelected(c)} className={`border-b hover:bg-gray-50 cursor-pointer ${selected?.id === c.id ? 'bg-blue-50' : ''}`}>
                    <td className="px-4 py-3 font-mono text-xs">{c.subscriber_id}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-1 rounded text-xs bg-gray-100">{PRODUCT_LABELS[c.product_interest || c.flow] || c.flow}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{c.source || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-1 rounded text-xs ${c.status === 'paid' ? 'bg-green-100 text-green-700' : c.status === 'human_needed' ? 'bg-red-100 text-red-700' : c.status === 'link_sent' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'}`}>
                        {STATUS_LABELS[c.status] || c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{c.last_user_message}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{formatTime(hoursSince(c.received_at))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <div className="p-8 text-center text-gray-400">Καμία συνομιλία</div>}
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            {!selected ? (
              <p className="text-gray-400 text-sm text-center py-12">Κάνε κλικ σε μια συνομιλία</p>
            ) : (
              <div>
                <div className="mb-4 pb-4 border-b flex justify-between items-start">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Subscriber ID</p>
                    <p className="font-mono text-sm">{selected.subscriber_id}</p>
                    <div className="flex gap-2 mt-2">
                      <span className="inline-block px-2 py-1 rounded text-xs bg-gray-100">{PRODUCT_LABELS[selected.flow]}</span>
                      <span className="inline-block px-2 py-1 rounded text-xs bg-gray-100">Score: {selected.lead_score || 'n/a'}</span>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(selected.id)} className="text-xs text-red-500 hover:text-red-700 ml-2">Διαγραφή</button>
                </div>
                <div className="mb-4 pb-4 border-b">
                  <p className="text-xs text-gray-400 mb-2">Αλλαγή Status</p>
                  <select
                    value={selected.status}
                    onChange={e => handleStatusChange(selected.id, e.target.value)}
                    className="border rounded-lg px-3 py-2 text-sm bg-white w-full"
                  >
                    {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>

                <div className="mb-4 space-y-2 text-xs">
                  {selected.link_sent_at && <div className="flex justify-between"><span className="text-gray-400">Link στάλθηκε:</span> <span>{formatTime(hoursSince(selected.link_sent_at))} πριν</span></div>}
                  {selected.link_clicked_at && <div className="flex justify-between"><span className="text-gray-400">Link πατήθηκε:</span> <span className="text-blue-600">{formatTime(hoursSince(selected.link_clicked_at))} πριν</span></div>}
                  {selected.checkout_started_at && <div className="flex justify-between"><span className="text-gray-400">Checkout:</span> <span className="text-orange-600">{formatTime(hoursSince(selected.checkout_started_at))} πριν</span></div>}
                  {selected.payment_completed_at && <div className="flex justify-between"><span className="text-gray-400">Πληρωμή:</span> <span className="text-green-600">{formatTime(hoursSince(selected.payment_completed_at))} πριν</span></div>}
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {selected.messages?.map((m, i) => (
                    <div key={i} className={`p-3 rounded-lg text-sm ${m.role === 'assistant' ? 'bg-blue-50' : 'bg-gray-100'}`}>
                      <p className="text-xs font-medium mb-1 text-gray-500">{m.role === 'assistant' ? 'AI' : 'User'}</p>
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <DashboardContent />
    </Suspense>
  )
}
