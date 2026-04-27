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
        <button onClick={prev} className="absolute left-0 z-10 w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:border-gray-400 hover:text-black transition-all text-sm bg-white shadow-sm">{'<'}</button>
        <div className="w-full flex justify-center px-12">
          <img src={images[current]} alt="" className="rounded-2xl max-w-full max-h-[70vh] object-contain shadow-md" />
        </div>
        <button onClick={next} className="absolute right-0 z-10 w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:border-gray-400 hover:text-black transition-all text-sm bg-white shadow-sm">{'>'}</button>
      </div>
      <div className="flex items-center justify-center gap-2 mt-6">
        {images.map((_, i) => (
          <button key={i} onClick={() => setCurrent(i)} className={`h-1.5 rounded-full transition-all ${i === current ? 'bg-black w-6' : 'bg-gray-300 w-1.5'}`} />
        ))}
      </div>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center gap-3 mb-10">
      <div className="h-px w-8" style={{ backgroundColor: GOLD }} />
      <p className="text-xs font-medium tracking-[0.25em] text-gray-500 uppercase">{children}</p>
      <div className="h-px w-8" style={{ backgroundColor: GOLD }} />
    </div>
  )
}

function PricingBlock({ onCheckout, loading, ctaLabel = 'Είμαι μέσα' }: { onCheckout: () => void; loading: boolean; ctaLabel?: string }) {
  const { price, next, deadline } = getPricingInfo()
  return (
    <div className="text-center bg-white rounded-3xl p-10 shadow-sm border border-gray-100">
      <p className="text-xs tracking-widest text-gray-400 uppercase mb-4">Επένδυση</p>
      <p className="text-6xl font-semibold mb-3" style={{ fontFamily: 'Georgia, serif' }}>{price}€</p>
      <p className="text-xs text-gray-400 mb-8">
        {next ? `Μετά τις ${deadline}: ${next}€` : `Τελευταία ευκαιρία μέχρι ${deadline}`}
      </p>
      <button
        onClick={onCheckout}
        disabled={loading}
        className="inline-block text-white px-10 py-4 rounded-full text-sm font-medium hover:opacity-90 transition-all hover:scale-[1.02] shadow-lg"
        style={{ backgroundColor: GOLD, cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.6 : 1 }}
      >
        {loading ? 'Φόρτωση...' : ctaLabel}
      </button>
      <p className="text-xs text-gray-400 mt-5">Έναρξη 12 Μαΐου</p>
    </div>
  )
}

function AnchorButton({ label, href = '#apofasi' }: { label: string; href?: string }) {
  return (
    <a
      href={href}
      className="inline-block text-white px-10 py-4 rounded-full text-sm font-medium hover:opacity-90 transition-all hover:scale-[1.02] shadow-lg"
      style={{ backgroundColor: GOLD }}
    >
      {label}
    </a>
  )
}

