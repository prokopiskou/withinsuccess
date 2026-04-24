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

function getFbCookies(): { fbp: string; fbc: string } {
  if (typeof document === 'undefined') return { fbp: '', fbc: '' }
  
  const cookies = document.cookie.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=')
    acc[key] = value
    return acc
  }, {} as Record<string, string>)
  
  return {
    fbp: cookies._fbp || '',
    fbc: cookies._fbc || ''
  }
}

const DEFAULTS = {
  headline: 'Ξεκινάς και σταματάς. Ξαναξεκινάς και ξανασταματάς.',
  subheadline: 'Και κάθε φορά μια φωνή μέσα σου λέει ότι εσύ δεν μπορείς. Μπορείς. Απλά δεν είχες ποτέ ένα πλαίσιο που να σε κρατάει όταν η διάθεση φεύγει.',
  bullets: [
    '9 ηχητικά καθοδήγησης — ένα κάθε Κυριακή',
    '9 Playbooks με καθημερινές πράξεις',
    'Ιδιωτικό Viber channel, καθημερινή παρουσία',
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
        {loading ? 'Φόρτωση...' : 'Είμαι μέσα'}
      </button>
      <p className="text-xs text-gray-400 mt-3">Έναρξη 12 Μαΐου.</p>
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
    setCheckoutLoading(true)
    
    const pricing = getPricingInfo()
    
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'InitiateCheckout', {
        value: pricing.price,
        currency: 'EUR',
        content_name: '63 Μέρες Ζωής',
        content_type: 'product'
      })
    }
    
    if (!sid) { 
      window.location.href = STRIPE_LINK
      return 
    }
    
    const { fbp, fbc } = getFbCookies()
    
    try {
      const res = await fetch('/api/stripe/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          subscriber_id: sid,
          fbp,
          fbc
        })
      })
      const data = await res.json()
      
      if (data.url) {
        window.location.href = data.url
      } else {
        window.location.href = STRIPE_LINK
      }
    } catch { 
      window.location.href = STRIPE_LINK 
    }
    
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
      {/* HERO [EMOTION] */}
      <section className="pt-8 pb-4 px-6 max-w-3xl mx-auto text-center">
        <p className="text-sm font-medium tracking-widest text-gray-400 uppercase mb-6">63 Μέρες της Ζωής σου</p>
        <h1 className="text-3xl md:text-5xl font-semibold leading-tight tracking-tight mb-6" style={{ fontFamily: 'Georgia, serif' }}>
          {headline}
        </h1>
        <p className="text-lg text-gray-500 leading-relaxed mb-10">{subheadline}</p>
        <div className="flex flex-col gap-3 max-w-xs mx-auto mb-12 text-left md:ml-[calc(50%-140px)]">
          {bullets.map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <svg className="w-4 h-4 flex-shrink-0 mt-1" viewBox="0 0 20 20" fill="none">
                <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fill="#C9A96E"/>
              </svg>
              <span className="text-gray-600 text-sm leading-relaxed">{item}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ΤΙ ΕΙΝΑΙ [STRUCTURE] */}
      <section className="py-6 px-6 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <p className="text-sm font-medium tracking-widest text-gray-400 uppercase mb-8 text-center">Τι είναι το 63</p>
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: 'Georgia, serif' }}>Ένα 63ήμερο πλαίσιο προσωπικής αλλαγής</h3>
              <p className="text-gray-600 text-sm leading-relaxed">Δομημένο σε 9 εβδομάδες. Κάθε εβδομάδα ένα θέμα. Κάθε μέρα μία μικρή κίνηση πάνω στο θέμα.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: 'Georgia, serif' }}>Κάθε Κυριακή</h3>
              <p className="text-gray-600 text-sm leading-relaxed">Ένα ηχητικό 7 λεπτών και το Playbook της εβδομάδας. Ένα θέμα, καθαρό, μπροστά σου.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: 'Georgia, serif' }}>Κάθε μέρα</h3>
              <p className="text-gray-600 text-sm leading-relaxed">Μία πράξη στο ιδιωτικό Viber channel. 1-2 λεπτά. Δεν χρειάζεται να αποφασίζεις ξανά κάθε πρωί.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: 'Georgia, serif' }}>Στο τέλος</h3>
              <p className="text-gray-600 text-sm leading-relaxed">Online τελετή αποφοίτησης. Το υλικό μένει δικό σου για πάντα.</p>
            </div>
          </div>
        </div>
      </section>

      {/* REFRAME [EMOTION] */}
      <section className="py-10 px-6 bg-white">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-2xl md:text-3xl font-semibold mb-6 leading-snug" style={{ fontFamily: 'Georgia, serif' }}>
            Η motivation δεν κρατάει.
          </p>
          <p className="text-gray-600 leading-relaxed mb-4">
            Είναι συναίσθημα. Και τα συναισθήματα αλλάζουν.
          </p>
          <p className="text-gray-600 leading-relaxed mb-4">
            Γι&apos; αυτό ξεκινάς με πάθος και σταματάς στην πρώτη κουρασμένη μέρα.
          </p>
          <p className="text-gray-600 leading-relaxed mb-4">
            Δεν φταις εσύ.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Φταίει που βασίζεσαι σε κάτι που δεν είναι φτιαγμένο να σε κρατήσει.
          </p>
        </div>
      </section>

      {/* ΜΙΑ ΜΕΡΑ ΜΕΣΑ [STRUCTURE] */}
      <section className="py-6 px-6 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <p className="text-sm font-medium tracking-widest text-gray-400 uppercase mb-8 text-center">Μια μέρα μέσα στο 63</p>
          <div className="space-y-6">
            <div>
              <h4 className="text-xs font-semibold tracking-widest mb-2" style={{ color: GOLD }}>ΚΥΡΙΑΚΗ ΠΡΩΙ</h4>
              <p className="text-gray-600 text-sm leading-relaxed">Ακούς το ηχητικό της εβδομάδας. Θέμα: πώς σταματάει η υπερανάλυση.</p>
            </div>
            <div>
              <h4 className="text-xs font-semibold tracking-widest mb-2" style={{ color: GOLD }}>ΔΕΥΤΕΡΑ 08:00</h4>
              <p className="text-gray-600 text-sm leading-relaxed">Notification στο Viber. Μία πρόταση. Μία καθοδήγηση για τη μέρα.</p>
            </div>
            <div>
              <h4 className="text-xs font-semibold tracking-widest mb-2" style={{ color: GOLD }}>ΔΕΥΤΕΡΑ ΒΡΑΔΥ</h4>
              <p className="text-gray-600 text-sm leading-relaxed">Στο Playbook γράφεις μία απάντηση. Όχι journal. Μία παρατήρηση.</p>
            </div>
            <div>
              <h4 className="text-xs font-semibold tracking-widest mb-2" style={{ color: GOLD }}>ΤΡΙΤΗ</h4>
              <p className="text-gray-600 text-sm leading-relaxed">Νέα καθοδήγηση. Πάνω σε αυτό που έκανες χθες.</p>
            </div>
            <div>
              <h4 className="text-xs font-semibold tracking-widest mb-2" style={{ color: GOLD }}>ΚΥΡΙΑΚΗ ΕΠΟΜΕΝΗ</h4>
              <p className="text-gray-600 text-sm leading-relaxed">Νέο θέμα. Νέο επίπεδο.</p>
            </div>
            <div className="pt-4 border-t border-gray-200">
              <p className="text-gray-700 text-sm leading-relaxed italic">
                Επαναλαμβάνεται 63 φορές. Χωρίς να χρειάζεται να αποφασίζεις ξανά κάθε πρωί. Το πλαίσιο είναι εκεί. Εσύ απλά εμφανίζεσαι.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ΤΙ ΘΑ ΖΗΣΕΙΣ [EMOTION] */}
      <section className="py-10 px-6 bg-white">
        <div className="max-w-2xl mx-auto">
          <p className="text-sm font-medium tracking-widest text-gray-400 uppercase mb-10 text-center">Τι θα ζήσεις μέσα στις 63 μέρες</p>
          <div className="space-y-10">
            <div>
              <h4 className="text-lg font-semibold mb-3" style={{ fontFamily: 'Georgia, serif', color: GOLD }}>Μέρα 1</h4>
              <p className="text-gray-600 leading-relaxed">Θα μπεις στο Viber και θα σκεφτείς: &quot;Θα με κρατήσει αυτό;&quot;</p>
              <p className="text-gray-600 leading-relaxed">Θα δεις το πρώτο μήνυμα. Μία πρόταση. Θα αναρωτηθείς αν είναι αρκετό.</p>
              <p className="text-gray-700 leading-relaxed mt-2 font-medium">Θα είναι.</p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-3" style={{ fontFamily: 'Georgia, serif', color: GOLD }}>Μέρα 14</h4>
              <p className="text-gray-600 leading-relaxed">Θα έχεις κάνει κάτι που ανέβαλλες εδώ και μήνες.</p>
              <p className="text-gray-600 leading-relaxed">Όχι επειδή βρήκες τη δύναμη. Επειδή το πλαίσιο σε οδήγησε εκεί χωρίς να το προσέξεις.</p>
              <p className="text-gray-600 leading-relaxed mt-2">Θα κλείσεις τα μάτια εκείνο το βράδυ και θα νιώσεις κάτι που είχες ξεχάσει.</p>
              <p className="text-gray-700 leading-relaxed mt-2 font-medium">Ότι μπορείς.</p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-3" style={{ fontFamily: 'Georgia, serif', color: GOLD }}>Μέρα 35</h4>
              <p className="text-gray-600 leading-relaxed">Θα κοιτάς πίσω και δεν θα αναγνωρίζεις αυτή που ήσουν πριν έναν μήνα.</p>
              <p className="text-gray-600 leading-relaxed">Όχι επειδή άλλαξες δραματικά.</p>
              <p className="text-gray-700 leading-relaxed mt-2 font-medium">Επειδή σταμάτησες να της λες ψέματα.</p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-3" style={{ fontFamily: 'Georgia, serif', color: GOLD }}>Μέρα 63</h4>
              <p className="text-gray-600 leading-relaxed">Θα ανοίξεις το Viber μία τελευταία φορά.</p>
              <p className="text-gray-600 leading-relaxed">Θα διαβάσεις το τελευταίο μήνυμα.</p>
              <p className="text-gray-600 leading-relaxed">Θα πας στην τελετή αποφοίτησης.</p>
              <p className="text-gray-600 leading-relaxed mt-2">Και θα καταλάβεις ότι αυτή που ξεκίνησε τις 63 μέρες δεν είναι η ίδια με αυτή που τις τελειώνει.</p>
              <p className="text-gray-700 leading-relaxed mt-4">Δεν έγινες κάποια άλλη.</p>
              <p className="text-xl font-semibold mt-2" style={{ fontFamily: 'Georgia, serif' }}>Έγινες δική σου.</p>
            </div>
          </div>
        </div>
      </section>

      {/* WITHIN PATH [STRUCTURE] */}
      <section className="py-6 px-6 bg-gray-50">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-sm font-medium tracking-widest text-gray-400 uppercase mb-8">The Within Path</p>
          <p className="text-gray-500 text-sm mb-8 leading-relaxed">Η μέθοδος που χρησιμοποιώ σε 1-1 coaching 7 χρόνια. Πρώτη φορά σε μορφή 63ήμερου συστήματος.</p>
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

      {/* Η ΦΩΝΗ [EMOTION] */}
      <section className="py-10 px-6 bg-white">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-sm font-medium tracking-widest text-gray-400 uppercase mb-8">Η φωνή που θα ξανακούσεις</p>
          <p className="text-gray-600 leading-relaxed mb-3">Θα σου πει πάλι ότι θα το παρατήσεις.</p>
          <p className="text-gray-600 leading-relaxed mb-3">Ότι δεν θα έχεις χρόνο.</p>
          <p className="text-gray-600 leading-relaxed mb-3">Ότι θα δεις μετά το καλοκαίρι.</p>
          <p className="text-gray-600 leading-relaxed mb-6">Ότι δεν είναι η σωστή στιγμή.</p>
          <p className="text-gray-700 leading-relaxed mb-3">Είναι η ίδια φωνή που σου λέει τα ίδια κάθε Ιανουάριο, κάθε Σεπτέμβριο, κάθε Δευτέρα.</p>
          <p className="text-lg font-semibold mt-4" style={{ fontFamily: 'Georgia, serif' }}>
            Δεν προστατεύει. Επαναλαμβάνει.
          </p>
        </div>
      </section>

      {/* TESTIMONIALS [STRUCTURE] */}
      <section className="py-6 px-6 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <p className="text-sm font-medium tracking-widest text-gray-400 uppercase mb-8 text-center">Αυτοί το έζησαν</p>
          <Carousel images={testimonialImages} />
        </div>
      </section>

      {/* Η ΑΠΟΦΑΣΗ [EMOTION] + PRICE [STRUCTURE] */}
      <section className="py-10 px-6 bg-white">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-3xl font-semibold mb-6" style={{ fontFamily: 'Georgia, serif' }}>Η απόφαση</h2>
          <p className="text-gray-600 leading-relaxed mb-3">Κάποια στιγμή παύεις να διαβάζεις για αλλαγή.</p>
          <p className="text-gray-600 leading-relaxed mb-3">Και αρχίζεις να την κάνεις.</p>
          <p className="text-gray-600 leading-relaxed mb-3">Αυτή η στιγμή δεν έρχεται.</p>
          <p className="text-gray-700 leading-relaxed mb-10 font-medium">Αποφασίζεται.</p>
          <PricingBlock onCheckout={handleCheckout} loading={checkoutLoading} />
        </div>
      </section>

      {/* BROADCAST CHANNEL */}
      <section className="py-6 px-6 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <p className="text-sm font-medium tracking-widest text-gray-400 uppercase mb-8 text-center">Μέσα στο Viber channel</p>
          <Carousel images={broadcastImages} />
        </div>
      </section>

      {/* FAQ [STRUCTURE] */}
      <section className="py-6 px-6 bg-white">
        <div className="max-w-2xl mx-auto">
          <p className="text-sm font-medium tracking-widest text-gray-400 uppercase mb-8 text-center">Συχνές ερωτήσεις</p>
          <div className="space-y-0">
            {[
              { q: 'Πόσο χρόνο χρειάζεται καθημερινά;', a: '1-2 λεπτά στο Viber. 5-10 λεπτά το πολύ για το εβδομαδιαίο ηχητικό.' },
              { q: 'Τι γίνεται αν χάσω μία μέρα;', a: 'Θα χάσεις. Δεν θα είναι η πρώτη φορά στη ζωή σου. Συνεχίζεις την επόμενη χωρίς το βάρος του χθες.' },
              { q: 'Τι γίνεται αν δεν έχω διάθεση;', a: 'Η διάθεση δεν είναι προϋπόθεση. Η πράξη είναι μικρή ακριβώς γι\' αυτόν τον λόγο.' },
              { q: 'Είναι 1-1;', a: 'Όχι. Είναι πρόγραμμα με ιδιωτικό Viber channel για όλους τους συμμετέχοντες.' },
              { q: 'Θα χρειαστεί να μιλήσω σε άλλους;', a: 'Όχι. Το Viber channel είναι μονόδρομο. Λαμβάνεις, δεν εκτίθεσαι.' },
              { q: 'Χρειάζεται εμπειρία σε αυτοβελτίωση;', a: 'Όχι. Κάθε μέρα ένα ξεκάθαρο βήμα.' },
              { q: 'Τι αλλάζει σε 63 μέρες;', a: 'Η σχέση με τον εαυτό σου. Όχι επειδή γίνεσαι διαφορετική. Επειδή γίνεσαι δική σου.' },
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

      {/* FINAL CTA */}
      <section className="py-12 px-6 bg-gray-50">
        <div className="max-w-xl mx-auto text-center">
          <p className="text-xl font-semibold mb-2" style={{ fontFamily: 'Georgia, serif' }}>63 μέρες.</p>
          <p className="text-gray-500 mb-10">Έναρξη 12 Μαΐου.</p>
          <PricingBlock onCheckout={handleCheckout} loading={checkoutLoading} />
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