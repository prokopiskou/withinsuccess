'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

const STRIPE_LINK = 'https://book.stripe.com/00wdRadbFgPz1YBcNz4ZG1N'
const GOLD = '#C9A96E'

function getPricingInfo() {
  const now = new Date()
  const greece = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Athens' }))
  const month = greece.getMonth() + 1
  const day = greece.getDate()

  if (month === 4 && day <= 27) return { price: 69, next: 89, deadline: '27 Απριλίου' }
  if ((month === 4 && day > 27) || (month === 5 && day <= 4)) return { price: 89, next: 109, deadline: '4 Μαΐου' }
  if (month === 5 && day <= 11) return { price: 109, next: null, deadline: '11 Μαΐου' }
  return { price: 109, next: null, deadline: '11 Μαΐου' }
}

const DEFAULTS = {
  headline: 'Δεν σου λείπει η θέληση. Σου λείπει ένα σύστημα να σε κρατάει σε πορεία.',
  subheadline: '63 ημέρες. Κάθε εβδομάδα ένα θέμα. Κάθε μέρα μία πράξη.',
  bullets: [
    '9 φωνητικά μηνύματα καθοδήγησης',
    '9 Playbooks με καθημερινές πράξεις',
    'Ιδιωτικό Viber broadcast channel',
    'Online τελετή αποφοίτησης'
  ]
}

const broadcastImages = [
  '/broadcast.webp','/broadcast1.webp','/broadcast2.webp','/broadcast3.webp',
  '/broadcast4.webp','/broadcast5.webp','/broadcast6.webp',
]

const testimonialImages = [
  '/testimonial63_1.webp','/Testimonial63_2.webp','/testimonial63_3.webp',
]

function Carousel({ images }: { images: string[] }) {
  const [current, setCurrent] = useState(0)
  const prev = () => setCurrent(c => Math.max(0, c - 1))
  const next = () => setCurrent(c => Math.min(images.length - 1, c + 1))

  return (
    <div className="w-full">
      <div className="relative flex items-center justify-center">
        <button onClick={prev} className="absolute left-0 z-10 w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:border-gray-400 hover:text-black transition-all text-sm bg-white">{'<'}</button>
        <div className="w-full flex justify-center px-10">
          <img src={images[current]} alt="" className="rounded-2xl max-w-full max-h-[70vh] object-contain" />
        </div>
        <button onClick={next} className="absolute right-0 z-10 w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:border-gray-400 hover:text-black transition-all text-sm bg-white">{'>'}</button>
      </div>
      <div className="flex items-center justify-center gap-2 mt-4">
        {images.map((_, i) => (
          <button key={i} onClick={() => setCurrent(i)} className={`h-1.5 rounded-full transition-all ${i === current ? 'bg-black w-4' : 'bg-gray-300 w-1.5'}`} />
        ))}
      </div>
    </div>
  )
}

function PricingBlock({ onCheckout, loading }: { onCheckout: () => void; loading: boolean }) {
  const { price, next, deadline } = getPricingInfo()
  return (
    <div className="text-center">
      <p className="text-5xl font-semibold mb-2" style={{ fontFamily: 'Georgia, serif' }}>{price}€</p>
      <p className="text-xs text-gray-400 mb-6">
        {next ? `Μετά τις ${deadline}: ${next}€` : `Τελευταία ευκαιρία μέχρι ${deadline}`}
      </p>
      <button
        onClick={onCheckout}
        disabled={loading}
        className="inline-block text-white px-10 py-4 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
        style={{ backgroundColor: GOLD, cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.6 : 1 }}
      >
        {loading ? 'Φόρτωση...' : 'Κατοχύρωσε τη θέση σου'}
      </button>
      <p className="text-xs text-gray-400 mt-3">Περιορισμένες θέσεις. Έναρξη 12 Μαΐου.</p>
    </div>
  )
}

