'use client'

import { useEffect, useState } from 'react'
import MetaPixel, { trackEvent } from '@/components/MetaPixel'
import { trackBeginCheckout, generateEventId, trackViewContentTikTok } from '@/lib/analytics'
import { startCheckout } from '@/lib/checkout'
import { useViewPricing, useScrollDepth } from '@/lib/hooks/useAnalyticsHooks'
import UTMCapture from '@/components/UTMCapture'
import Footer from '@/components/Footer'
import { SEMINAR, SEMINAR_TICKETS, isSeminarSalesClosed, type SeminarTicket } from '@/lib/seminar'

const GOLD = '#8A6D2F'
const GOLD_LIGHT = '#C9A96E'

const PAGE_URL = `https://withinsuccess.gr/${SEMINAR.slug}`

type Availability = { liveLeft: number | null; closed: boolean }

export default function OpenConversationPage() {
  const [avail, setAvail] = useState<Availability>({ liveLeft: null, closed: isSeminarSalesClosed() })
  const [loading, setLoading] = useState<SeminarTicket | null>(null)
  const [failed, setFailed] = useState(false)

  useScrollDepth(SEMINAR.slug)
  const pricingRef = useViewPricing(SEMINAR.slug)

  useEffect(() => {
    trackEvent('ViewContent', { content_name: SEMINAR.slug })
    trackViewContentTikTok({ id: 'seminar_1511', name: SEMINAR.title, price: SEMINAR.priceEur })
    const paymentFailed = new URLSearchParams(window.location.search).get('error') === '1'
    fetch('/api/seminar/availability')
      .then(r => r.json())
      .then((d: Availability) => setAvail({ liveLeft: d.liveLeft, closed: d.closed }))
      .catch(() => {})
      .finally(() => { if (paymentFailed) setFailed(true) })
  }, [])

  const liveSoldOut = avail.liveLeft !== null && avail.liveLeft <= 0
  const liveLow = avail.liveLeft !== null && avail.liveLeft > 0 && avail.liveLeft <= 20

  async function buy(ticket: SeminarTicket) {
    if (loading) return
    if (avail.closed || (ticket === 'seminar_live' && liveSoldOut)) return
    setLoading(ticket)
    const eventId = generateEventId('checkout')
    trackBeginCheckout({ id: ticket, name: SEMINAR_TICKETS[ticket].name, price: SEMINAR.priceEur }, eventId)
    await startCheckout(ticket, `/${SEMINAR.slug}?error=1#tickets`, eventId)
    setLoading(null)
  }

  const where = SEMINAR.venueName
    ? `${SEMINAR.venueName}${SEMINAR.venueAddress ? `, ${SEMINAR.venueAddress}` : ''}`
    : `${SEMINAR.city} · ο χώρος στο email επιβεβαίωσης`

  const scrollToTickets = () =>
    document.getElementById('tickets')?.scrollIntoView({ behavior: 'smooth' })

  return (
    <main className="min-h-screen bg-white font-sans">
      <UTMCapture />
      <MetaPixel />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Event',
            name: SEMINAR.title,
            description: SEMINAR.subtitle,
            startDate: SEMINAR.startsAt,
            endDate: SEMINAR.endsAt,
            eventAttendanceMode: 'https://schema.org/MixedEventAttendanceMode',
            eventStatus: 'https://schema.org/EventScheduled',
            location: [
              {
                '@type': 'Place',
                name: SEMINAR.venueName || SEMINAR.city,
                address: SEMINAR.venueAddress || SEMINAR.city,
              },
              { '@type': 'VirtualLocation', url: PAGE_URL },
            ],
            image: ['https://withinsuccess.gr/og-syzitisi.jpg'],
            organizer: { '@type': 'Person', name: 'Προκόπης Κούκης', url: 'https://withinsuccess.gr' },
            offers: [
              { '@type': 'Offer', name: 'Δια ζώσης', price: String(SEMINAR.priceEur), priceCurrency: 'EUR', url: PAGE_URL, availability: 'https://schema.org/LimitedAvailability' },
              { '@type': 'Offer', name: 'Online', price: String(SEMINAR.priceEur), priceCurrency: 'EUR', url: PAGE_URL, availability: 'https://schema.org/InStock' },
            ],
          }),
        }}
      />

      {/* HERO */}
      <section className="relative bg-black text-white overflow-hidden">
        <img
          src="/syzitisi_stage.webp"
          alt="Ο Προκόπης Κούκης μιλά σε γεμάτη αίθουσα"
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/60 to-black" />
        <div className="relative pt-24 md:pt-32 pb-20 px-6 max-w-3xl mx-auto text-center">
          <p className="text-xs md:text-sm font-medium tracking-widest uppercase mb-6" style={{ color: GOLD_LIGHT }}>
            Live · {SEMINAR.dateLabel}
          </p>
          <h1 className="text-4xl md:text-6xl font-semibold leading-tight mb-6" style={{ fontFamily: 'Georgia, serif' }}>
            {SEMINAR.title}
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 leading-relaxed mb-10 max-w-xl mx-auto">
            {SEMINAR.subtitle}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 text-sm text-gray-300 mb-10">
            <span>{SEMINAR.timeLabel}</span>
            <span className="hidden sm:inline text-gray-600">|</span>
            <span>{where}</span>
            <span className="hidden sm:inline text-gray-600">|</span>
            <span>ή online</span>
          </div>
          <button
            type="button"
            onClick={scrollToTickets}
            className="inline-block bg-white text-black px-10 py-4 rounded-full text-base font-medium hover:bg-gray-100 transition-colors cursor-pointer border-0"
          >
            Κλείσε θέση · {SEMINAR.priceEur}€ →
          </button>
          {liveLow && (
            <p className="text-sm mt-4" style={{ color: GOLD_LIGHT }}>
              Έμειναν {avail.liveLeft} θέσεις δια ζώσης
            </p>
          )}
        </div>
      </section>

      {/* ΤΙ ΕΙΝΑΙ */}
      <section className="py-16 md:py-20 px-6 bg-white">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-medium tracking-widest text-gray-400 uppercase mb-8">Τι ειναι</p>
          <div className="text-2xl md:text-3xl leading-snug text-gray-900 space-y-4" style={{ fontFamily: 'Georgia, serif' }}>
            <p>Δεν είναι ένα σεμινάριο που παρακολουθείς για δύο ώρες.</p>
            <p>Είναι μια συζήτηση που χτίζεις εσύ.</p>
            <p className="text-gray-500">Ξεκάθαρα. Ειλικρινά. Χωρίς θεωρίες.</p>
          </div>
          <p className="text-lg text-gray-500 leading-relaxed mt-8">
            Δυόμισι ώρες ανοιχτής συζήτησης για όσα σε απασχολούν πραγματικά: το άγχος, τις σχέσεις,
            τα όρια, την αυτοπεποίθηση, το επόμενο βήμα. Φεύγεις με απαντήσεις που ισχύουν για τη δική σου ζωή.
          </p>
          <p className="text-lg text-gray-900 leading-relaxed mt-6 pl-5 border-l-2" style={{ borderColor: GOLD }}>
            Κάθε απάντηση πάει σε ένα σημείο: την ιστορία που λες στον εαυτό σου.
            Γιατί η ζωή αλλάζει όταν αλλάξει αυτή.
          </p>
        </div>
      </section>

      {/* ΓΙΑ ΠΟΙΟΝ */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-medium tracking-widest text-gray-400 uppercase mb-8">Για ποιον ειναι</p>
          <div className="flex flex-col gap-4">
            {[
              'Έχεις μια ερώτηση που σε βασανίζει και κανείς δεν σου έχει δώσει καθαρή απάντηση.',
              'Νιώθεις ότι κολλάς στο ίδιο σημείο, ξανά και ξανά.',
              'Θέλεις να ακούσεις την αλήθεια, όχι αυτό που θα σε κάνει να νιώσεις καλά για πέντε λεπτά.',
            ].map((item, i) => (
              <div key={i} className="flex gap-4 items-start p-6 bg-white rounded-2xl border border-gray-100">
                <span className="font-light text-lg flex-shrink-0" style={{ color: GOLD }}>{String(i + 1).padStart(2, '0')}</span>
                <p className="text-gray-700 leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ΠΩΣ ΔΟΥΛΕΥΕΙ */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-medium tracking-widest text-gray-400 uppercase mb-8">Πως δουλευει</p>
          <div className="flex flex-col gap-8">
            {[
              { n: '1', t: 'Κάνεις την ερώτησή σου', d: 'Στην αίθουσα, ζωντανά στο μικρόφωνο. Αν είσαι online, μετά την εγγραφή σου θα σου στείλω email για να τη στείλεις, και ανώνυμα αν θέλεις.' },
              { n: '2', t: 'Απαντάω ζωντανά', d: 'Χωρίς σενάριο. Πάμε στη ρίζα της ερώτησης, όχι στην επιφάνεια.' },
              { n: '3', t: 'Φεύγεις με ένα βήμα', d: 'Όχι με ωραία λόγια. Με κάτι συγκεκριμένο που κάνεις από την επόμενη μέρα.' },
            ].map(s => (
              <div key={s.n} className="flex gap-6 items-start">
                <span className="text-4xl font-semibold flex-shrink-0 w-10" style={{ fontFamily: 'Georgia, serif', color: GOLD }}>{s.n}</span>
                <div>
                  <p className="font-semibold text-gray-900 mb-1">{s.t}</p>
                  <p className="text-gray-500 leading-relaxed">{s.d}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10 p-6 bg-gray-50 rounded-2xl border border-gray-100">
            <p className="font-semibold text-gray-900 mb-1">Δεν χρειάζεται να ρωτήσεις.</p>
            <p className="text-gray-500 leading-relaxed">
              Μπορείς απλώς να ακούσεις. Πολλοί βρίσκουν την απάντησή τους στην ερώτηση κάποιου άλλου.
            </p>
          </div>
        </div>
      </section>

      {/* ΑΠΟΔΕΙΞΗ */}
      <section className="py-16 md:py-20 px-6 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <img
            src="/prokopis_audience.webp"
            alt="Γεμάτη αίθουσα σε εκδήλωση του Προκόπη Κούκη"
            className="w-full rounded-3xl object-cover mb-12"
            style={{ aspectRatio: '3 / 2' }}
          />
          <p className="text-xs font-medium tracking-widest text-gray-400 uppercase mb-8 text-center">Τι λενε οσοι δουλεψαν μαζι μου</p>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { t: 'Ανακάλυψα τον Προκόπη μέσω Instagram και από τότε παρακολούθησα σεμινάρια και ατομικές συνεδρίες. Μεταδίδει φοβερή ενέργεια, είναι αυθεντικός και τον προτείνω ανεπιφύλακτα!', n: 'Αναστασία Λεωνιδοπούλου' },
              { t: 'Δεν είναι απλώς coach, είναι άνθρωπος που σε βλέπει, σε ακούει και σε βοηθά να θυμηθείς ποιος πραγματικά είσαι. Κάθε συζήτηση μαζί του αφήνει καθαρότητα, ηρεμία και πίστη ότι μπορείς να αλλάξεις ό,τι σε βαραίνει.', n: 'Alexandra Skouria' },
              { t: 'Ο Προκόπης με βοήθησε πραγματικά σε μια δύσκολη περίοδο. Είναι άνθρωπος που ακούει, καταλαβαίνει και σε στηρίζει με ουσιαστικό τρόπο. Ειλικρινής, υποστηρικτικός και ανθρώπινος.', n: 'Alexandros Neofytos' },
            ].map((r, i) => (
              <div key={i} className="p-6 bg-white rounded-2xl border border-gray-100 flex flex-col">
                <p className="text-gray-700 leading-relaxed text-sm flex-1">«{r.t}»</p>
                <p className="text-sm font-medium text-gray-900 mt-4">{r.n}</p>
                <p className="text-xs text-gray-400">Google Review</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ΕΙΣΙΤΗΡΙΑ */}
      <section id="tickets" ref={pricingRef} className="py-16 md:py-20 px-6 bg-black text-white scroll-mt-4">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-medium tracking-widest text-gray-500 uppercase mb-3 text-center">Εισιτηρια</p>
          <h2 className="text-3xl md:text-4xl font-semibold text-center mb-3" style={{ fontFamily: 'Georgia, serif' }}>
            Διάλεξε πώς θα είσαι εκεί.
          </h2>
          <p className="text-gray-400 text-center mb-10">{SEMINAR.dateLabel} · {SEMINAR.timeLabel}</p>

          {failed && (
            <p className="text-center text-sm text-red-400 mb-6">
              Κάτι δεν πήγε καλά με την πληρωμή. Δοκίμασε ξανά ή γράψε στο hello@withinsuccess.gr
            </p>
          )}

          {avail.closed ? (
            <p className="text-center text-gray-300 text-lg">Οι εγγραφές έκλεισαν. Τα λέμε στην επόμενη συζήτηση.</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {/* ΔΙΑ ΖΩΣΗΣ */}
              <div className="rounded-3xl border p-8 flex flex-col" style={{ borderColor: GOLD }}>
                <p className="text-xs tracking-widest uppercase mb-4" style={{ color: GOLD_LIGHT }}>Δια ζωσης · Περιορισμενες θεσεις</p>
                <p className="text-2xl font-semibold mb-1" style={{ fontFamily: 'Georgia, serif' }}>Στην αίθουσα</p>
                <p className="text-gray-400 text-sm mb-6">{where}</p>
                <ul className="text-gray-300 text-sm space-y-3 mb-8 flex-1">
                  <li>Κάνεις την ερώτησή σου από κοντά</li>
                  <li>Η ενέργεια της αίθουσας, που δεν μεταφέρεται σε οθόνη</li>
                  <li>Γνωρίζεις ανθρώπους που ψάχνουν τα ίδια με εσένα</li>
                </ul>
                <p className="text-4xl font-semibold mb-6" style={{ fontFamily: 'Georgia, serif' }}>{SEMINAR.priceEur}€</p>
                <button
                  type="button"
                  disabled={liveSoldOut || loading !== null}
                  onClick={() => buy('seminar_live')}
                  className="w-full bg-white text-black px-8 py-4 rounded-full text-base font-medium hover:bg-gray-100 transition-colors cursor-pointer border-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {liveSoldOut ? 'Οι θέσεις εξαντλήθηκαν' : loading === 'seminar_live' ? 'Μια στιγμή…' : 'Θέλω θέση στην αίθουσα →'}
                </button>
                {liveLow && <p className="text-xs text-center mt-3" style={{ color: GOLD_LIGHT }}>Έμειναν {avail.liveLeft} θέσεις</p>}
              </div>

              {/* ONLINE */}
              <div className="rounded-3xl border border-gray-800 p-8 flex flex-col">
                <p className="text-xs tracking-widest uppercase mb-4 text-gray-500">Online · Απο οπου κι αν εισαι</p>
                <p className="text-2xl font-semibold mb-1" style={{ fontFamily: 'Georgia, serif' }}>Ζωντανή μετάδοση</p>
                <p className="text-gray-400 text-sm mb-6">Ο σύνδεσμος έρχεται στο email σου</p>
                <ul className="text-gray-300 text-sm space-y-3 mb-8 flex-1">
                  <li>Βλέπεις όλη τη συζήτηση live</li>
                  <li>Μου στέλνεις την ερώτησή σου με email και την απαντάω ζωντανά</li>
                  <li>Από το σπίτι σου, όπου κι αν είσαι</li>
                </ul>
                <p className="text-4xl font-semibold mb-6" style={{ fontFamily: 'Georgia, serif' }}>{SEMINAR.priceEur}€</p>
                <button
                  type="button"
                  disabled={loading !== null}
                  onClick={() => buy('seminar_online')}
                  className="w-full bg-transparent text-white border border-white px-8 py-4 rounded-full text-base font-medium hover:bg-white hover:text-black transition-colors cursor-pointer disabled:opacity-50"
                >
                  {loading === 'seminar_online' ? 'Μια στιγμή…' : 'Θέλω online θέση →'}
                </button>
              </div>
            </div>
          )}
          <p className="text-xs text-gray-500 text-center mt-8 max-w-lg mx-auto leading-relaxed">
            Η εκδήλωση βιντεοσκοπείται και το βίντεο δημοσιεύεται. Αν δεν θέλεις να φαίνεσαι, διάλεξε το online εισιτήριο και στείλε την ερώτησή σου ανώνυμα.
          </p>
        </div>
      </section>

      {/* ΠΡΟΚΟΠΗΣ */}
      <section className="py-16 md:py-20 px-6 bg-white">
        <div className="max-w-2xl mx-auto grid md:grid-cols-[200px_1fr] gap-8 items-center">
          <img src="/prokopis_about.webp" alt="Προκόπης Κούκης" className="w-48 h-60 object-cover rounded-2xl mx-auto" />
          <div>
            <p className="text-xs font-medium tracking-widest text-gray-400 uppercase mb-4">Ποιος θα σου απαντησει</p>
            <p className="text-2xl font-semibold mb-4" style={{ fontFamily: 'Georgia, serif' }}>Προκόπης Κούκης</p>
            <p className="text-gray-600 leading-relaxed mb-4">
              Ιδρυτής του WithinSuccess. Πάνω από 7 χρόνια δουλεύω με ανθρώπους που θέλουν να αλλάξουν τη ζωή τους από μέσα προς τα έξω.
            </p>
            <div className="flex gap-8 text-sm">
              <div><p className="text-2xl font-semibold" style={{ fontFamily: 'Georgia, serif', color: GOLD }}>900+</p><p className="text-gray-500">άνθρωποι που βοήθησα</p></div>
              <div><p className="text-2xl font-semibold" style={{ fontFamily: 'Georgia, serif', color: GOLD }}>180k</p><p className="text-gray-500">στο Instagram</p></div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-medium tracking-widest text-gray-400 uppercase mb-8">Συχνες ερωτησεις</p>
          <div className="flex flex-col divide-y divide-gray-200">
            {[
              { q: 'Πρέπει να κάνω ερώτηση;', a: 'Όχι. Μπορείς απλώς να ακούσεις. Πολλοί βρίσκουν την απάντησή τους στην ερώτηση κάποιου άλλου.' },
              { q: 'Θα απαντηθεί σίγουρα η ερώτησή μου;', a: 'Προσπαθώ να απαντήσω σε όσο περισσότερες γίνεται, και από την αίθουσα και από όσους είναι online.' },
              { q: 'Μπορώ να ρωτήσω ανώνυμα;', a: 'Ναι, με το online εισιτήριο. Μετά την εγγραφή σου θα σου στείλω email για να μου στείλεις την ερώτησή σου, με το όνομά σου ή ανώνυμα.' },
              { q: 'Η εκδήλωση βιντεοσκοπείται;', a: 'Ναι, για περιεχόμενο του WithinSuccess, και το βίντεο δημοσιεύεται. Αν δεν θέλεις να φαίνεσαι, διάλεξε το online εισιτήριο.' },
              { q: 'Πώς παίρνω τον σύνδεσμο για το online;', a: 'Με email, πριν την εκδήλωση. Αν δεν τον βρεις, έλεγξε τα spam ή γράψε μας.' },
              { q: 'Πού ακριβώς γίνεται;', a: SEMINAR.venueName ? where : 'Στην Αθήνα. Η ακριβής διεύθυνση έρχεται στο email επιβεβαίωσης.' },
            ].map((f, i) => (
              <details key={i} className="py-5 group">
                <summary className="cursor-pointer list-none flex justify-between items-center font-medium text-gray-900">
                  {f.q}
                  <span className="text-gray-400 group-open:rotate-45 transition-transform text-xl leading-none">+</span>
                </summary>
                <p className="text-gray-500 leading-relaxed mt-3">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA ΤΕΛΙΚΟ */}
      <section className="py-16 px-6 bg-black text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-semibold mb-4 text-white" style={{ fontFamily: 'Georgia, serif' }}>
            Την ερώτηση την έχεις ήδη.
          </h2>
          <p className="text-gray-400 mb-8">Έλα να πάρεις την απάντηση.</p>
          <button
            type="button"
            onClick={scrollToTickets}
            className="inline-block bg-white text-black px-10 py-4 rounded-full text-base font-medium hover:bg-gray-100 transition-colors cursor-pointer border-0"
          >
            Κλείσε θέση · {SEMINAR.priceEur}€ →
          </button>
          <p className="text-xs text-gray-500 mt-6">Για οποιαδήποτε απορία: hello@withinsuccess.gr</p>
        </div>
      </section>

      <Footer />
    </main>
  )
}