function PageContent() {
  const searchParams = useSearchParams()
  const sid = searchParams.get('sid')
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  useEffect(() => {
    async function load() {
      if (!sid) { setLoading(false); return }
      try {
        await fetch('/api/manychat/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscriber_id: sid })
        })
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
      <style>{`html { scroll-behavior: smooth; }`}</style>

      {/* HERO */}
      <section className="pt-20 pb-16 px-6 max-w-3xl mx-auto text-center">
        <p className="text-xs font-medium tracking-[0.3em] uppercase mb-10" style={{ color: GOLD }}>63 Μέρες της Ζωής σου</p>

        <h1 className="text-3xl md:text-5xl font-semibold leading-tight tracking-tight mb-6" style={{ fontFamily: 'Georgia, serif' }}>
          Έμαθες να είσαι<br />το καλό παιδί.
        </h1>
        <p className="text-3xl md:text-5xl font-semibold leading-tight tracking-tight mb-12" style={{ fontFamily: 'Georgia, serif', color: GOLD }}>
          Σου κόστισε εσένα.
        </p>

        <div className="text-base md:text-lg text-gray-700 leading-relaxed space-y-3 max-w-md mx-auto mb-12">
          <p>Δεν λες όχι.</p>
          <p>Δεν βάζεις όρια.</p>
          <p>Δεν ζητάς ποτέ τίποτα.</p>
          <p className="pt-3">Και νιώθεις ότι κάτι σου λείπει.</p>
          <p className="font-semibold pt-2" style={{ fontFamily: 'Georgia, serif' }}>Είσαι εσύ.</p>
        </div>

        <div className="text-base md:text-lg text-gray-600 leading-relaxed space-y-2 max-w-md mx-auto mb-12">
          <p>Δεν είσαι λάθος.</p>
          <p>Έμαθες λάθος.</p>
          <p className="pt-2 text-gray-700 font-semibold">Μπορείς να το ξεμάθεις.</p>
        </div>

        <div className="inline-block bg-gray-50 rounded-2xl px-8 py-6 mb-8">
          <p className="text-xs tracking-widest text-gray-400 uppercase mb-2">Έναρξη</p>
          <p className="text-2xl font-semibold mb-3" style={{ fontFamily: 'Georgia, serif' }}>12 Μαΐου</p>
          <p className="text-xs text-gray-500">Μετά δεν υπάρχει δυνατότητα εισόδου</p>
        </div>

        <p className="text-sm text-gray-400">Δες πως λειτουργεί παρακάτω ↓</p>
      </section>

      {/* RECOGNITION */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-2xl mx-auto text-center">
          <SectionLabel>Σε αναγνωρίζεις;</SectionLabel>
          <div className="text-gray-700 leading-relaxed space-y-4">
            <p>Λες ναι όταν θες να πεις όχι.</p>
            <p>Φροντίζεις όλους εκτός από εσένα.</p>
            <p>Νιώθεις ενοχή όταν ξεκουράζεσαι.</p>
            <p>Ζητάς συγγνώμη για πράγματα που δεν έκανες.</p>
            <p>Δικαιολογείς ανθρώπους που σε πληγώνουν.</p>
            <p>Νιώθεις αόρατος όταν δεν είσαι χρήσιμος.</p>
            <p className="pt-6 text-xl font-semibold" style={{ fontFamily: 'Georgia, serif', color: GOLD }}>
              Δεν είσαι καλός άνθρωπος.
            </p>
            <p className="text-xl font-semibold" style={{ fontFamily: 'Georgia, serif' }}>
              Είσαι εκπαιδευμένος.
            </p>
          </div>
        </div>
      </section>

      {/* TI EINAI */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <SectionLabel>Τι είναι το 63 μέρες ζωής</SectionLabel>
          <div className="text-gray-700 leading-relaxed space-y-4 mb-12 text-center">
            <p className="text-2xl md:text-3xl font-semibold" style={{ fontFamily: 'Georgia, serif' }}>Ένα δομημένο σύστημα 9 εβδομάδων.</p>
            <p className="text-lg text-gray-500">Με εβδομαδιαία καθοδήγηση και καθημερινή πράξη.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white" style={{ backgroundColor: GOLD }}>1</div>
                <h3 className="text-lg font-semibold" style={{ fontFamily: 'Georgia, serif' }}>Κάθε Κυριακή λαμβάνεις</h3>
              </div>
              <div className="space-y-3 text-gray-600 text-sm">
                <div className="flex items-start gap-3"><span className="text-gray-300 mt-0.5">—</span><span>Ηχητική καθοδήγηση για την εβδομάδα</span></div>
                <div className="flex items-start gap-3"><span className="text-gray-300 mt-0.5">—</span><span>Το προσωπικό σου Playbook (πρακτικό οδηγό με ασκήσεις)</span></div>
                <div className="flex items-start gap-3"><span className="text-gray-300 mt-0.5">—</span><span>Τη συμφωνία που κάνεις με τον εαυτό σου</span></div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white" style={{ backgroundColor: GOLD }}>2</div>
                <h3 className="text-lg font-semibold" style={{ fontFamily: 'Georgia, serif' }}>Κάθε μέρα</h3>
              </div>
              <div className="space-y-3 text-gray-600 text-sm">
                <div className="flex items-start gap-3"><span className="text-gray-300 mt-0.5">—</span><span>Μηνύματα καθοδήγησης στο ιδιωτικό Viber channel</span></div>
                <div className="flex items-start gap-3"><span className="text-gray-300 mt-0.5">—</span><span>Μία πράξη 1–2 λεπτών που έχει τεθεί από πριν</span></div>
                <div className="flex items-start gap-3"><span className="text-gray-300 mt-0.5">—</span><span>Χτίζεις συνέπεια, σπας τα παλιά μοτίβα, παίρνεις τον έλεγχο</span></div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white" style={{ backgroundColor: GOLD }}>3</div>
                <h3 className="text-lg font-semibold" style={{ fontFamily: 'Georgia, serif' }}>Κάθε εβδομάδα</h3>
              </div>
              <div className="space-y-3 text-gray-600 text-sm">
                <div className="flex items-start gap-3"><span className="text-gray-300 mt-0.5">—</span><span>Κάνεις αυτοστοχασμό</span></div>
                <div className="flex items-start gap-3"><span className="text-gray-300 mt-0.5">—</span><span>Κάνεις δομημένη αυτοαξιολόγηση</span></div>
                <div className="flex items-start gap-3"><span className="text-gray-300 mt-0.5">—</span><span>Προχωράς στο επόμενο επίπεδο</span></div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white" style={{ backgroundColor: GOLD }}>4</div>
                <h3 className="text-lg font-semibold" style={{ fontFamily: 'Georgia, serif' }}>Στο τέλος των 63 ημερών</h3>
              </div>
              <div className="space-y-3 text-gray-600 text-sm">
                <div className="flex items-start gap-3"><span className="text-gray-300 mt-0.5">—</span><span>Online τελετή αποφοίτησης</span></div>
                <div className="flex items-start gap-3"><span className="text-gray-300 mt-0.5">—</span><span>Η στιγμή που βλέπεις τη μεταμόρφωση</span></div>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center space-y-2">
            <p className="text-gray-600">Δεν χρειάζεται χρόνος.</p>
            <p className="text-gray-600">Δεν χρειάζεται διάθεση.</p>
            <p className="text-xl font-semibold text-gray-800 pt-2" style={{ fontFamily: 'Georgia, serif' }}>Χρειάζεται μία μικρή πράξη τη μέρα.</p>
          </div>

          <div className="text-center pt-10">
            <AnchorButton label="Είμαι μέσα" />
          </div>
        </div>
      </section>

      {/* PLAYBOOK */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <SectionLabel>Το εβδομαδιαίο Playbook</SectionLabel>
          <div className="text-gray-700 leading-relaxed space-y-4 mb-10 text-center">
            <p className="text-2xl md:text-3xl font-semibold" style={{ fontFamily: 'Georgia, serif' }}>Ο χάρτης που σε κρατάει σταθερό για 7 ημέρες.</p>
            <p className="text-gray-500">Κάθε εβδομάδα ξεκλειδώνεις ένα νέο Playbook.</p>
            <p className="text-sm tracking-widest uppercase" style={{ color: GOLD }}>Μίνιμαλ · Ξεκάθαρο · Αποτελεσματικό</p>
          </div>

          <div className="bg-white rounded-2xl p-8 md:p-10">
            <p className="text-gray-700 font-medium mb-6 text-center">Μέσα περιλαμβάνει</p>
            <div className="space-y-5">
              {[
                { title: 'Τη συμφωνία με τον εαυτό σου', desc: '7 μέρες, 1 δέσμευση.' },
                { title: 'Τους κανόνες της εβδομάδας', desc: 'Καθαρή δομή → καθαρό μυαλό.' },
                { title: '7 μικρές πράξεις', desc: '1 πράξη/μέρα (1–2 λεπτά).' },
                { title: 'Αναστοχασμό', desc: '3 ερωτήσεις που χτίζουν συνειδητότητα.' },
                { title: 'Αυτοαξιολόγηση', desc: 'Βλέπεις τι κράτησες και τι συνεχίζεις.' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5 text-white" style={{ backgroundColor: GOLD }}>{i+1}</div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{item.title}</p>
                    <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 text-center space-y-2 text-gray-700">
            <p>Κάθε Playbook είναι ένα επίπεδο.</p>
            <p className="font-semibold" style={{ fontFamily: 'Georgia, serif' }}>Μετά τις 63 μέρες, έχεις ολοκληρώσει και τα 9.</p>
          </div>
        </div>
      </section>

      {/* ΓΙΑΤΙ ΔΟΥΛΕΥΕΙ */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-2xl mx-auto">
          <SectionLabel>Γιατί δουλεύει</SectionLabel>
          <div className="text-center mb-12">
            <p className="text-2xl md:text-3xl font-semibold mb-2" style={{ fontFamily: 'Georgia, serif' }}>Επειδή δεν βασίζεται στη διάθεση.</p>
            <p className="text-2xl md:text-3xl font-semibold" style={{ fontFamily: 'Georgia, serif', color: GOLD }}>Βασίζεται στη δράση.</p>
          </div>

          <div className="bg-gray-50 rounded-2xl p-8 mb-10">
            <p className="text-gray-700 font-medium mb-6 text-center">Κάθε μικρή πράξη</p>
            <div className="space-y-3">
              {[
                'Σπάει το παλιό μοτίβο',
                'Χτίζει νέα όρια',
                'Σου δείχνει ότι μπορείς να επιλέξεις διαφορετικά'
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 text-gray-600 text-sm">
                  <span className="text-gray-300 mt-0.5">—</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center space-y-3">
            <p className="text-2xl font-semibold" style={{ fontFamily: 'Georgia, serif', color: GOLD }}>63 πράξεις = 63 αποδείξεις.</p>
            <p className="text-gray-600">Οι αποδείξεις αλλάζουν την ταυτότητα.</p>
            <p className="text-gray-600">Η ταυτότητα αλλάζει τη ζωή.</p>
          </div>

          <div className="text-center pt-10">
            <AnchorButton label="Ξεμαθαίνω" />
          </div>
        </div>
      </section>

      {/* ΦΑΝΤΑΣΟΥ */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <SectionLabel>Φαντάσου τον εαυτό σου σε 63 μέρες</SectionLabel>
          <div className="bg-white rounded-2xl p-10 md:p-12 border border-gray-100">
            <div className="text-gray-700 leading-loose space-y-3 text-center text-lg">
              <p>Φαντάσου να λες όχι χωρίς ενοχές.</p>
              <p>Να βάζεις όρια χωρίς να χρειάζεται να το εξηγήσεις.</p>
              <p>Να ζητάς αυτό που χρειάζεσαι χωρίς ντροπή.</p>
              <p>Να μην απολογείσαι για το ότι υπάρχεις.</p>
              <p>Να μην προσπαθείς να κερδίσεις την αγάπη.</p>
              <p>Να σε αγαπάς πρώτα εσύ.</p>
              <p>Να φροντίζεις πρώτα εσένα.</p>
              <p>Να εμφανίζεσαι πρώτα για σένα.</p>
              <p className="text-2xl font-semibold pt-4" style={{ fontFamily: 'Georgia, serif', color: GOLD }}>Να είσαι δικός σου.</p>
            </div>
          </div>
          <p className="text-center text-gray-500 mt-8 italic">Αυτό είναι το αποτέλεσμα των 63 Μερών Ζωής.</p>
        </div>
      </section>

      {/* ΤΙ ΑΛΛΑΖΕΙ */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <SectionLabel>Τι αλλάζει σε σένα</SectionLabel>
          <p className="text-gray-600 mb-10 text-center">Μετά τις 63 μέρες</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              'Λες "όχι" χωρίς ενοχές',
              'Βάζεις όρια χωρίς να φοβάσαι',
              'Σταματάς να ζητάς συγγνώμη',
              'Φροντίζεις τον εαυτό σου πρώτα',
              'Η γνώμη των άλλων δεν σε ορίζει',
              'Η παρουσία σου δυναμώνει',
              'Η σχέση σου με τον εαυτό σου αλλάζει',
              'Σταματάς να εξηγείς',
              'Νιώθεις ότι έχεις ξανά τον έλεγχο',
            ].map((item, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-5 border border-gray-100 flex items-start gap-3">
                <svg className="w-4 h-4 flex-shrink-0 mt-1" viewBox="0 0 20 20" fill="none">
                  <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fill="#C9A96E"/>
                </svg>
                <span className="text-gray-700 text-sm">{item}</span>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center space-y-2">
            <p className="text-xl font-semibold" style={{ fontFamily: 'Georgia, serif' }}>Αυτή είναι η αλλαγή ταυτότητας.</p>
            <p className="text-sm tracking-[0.2em] uppercase" style={{ color: GOLD }}>Ήρεμη · Βαθιά · Σταθερή</p>
          </div>
          <div className="text-center pt-10">
            <AnchorButton label="Είμαι μέσα" />
          </div>
        </div>
      </section>

      {/* WITHIN PATH */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-2xl mx-auto text-center">
          <SectionLabel>The Within Path™</SectionLabel>
          <div className="text-gray-700 leading-relaxed space-y-3 mb-10">
            <p>Η μέθοδος που μέχρι τώρα υπήρχε μόνο στο 1-1 coaching.</p>
            <p>Τώρα σε μορφή συστήματος.</p>
          </div>
          <p className="text-lg font-semibold mb-10" style={{ fontFamily: 'Georgia, serif', color: GOLD }}>5 στάδια → 63 πράξεις → 1 νέα ταυτότητα</p>

          <div className="space-y-3 max-w-md mx-auto">
            {[
              { stage: 'AWAKE', desc: 'Βλέπεις καθαρά' },
              { stage: 'PAUSE', desc: 'Σταματάς το νοητικό θόρυβο' },
              { stage: 'REMEMBER', desc: 'Επανασυνδέεσαι με αυτό που είσαι' },
              { stage: 'ALIGN', desc: 'Ευθυγραμμίζεσαι με ό,τι έχει νόημα' },
              { stage: 'EMBODY', desc: 'Ζεις τη νέα σου εκδοχή' },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-xl p-5 flex items-center gap-4 text-left">
                <span className="text-xs font-bold tracking-widest" style={{ color: GOLD, minWidth: 90 }}>{item.stage}</span>
                <span className="text-gray-700 text-sm">{item.desc}</span>
              </div>
            ))}
          </div>
          <p className="text-gray-500 text-sm mt-10 tracking-[0.2em] uppercase" style={{ color: GOLD }}>Απλό · Καθαρό · Μεταμορφωτικό</p>
        </div>
      </section>

      {/* VIBER CHANNEL */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <SectionLabel>Viber broadcast channel</SectionLabel>
          <div className="text-gray-700 leading-relaxed space-y-3 mb-10 text-center">
            <p className="text-2xl font-semibold" style={{ fontFamily: 'Georgia, serif' }}>Δεν θα πορευτείς μόνος σου.</p>
            <p className="text-gray-500">Μπαίνεις σε ένα ιδιωτικό κανάλι όπου λαμβάνεις</p>
          </div>
          <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100 max-w-md mx-auto mb-10">
            <div className="space-y-3 text-gray-700 text-sm">
              <div className="flex items-start gap-3"><span style={{ color: GOLD }}>▸</span><span>Καθημερινές υπενθυμίσεις</span></div>
              <div className="flex items-start gap-3"><span style={{ color: GOLD }}>▸</span><span>Μικρά ηχητικά</span></div>
              <div className="flex items-start gap-3"><span style={{ color: GOLD }}>▸</span><span>Νοητικές άγκυρες</span></div>
              <div className="flex items-start gap-3"><span style={{ color: GOLD }}>▸</span><span>Καθοδήγηση για να μην βγεις από τροχιά</span></div>
            </div>
          </div>
          <p className="text-center mb-10">
            <span className="inline-block bg-gray-50 rounded-full px-6 py-3 text-sm font-semibold border border-gray-100" style={{ color: GOLD }}>
              Αυξάνει τη συνέπεια ×10
            </span>
          </p>
          <Carousel images={broadcastImages} />
        </div>
      </section>

      {/* ΤΕΛΕΤΗ */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <SectionLabel>Τελετή αποφοίτησης</SectionLabel>
          <p className="text-gray-700 leading-relaxed text-center mb-10">Στο τέλος του προγράμματος υπάρχει online τελετή αποφοίτησης.</p>
          <div className="bg-white rounded-2xl p-8 mb-8">
            <p className="text-gray-700 font-medium mb-6 text-center">Είναι η στιγμή που</p>
            <div className="space-y-3 text-gray-600 text-sm max-w-md mx-auto">
              <div className="flex items-start gap-3"><span className="text-gray-300 mt-0.5">—</span><span>Κλείνεις έναν κύκλο</span></div>
              <div className="flex items-start gap-3"><span className="text-gray-300 mt-0.5">—</span><span>Βλέπεις τη μεταμόρφωση καθαρά</span></div>
              <div className="flex items-start gap-3"><span className="text-gray-300 mt-0.5">—</span><span>Αναγνωρίζεις τον νέο σου εαυτό</span></div>
              <div className="flex items-start gap-3"><span className="text-gray-300 mt-0.5">—</span><span>Μπαίνεις στην επόμενη φάση της ζωής σου</span></div>
            </div>
          </div>
          <div className="text-center space-y-2 text-gray-700">
            <p>Είναι η απόδειξη ότι ολοκλήρωσες κάτι δύσκολο.</p>
            <p className="text-lg font-semibold" style={{ fontFamily: 'Georgia, serif' }}>Και κανείς δεν μπορεί να στο πάρει.</p>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-2xl mx-auto">
          <SectionLabel>Αυτοί το έζησαν</SectionLabel>
          <Carousel images={testimonialImages} />
        </div>
      </section>

      {/* ΓΙΑ ΠΟΙΟΝ */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <SectionLabel>Για ποιον είναι</SectionLabel>
          <p className="text-gray-700 mb-8 text-center font-medium">Για σένα που</p>
          <div className="space-y-3 max-w-md mx-auto mb-10">
            {[
              'Έμαθες να είσαι το καλό παιδί',
              'Δεν λες όχι γιατί φοβάσαι την απόρριψη',
              'Νιώθεις ενοχή όταν φροντίζεις εσένα',
              'Είσαι κουρασμένος από το να κρατάς τους άλλους ευχαριστημένους',
              'Έχεις χάσει τον εαυτό σου σε ρόλους',
              'Είσαι έτοιμος να ξεμάθεις',
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-xl p-4 flex items-start gap-3">
                <svg className="w-4 h-4 flex-shrink-0 mt-1" viewBox="0 0 20 20" fill="none">
                  <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fill="#C9A96E"/>
                </svg>
                <span className="text-gray-700 text-sm">{item}</span>
              </div>
            ))}
          </div>
          <div className="text-center space-y-2 text-gray-700">
            <p>Αν αυτό σε περιγράφει</p>
            <p className="text-xl font-semibold" style={{ fontFamily: 'Georgia, serif' }}>οι 63 μέρες Ζωής είναι για εσένα.</p>
          </div>
        </div>
      </section>

      {/* ΑΠΟΦΑΣΗ */}
      <section id="apofasi" className="py-20 px-6 bg-white scroll-mt-8">
        <div className="max-w-xl mx-auto text-center">
          <SectionLabel>Η απόφαση</SectionLabel>
          <h2 className="text-3xl md:text-4xl font-semibold mb-10 leading-tight" style={{ fontFamily: 'Georgia, serif' }}>
            Έμαθες σε χρόνια.<br />
            Ξεμαθαίνεις σε 63 μέρες.
          </h2>
          <div className="text-gray-700 leading-relaxed space-y-3 mb-12">
            <p>63 μέρες δομής.</p>
            <p>Για να σταματήσεις να ζεις τη ζωή των άλλων.</p>
            <p className="text-lg font-semibold pt-2" style={{ fontFamily: 'Georgia, serif' }}>Και να ξεκινήσεις τη δική σου.</p>
          </div>
          <PricingBlock onCheckout={handleCheckout} loading={checkoutLoading} ctaLabel="Είμαι μέσα" />
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <SectionLabel>Συχνές ερωτήσεις</SectionLabel>
          <div className="space-y-3">
            {[
              { q: 'Τι γίνεται αν χάσω μία μέρα;', a: 'Συνεχίζεις κανονικά. Δεν αναπληρώνεις. Η κατεύθυνση μετράει.' },
              { q: 'Πόσο χρόνο χρειάζεται καθημερινά;', a: '1-2 λεπτά. Η μικρή πράξη νικά την υπερανάλυση.' },
              { q: 'Δεν θα νιώθω ενοχή που εστιάζω σε μένα;', a: 'Αρχικά ναι. Η ενοχή είναι το παλιό μοτίβο που αντιστέκεται. Με κάθε πράξη αδυνατίζει.' },
              { q: 'Δεν θα γίνει άλλη μία προσπάθεια που θα σταματήσω;', a: 'Όχι. Δεν βασίζεται στη θέλησή σου. Το πλαίσιο κάνει τη δουλειά.' },
              { q: 'Θα χρειαστεί να μιλήσω σε άλλους;', a: 'Όχι. Το Viber channel είναι μονόδρομο. Λαμβάνεις, δεν εκτίθεσαι.' },
              { q: 'Τι γίνεται αν χάσω την τελετή αποφοίτησης;', a: 'Θα έχεις πρόσβαση στην καταγραφή.' },
              { q: 'Θα έχω υποστήριξη σε όλη τη διάρκεια;', a: 'Ναι. Καθημερινή παρουσία στο Viber channel και εβδομαδιαία καθοδήγηση.' },
              { q: 'Πόσο δύσκολο είναι;', a: 'Μία πράξη 1-2 λεπτών τη μέρα. Το πλαίσιο κάνει τη δουλειά, όχι η θέλησή σου.' },
              { q: 'Τι ακριβώς αλλάζει σε 63 μέρες;', a: 'Σκέψη, συμπεριφορά, ταυτότητα. Βήμα βήμα, πράξη πράξη.' },
            ].map((item, i) => (
              <details key={i} className="bg-white rounded-xl px-6 group">
                <summary className="py-5 cursor-pointer flex items-center justify-between text-sm font-medium text-gray-800 hover:text-black list-none">
                  <span>{item.q}</span>
                  <span className="text-gray-400 group-open:rotate-45 transition-transform text-lg ml-4">+</span>
                </summary>
                <p className="pb-5 text-sm text-gray-600 leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-xl mx-auto text-center">
          <p className="text-2xl md:text-3xl font-semibold mb-4 leading-snug" style={{ fontFamily: 'Georgia, serif' }}>
            Έμαθες λάθος.
          </p>
          <p className="text-gray-600 mb-12">Δεν είσαι λάθος.</p>
          <PricingBlock onCheckout={handleCheckout} loading={checkoutLoading} ctaLabel="Είμαι μέσα" />
          <p className="text-xs text-gray-400 mt-10">
            Για οποιαδήποτε απορία μη διστάσεις να επικοινωνήσεις μαζί μας στο hello@withinsuccess.gr
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 px-6 bg-gray-50 border-t border-gray-100">
        <div className="max-w-6xl mx-auto flex flex-col items-center gap-4 text-center">
          <span className="text-lg font-semibold tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>WithinSuccess</span>
          <p className="text-xs text-gray-400">© 2026 WithinSuccess · Προκόπης Κούκης</p>
          <p className="text-xs text-gray-400">hello@withinsuccess.gr</p>
        </div>
      </footer>
    </main>
  )
}

export default function PaidiPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <PageContent />
    </Suspense>
  )
}