function PageContent() {
  const searchParams = useSearchParams()
  const sid = searchParams.get('sid')
  const [headline, setHeadline] = useState(DEFAULTS.headline)
  const [subheadline, setSubheadline] = useState(DEFAULTS.subheadline)
  const [bullets, setBullets] = useState(DEFAULTS.bullets)
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  useEffect(() => {
    async function load() {
      if (!sid) { setLoading(false); return }
      try {
        const res = await fetch('/api/manychat/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscriber_id: sid })
        })
        const data = await res.json()
        if (data.personalized) {
          if (data.headline) setHeadline(data.headline)
          if (data.subheadline) setSubheadline(data.subheadline)
          if (data.bullets?.length) setBullets([...data.bullets, 'Ξεκινάς 12 Μαΐου'])
        }
      } catch {}
      setLoading(false)
    }
    load()
  }, [sid])

  const handleCheckout = async () => {
    if (!sid) { window.location.href = STRIPE_LINK; return }
    setCheckoutLoading(true)
    try {
      const res = await fetch('/api/stripe/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriber_id: sid })
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch { window.location.href = STRIPE_LINK }
    setCheckoutLoading(false)
  }

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 40, height: 40, border: '2px solid #000', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
    </div>
  )

  return (
    <main className="min-h-screen bg-white text-black font-sans">
      <script
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '3382009922036740');
            fbq('track', 'PageView');
          `
        }}
      />
      <noscript>
        <img height="1" width="1" style={{display:'none'}}
          src="https://www.facebook.com/tr?id=3382009922036740&ev=PageView&noscript=1"
        />
      </noscript>

      {/* HERO + CTA 1 */}
      <section className="pt-20 pb-4 px-6 max-w-3xl mx-auto text-center">
        <p className="text-sm font-medium tracking-widest text-gray-400 uppercase mb-6">63 Μέρες της Ζωής σου</p>
        <h1 className="text-3xl md:text-5xl font-semibold leading-tight tracking-tight mb-6" style={{ fontFamily: 'Georgia, serif' }}>
          {headline}
        </h1>
        <p className="text-lg text-gray-500 leading-relaxed mb-10">{subheadline}</p>
        <div className="flex flex-col gap-3 max-w-xs mx-auto mb-12 text-left md:ml-[calc(50%-140px)]">
          {bullets.map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 20 20" fill="none">
                <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fill="#C9A96E"/>
              </svg>
              <span className="text-gray-600 text-sm leading-relaxed">{item}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ΤΙ ΠΕΡΙΛΑΜΒΑΝΕΙ */}
      <section className="py-6 px-6 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <p className="text-sm font-medium tracking-widest text-gray-400 uppercase mb-8 text-center">Τι περιλαμβάνει</p>
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: 'Georgia, serif' }}>Κάθε Κυριακή</h3>
              <p className="text-gray-600 text-sm leading-relaxed">Ηχητική καθοδήγηση για την εβδομάδα. Το προσωπικό σου Playbook με ασκήσεις. Η συμφωνία που κάνεις με τον εαυτό σου.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: 'Georgia, serif' }}>Κάθε μέρα</h3>
              <p className="text-gray-600 text-sm leading-relaxed">Μηνύματα καθοδήγησης στο ιδιωτικό Viber channel. Μία πράξη 1-2 λεπτών. Χτίζεις συνέπεια. Σπάς την υπερανάλυση. Ξαναπαίρνεις τον έλεγχο.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: 'Georgia, serif' }}>Κάθε εβδομάδα</h3>
              <p className="text-gray-600 text-sm leading-relaxed">Αυτοστοχασμός. Δομημένη αυτοαξιολόγηση. Προχωράς στο επόμενο επίπεδο.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: 'Georgia, serif' }}>Στο τέλος</h3>
              <p className="text-gray-600 text-sm leading-relaxed">Online τελετή αποφοίτησης. Η στιγμή που βλέπεις τη μεταμόρφωση. Κλείνεις έναν κύκλο και μπαίνεις στην επόμενη φάση.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ΓΙΑΤΙ ΔΟΥΛΕΥΕΙ */}
      <section className="py-6 px-6 bg-white">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-sm font-medium tracking-widest text-gray-400 uppercase mb-8">Γιατί δουλεύει</p>
          <p className="text-2xl font-semibold mb-6" style={{ fontFamily: 'Georgia, serif' }}>
            Επειδή δεν βασίζεται στη διάθεση. Βασίζεται στη δράση.
          </p>
          <p className="text-gray-500 leading-relaxed mb-4">Κάθε μικρή πράξη μειώνει την αντίσταση, αυξάνει την αυτοπεποίθηση, χτίζει μια νέα ιστορία για τον εαυτό σου.</p>
          <p className="text-gray-500 leading-relaxed">63 πράξεις = 63 αποδείξεις. Οι αποδείξεις αλλάζουν την ταυτότητα. Η ταυτότητα αλλάζει τη ζωή.</p>
        </div>
      </section>

      {/* ΤΙ ΑΛΛΑΖΕΙ */}
      <section className="py-6 px-6 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <p className="text-sm font-medium tracking-widest text-gray-400 uppercase mb-8 text-center">Τι αλλάζει σε σένα</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              'Η υπερανάλυση κοπάζει',
              'Ξυπνάς με καθαρό μυαλό',
              'Λες "όχι" χωρίς ενοχές',
              'Βάζεις όρια χωρίς φόβο',
              'Η γνώμη των άλλων δεν σε ορίζει',
              'Η παρουσία σου δυναμώνει',
              'Η σχέση με τον εαυτό σου αλλάζει',
              'Νιώθεις ξανά τον έλεγχο',
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 py-2">
                <span className="text-gray-300 mt-0.5">—</span>
                <span className="text-gray-700 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WITHIN PATH */}
      <section className="py-6 px-6 bg-white">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-sm font-medium tracking-widest text-gray-400 uppercase mb-8">The Within Path</p>
          <p className="text-gray-500 text-sm mb-8">Η μέθοδος που μέχρι τώρα υπήρχε μόνο στο 1-1 coaching. Τώρα σε μορφή συστήματος.</p>
          <div className="flex flex-col gap-4 max-w-sm mx-auto text-left">
            {[
              { stage: 'AWAKE', desc: 'Βλέπεις καθαρά' },
              { stage: 'PAUSE', desc: 'Σταματάς τον νοητικό θόρυβο' },
              { stage: 'REMEMBER', desc: 'Επανασυνδέεσαι με αυτό που είσαι' },
              { stage: 'ALIGN', desc: 'Ευθυγραμμίζεσαι με ό,τι έχει νόημα' },
              { stage: 'EMBODY', desc: 'Ζεις τη νέα σου εκδοχή' },
            ].map((item, i) => (
              <div key={i} className="flex items-baseline gap-3">
                <span className="text-xs font-semibold tracking-widest" style={{ color: GOLD, minWidth: 80 }}>{item.stage}</span>
                <span className="text-gray-600 text-sm">{item.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-6 px-6 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <p className="text-sm font-medium tracking-widest text-gray-400 uppercase mb-8 text-center">Αυτοί το έζησαν</p>
          <Carousel images={testimonialImages} />
        </div>
      </section>

      {/* CTA 2 - ΚΕΝΤΡΙΚΟ */}
      <section className="py-6 px-6 bg-white">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-3xl font-semibold mb-4" style={{ fontFamily: 'Georgia, serif' }}>Η απόφαση</h2>
          <p className="text-gray-500 mb-8">
            Η αναβολή είναι η πρώτη σκέψη που πρέπει να νικήσεις.
          </p>
          <PricingBlock onCheckout={handleCheckout} loading={checkoutLoading} />
        </div>
      </section>

      {/* BROADCAST CHANNEL */}
      <section className="py-6 px-6 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <p className="text-sm font-medium tracking-widest text-gray-400 uppercase mb-8 text-center">Μέσα στο broadcast channel</p>
          <Carousel images={broadcastImages} />
        </div>
      </section>

      {/* CTA 3 */}
      <section className="py-6 px-6 bg-white">
        <div className="max-w-xl mx-auto text-center">
          <PricingBlock onCheckout={handleCheckout} loading={checkoutLoading} />
        </div>
      </section>

      {/* FAQ */}
      <section className="py-6 px-6 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <p className="text-sm font-medium tracking-widest text-gray-400 uppercase mb-8 text-center">Συχνές ερωτήσεις</p>
          <div className="space-y-0">
            {[
              { q: 'Πόσο χρόνο χρειάζεται καθημερινά;', a: '1-2 λεπτά. Η μικρή πράξη νικά την υπερανάλυση.' },
              { q: 'Τι γίνεται αν χάσω μία μέρα;', a: 'Συνεχίζεις κανονικά. Δεν αναπληρώνεις. Η κατεύθυνση μετράει.' },
              { q: 'Τι γίνεται αν δεν έχω διάθεση;', a: 'Το πρόγραμμα δουλεύει χωρίς διάθεση. Οι πράξεις εκτελούνται πριν αντισταθεί το μυαλό.' },
              { q: 'Είναι 1-1;', a: 'Όχι. Είναι group σύστημα αλλά η πορεία είναι 100% προσωπική.' },
              { q: 'Θα χρειαστεί να μιλήσω σε άλλους;', a: 'Όχι. Το broadcast channel είναι μονόδρομο. Λαμβάνεις, δεν εκτίθεσαι.' },
              { q: 'Χρειάζεται εμπειρία σε αυτοβελτίωση;', a: 'Όχι. Κάθε μέρα ένα ξεκάθαρο βήμα. Τίποτα να σκέφτεσαι.' },
              { q: 'Τι αλλάζει σε 63 μέρες;', a: 'Σκέψη, συμπεριφορά, ταυτότητα. Βήμα βήμα, πράξη πράξη.' },
            ].map((item, i) => (
              <details key={i} className="border-b border-gray-200 group">
                <summary className="py-4 cursor-pointer flex items-center justify-between text-sm font-medium text-gray-800 hover:text-black">
                  {item.q}
                  <span className="text-gray-400 group-open:rotate-45 transition-transform text-lg">+</span>
                </summary>
                <p className="pb-4 text-sm text-gray-500 leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 px-6 bg-white border-t border-gray-100">
        <div className="max-w-6xl mx-auto flex flex-col items-center gap-4 text-center">
          <span className="text-lg font-semibold tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>WithinSuccess</span>
          <p className="text-xs text-gray-400">© 2026 WithinSuccess · Προκόπης Κούκης</p>
          <p className="text-xs text-gray-400">hello@withinsuccess.gr</p>
        </div>
      </footer>
    </main>
  )
}

export default function SixtyThreeDaysPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <PageContent />
    </Suspense>
  )
}