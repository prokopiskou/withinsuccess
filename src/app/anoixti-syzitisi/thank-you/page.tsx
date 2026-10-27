'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { trackPurchase } from '@/lib/analytics'
import { SEMINAR, SEMINAR_TICKETS } from '@/lib/seminar'

export default function SeminarThankYou() {
  const [live, setLive] = useState(true)
  const [seats, setSeats] = useState(1)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const sessionId = params.get('session_id')
    const isLive = params.get('t') !== 'online'
    if (!isLive) Promise.resolve().then(() => setLive(false))
    const ticket = isLive ? 'seminar_live' : 'seminar_online'
    const track = (qty: number) =>
      trackPurchase({ id: ticket, name: SEMINAR_TICKETS[ticket].name, price: SEMINAR.priceEur * qty }, sessionId || undefined)
    if (!sessionId) { track(1); return }
    // Η αξία πρέπει να είναι ίδια με το server-side Purchase (πολλά εισιτήρια σε μία αγορά)
    fetch(`/api/seminar/session?id=${encodeURIComponent(sessionId)}`)
      .then(r => (r.ok ? r.json() : null))
      .then((d: { quantity?: number } | null) => {
        const qty = d?.quantity && d.quantity > 0 ? d.quantity : 1
        if (qty > 1) setSeats(qty)
        track(qty)
      })
      .catch(() => track(1))
  }, [])

  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-24">
      <div className="max-w-lg text-center">
        <p className="text-sm tracking-widest text-[#C9A96E] uppercase mb-6">{SEMINAR.dateLabel}</p>
        <h1 className="text-4xl text-[#0D0D0D] mb-6" style={{ fontFamily: 'Georgia, serif' }}>
          {seats > 1 ? `Οι ${seats} θέσεις σου είναι κλεισμένες.` : 'Η θέση σου είναι κλεισμένη.'}
        </h1>
        <p className="text-gray-500 text-lg mb-4">
          {live
            ? 'Σε λίγα λεπτά θα λάβεις email επιβεβαίωσης με τον χώρο και όλες τις λεπτομέρειες.'
            : 'Σε λίγα λεπτά θα λάβεις email επιβεβαίωσης. Τον σύνδεσμο της μετάδοσης θα τον στείλω πριν την εκδήλωση.'}
        </p>
        <p className="text-gray-400 text-sm mb-12">
          Αν δεν το βρεις στα εισερχόμενα, έλεγξε τα spam και τις Προωθήσεις.
        </p>
        <p className="text-gray-700 mb-12" style={{ fontFamily: 'Georgia, serif' }}>
          Τα λέμε την Κυριακή, στις 11:00.<br />Προκόπης
        </p>
        <Link
          href="/"
          className="text-sm tracking-widest uppercase text-[#0D0D0D] border-b border-[#0D0D0D] pb-1 hover:text-[#C9A96E] hover:border-[#C9A96E] transition-colors"
        >
          Αρχική
        </Link>
      </div>
    </main>
  )
}
