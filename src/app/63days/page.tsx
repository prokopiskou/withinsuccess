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

function PricingBlock({ onCheckout, loading, ctaLabel = 'Κατοχύρωσε τη θέση σου' }: { onCheckout: () => void; loading: boolean; ctaLabel?: string }) {
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
        {loading ? 'Φόρτωση...' : ctaLabel}
      </button>
      <p className="text-xs text-gray-400 mt-3">Περιορισμένες θέσεις. Έναρξη 12 Μαΐου.</p>
    </div>
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
      {/* HERO */}
      <section className="pt-12 pb-8 px-6 max-w-3xl mx-auto text-center">
        <p className="text-sm font-medium tracking-widest text-gray-400 uppercase mb-6">63 Μέρες της Ζωής σου</p>
        <h1 className="text-3xl md:text-5xl font-semibold leading-tight tracking-tight mb-8" style={{ fontFamily: 'Georgia, serif' }}>
          Δεν σου λείπει η θέληση.<br />Σου λείπει ένα σύστημα να σε κρατάει σε πορεία.
        </h1>
        <div className="text-lg text-gray-600 leading-relaxed space-y-4 mb-10">
          <p>Οι περισσότεροι ξεκινάνε δυνατά.</p>
          <p>Και σταματάνε αθόρυβα.</p>
          <p>Όχι γιατί δεν μπορούν.</p>
          <p>Αλλά γιατί δεν ξέρουν τι να κάνουν κάθε μέρα.</p>
          <p className="pt-4">Το 63 Μέρες Ζωής είναι ένα βιωματικό σύστημα επανασύνδεσης με τον εαυτό σου, μέσω καθημερινής δράσης σε βάζει σε ρυθμό και αλλάζει τον τρόπο που σκέφτεσαι και λειτουργείς.</p>
        </div>

        <div className="max-w-md mx-auto text-left space-y-3 mb-10">
          <p className="text-gray-700 font-medium mb-4">Για 63 μέρες:</p>
          {[
            'Ξέρεις τι πρέπει να κάνεις κάθε μέρα',
            'Ξέρεις γιατί το κάνεις',
            'Και δεν έχεις χώρο να κρυφτείς από τον εαυτό σου'
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <svg className="w-4 h-4 flex-shrink-0 mt-1" viewBox="0 0 20 20" fill="none">
                <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fill="#C9A96E"/>
              </svg>
              <span className="text-gray-600 text-sm leading-relaxed">{item}</span>
            </div>
          ))}
        </div>

        <div className="max-w-md mx-auto text-left space-y-3 mb-10">
          <p className="text-gray-700 font-medium mb-4">Σε 63 μέρες αλλάζεις:</p>
          {['Σκέψη', 'Συμπεριφορά', 'Ταυτότητα'].map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <svg className="w-4 h-4 flex-shrink-0 mt-1" viewBox="0 0 20 20" fill="none">
                <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fill="#C9A96E"/>
              </svg>
              <span className="text-gray-600 text-sm leading-relaxed">{item}</span>
            </div>
          ))}
        </div>

        <p className="text-lg font-semibold text-gray-800 mb-2" style={{ fontFamily: 'Georgia, serif' }}>Έναρξη: 12 Μαΐου</p>
        <p className="text-sm text-gray-500 mb-2">Μετά δεν υπάρχει δυνατότητα εισόδου.</p>
        <p className="text-sm text-gray-500">Δες πως λειτουργεί παρακάτω.</p>
      </section>

      {/* ΤΙ ΕΙΝΑΙ ΤΟ 63 ΜΕΡΕΣ ΖΩΗΣ */}
      <section className="py-12 px-6 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <p className="text-sm font-medium tracking-widest text-gray-400 uppercase mb-8 text-center">Τι είναι το 63 μέρες ζωής</p>
          <div className="text-gray-700 leading-relaxed space-y-4 mb-10 text-center">
            <p className="text-xl font-semibold" style={{ fontFamily: 'Georgia, serif' }}>Ένα δομημένο σύστημα 9 εβδομάδων.</p>
            <p>Με εβδομαδιαία καθοδήγηση και καθημερινή πράξη.</p>
          </div>

          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold mb-3" style={{ fontFamily: 'Georgia, serif' }}>Κάθε Κυριακή λαμβάνεις:</h3>
              <div className="space-y-2 text-gray-600 text-sm">
                <div className="flex items-start gap-3"><span className="text-gray-300 mt-0.5">—</span><span>Ηχητική καθοδήγηση για την εβδομάδα</span></div>
                <div className="flex items-start gap-3"><span className="text-gray-300 mt-0.5">—</span><span>Το προσωπικό σου Playbook (πρακτικό οδηγό με ασκήσεις)</span></div>
                <div className="flex items-start gap-3"><span className="text-gray-300 mt-0.5">—</span><span>Τη συμφωνία που κάνεις με τον εαυτό σου</span></div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3" style={{ fontFamily: 'Georgia, serif' }}>Κάθε μέρα:</h3>
              <div className="space-y-2 text-gray-600 text-sm">
                <div className="flex items-start gap-3"><span className="text-gray-300 mt-0.5">—</span><span>Λαμβάνεις μηνύματα καθοδήγησης στο ιδιωτικό Viber channel (κανάλι καθοδήγησης)</span></div>
                <div className="flex items-start gap-3"><span className="text-gray-300 mt-0.5">—</span><span>Εκτελείς μία πράξη 1–2 λεπτών που σου έχει τεθεί από πριν (απλό, πρακτικό)</span></div>
                <div className="flex items-start gap-3"><span className="text-gray-300 mt-0.5">—</span><span>Χτίζεις συνέπεια</span></div>
                <div className="flex items-start gap-3"><span className="text-gray-300 mt-0.5">—</span><span>Σπάς την υπερανάλυση</span></div>
                <div className="flex items-start gap-3"><span className="text-gray-300 mt-0.5">—</span><span>Ξαναπαίρνεις τον έλεγχο</span></div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3" style={{ fontFamily: 'Georgia, serif' }}>Κάθε εβδομάδα:</h3>
              <div className="space-y-2 text-gray-600 text-sm">
                <div className="flex items-start gap-3"><span className="text-gray-300 mt-0.5">—</span><span>Κάνεις αυτοστοχασμό</span></div>
                <div className="flex items-start gap-3"><span className="text-gray-300 mt-0.5">—</span><span>Κάνεις δομημένη αυτοαξιολόγηση</span></div>
                <div className="flex items-start gap-3"><span className="text-gray-300 mt-0.5">—</span><span>Προχωράς στο επόμενο επίπεδο</span></div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3" style={{ fontFamily: 'Georgia, serif' }}>Στο τέλος των 63 ημερών:</h3>
              <div className="space-y-2 text-gray-600 text-sm">
                <div className="flex items-start gap-3"><span className="text-gray-300 mt-0.5">—</span><span>Online τελετή αποφοίτησης</span></div>
                <div className="flex items-start gap-3"><span className="text-gray-300 mt-0.5">—</span><span>Η στιγμή που βλέπεις τη μεταμόρφωση</span></div>
              </div>
            </div>

            <div className="pt-6 space-y-2 text-gray-700 text-center">
              <p>Δεν χρειάζεται χρόνος.</p>
              <p>Δεν χρειάζεται διάθεση.</p>
              <p className="font-semibold">Χρειάζεται μία μικρή πράξη τη μέρα.</p>
            </div>

            <div className="text-center pt-4">
              <button
                onClick={handleCheckout}
                disabled={checkoutLoading}
                className="inline-block text-white px-10 py-4 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
                style={{ backgroundColor: GOLD, cursor: checkoutLoading ? 'wait' : 'pointer', opacity: checkoutLoading ? 0.6 : 1 }}
              >
                {checkoutLoading ? 'Φόρτωση...' : 'Ναι θέλω να λάβω μέρος'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ΤΟ ΕΒΔΟΜΑΔΙΑΙΟ PLAYBOOK */}
      <section className="py-12 px-6 bg-white">
        <div className="max-w-2xl mx-auto">
          <p className="text-sm font-medium tracking-widest text-gray-400 uppercase mb-8 text-center">Το εβδομαδιαίο Playbook</p>
          <div className="text-gray-700 leading-relaxed space-y-4 mb-8 text-center">
            <p className="text-xl font-semibold" style={{ fontFamily: 'Georgia, serif' }}>Ο χάρτης που σε κρατάει σταθερό για 7 ημέρες.</p>
            <p>Κάθε εβδομάδα ξεκλειδώνεις ένα νέο Playbook.</p>
            <p>Μίνιμαλ. Ξεκάθαρο. Αποτελεσματικό.</p>
          </div>

          <div>
            <p className="text-gray-700 font-medium mb-4">Μέσα περιλαμβάνει:</p>
            <div className="space-y-3 text-gray-600 text-sm">
              <div className="flex items-start gap-3"><span className="text-gray-300 mt-0.5">—</span><span><strong className="text-gray-800">Τη συμφωνία με τον εαυτό σου:</strong> 7 μέρες, 1 δέσμευση.</span></div>
              <div className="flex items-start gap-3"><span className="text-gray-300 mt-0.5">—</span><span><strong className="text-gray-800">Τους κανόνες της εβδομάδας:</strong> Καθαρή δομή → καθαρό μυαλό.</span></div>
              <div className="flex items-start gap-3"><span className="text-gray-300 mt-0.5">—</span><span><strong className="text-gray-800">7 μικρές πράξεις:</strong> 1 πράξη/μέρα (1–2 λεπτά).</span></div>
              <div className="flex items-start gap-3"><span className="text-gray-300 mt-0.5">—</span><span><strong className="text-gray-800">Αναστοχασμό:</strong> 3 ερωτήσεις που χτίζουν συνειδητότητα.</span></div>
              <div className="flex items-start gap-3"><span className="text-gray-300 mt-0.5">—</span><span><strong className="text-gray-800">Αυτοαξιολόγηση:</strong> βλέπεις τι κράτησες και τι συνεχίζεις.</span></div>
            </div>
          </div>

          <div className="mt-8 space-y-2 text-gray-700">
            <p>Κάθε Playbook είναι ένα επίπεδο.</p>
            <p>Μετά τις 63 μέρες, έχεις ολοκληρώσει και τα 9.</p>
          </div>
        </div>
      </section>

      {/* ΓΙΑΤΙ ΔΟΥΛΕΥΕΙ */}
      <section className="py-12 px-6 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <p className="text-sm font-medium tracking-widest text-gray-400 uppercase mb-8 text-center">Γιατί δουλεύει</p>
          <div className="text-gray-700 leading-relaxed space-y-3 mb-8 text-center">
            <p className="text-xl font-semibold" style={{ fontFamily: 'Georgia, serif' }}>Επειδή δεν βασίζεται στη διάθεση.</p>
            <p className="text-xl font-semibold" style={{ fontFamily: 'Georgia, serif' }}>Βασίζεται στη δράση.</p>
          </div>

          <div>
            <p className="text-gray-700 font-medium mb-4">Κάθε μικρή πράξη:</p>
            <div className="space-y-2 text-gray-600 text-sm">
              <div className="flex items-start gap-3"><span className="text-gray-300 mt-0.5">—</span><span>Μειώνει την αντίσταση</span></div>
              <div className="flex items-start gap-3"><span className="text-gray-300 mt-0.5">—</span><span>Αυξάνει την αυτοπεποίθηση</span></div>
              <div className="flex items-start gap-3"><span className="text-gray-300 mt-0.5">—</span><span>Χτίζει μια νέα ιστορία για τον εαυτό σου</span></div>
            </div>
          </div>

          <div className="mt-8 space-y-2 text-gray-700 text-center">
            <p className="text-lg font-semibold" style={{ fontFamily: 'Georgia, serif' }}>63 πράξεις = 63 αποδείξεις.</p>
            <p>Οι αποδείξεις αλλάζουν την ταυτότητα.</p>
            <p>Η ταυτότητα αλλάζει τη ζωή.</p>
          </div>

          <div className="text-center pt-8">
            <button
              onClick={handleCheckout}
              disabled={checkoutLoading}
              className="inline-block text-white px-10 py-4 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
              style={{ backgroundColor: GOLD, cursor: checkoutLoading ? 'wait' : 'pointer', opacity: checkoutLoading ? 0.6 : 1 }}
            >
              {checkoutLoading ? 'Φόρτωση...' : 'Μπαίνω στο πρόγραμμα'}
            </button>
          </div>
        </div>
      </section>

      {/* ΦΑΝΤΑΣΟΥ ΤΟΝ ΕΑΥΤΟ ΣΟΥ */}
      <section className="py-12 px-6 bg-white">
        <div className="max-w-2xl mx-auto">
          <p className="text-sm font-medium tracking-widest text-gray-400 uppercase mb-8 text-center">Φαντάσου τον εαυτό σου σε 63 μέρες</p>
          <div className="text-gray-700 leading-relaxed space-y-3 text-center">
            <p>Φαντάσου να ξυπνάς με καθαρό μυαλό.</p>
            <p>Να ξέρεις τι κάνεις κάθε μέρα – και γιατί.</p>
            <p>Να σταματήσει η υπερανάλυση.</p>
            <p>Να μπορείς να λες &ldquo;όχι&rdquo;.</p>
            <p>Να μη σε κυβερνά η γνώμη των άλλων.</p>
            <p>Να νιώθεις ξανά τον έλεγχο.</p>
            <p>Να έχεις ρυθμό.</p>
            <p>Να έχεις κατεύθυνση.</p>
            <p className="font-semibold text-lg pt-2" style={{ fontFamily: 'Georgia, serif' }}>Να έχεις εσένα.</p>
          </div>
          <p className="text-center text-gray-500 mt-8 italic">Αυτό είναι το αποτέλεσμα των 63 Μερών Ζωής.</p>
        </div>
      </section>

      {/* ΤΙ ΑΛΛΑΖΕΙ ΣΕ ΣΕΝΑ */}
      <section className="py-12 px-6 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <p className="text-sm font-medium tracking-widest text-gray-400 uppercase mb-8 text-center">Τι αλλάζει σε σένα</p>
          <p className="text-gray-700 mb-6 text-center">Μετά τις 63 μέρες:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              'Η υπερανάλυση κοπάζει',
              'Ξυπνάς με καθαρό μυαλό',
              'Λες "όχι" χωρίς ενοχές',
              'Βάζεις όρια χωρίς φόβο',
              'Η γνώμη των άλλων δεν σε ορίζει',
              'Η παρουσία σου δυναμώνει',
              'Η σχέση σου με τον εαυτό σου αλλάζει',
              'Μπορείς να ονειρευτείς ξανά',
              'Νιώθεις ότι έχεις ξανά τον έλεγχο',
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 py-2">
                <span className="text-gray-300 mt-0.5">—</span>
                <span className="text-gray-700 text-sm">{item}</span>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center space-y-2">
            <p className="text-lg font-semibold" style={{ fontFamily: 'Georgia, serif' }}>Αυτή είναι η αλλαγή ταυτότητας.</p>
            <p className="text-gray-600">Ήρεμη. Βαθιά. Σταθερή.</p>
          </div>
          <div className="text-center pt-8">
            <button
              onClick={handleCheckout}
              disabled={checkoutLoading}
              className="inline-block text-white px-10 py-4 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
              style={{ backgroundColor: GOLD, cursor: checkoutLoading ? 'wait' : 'pointer', opacity: checkoutLoading ? 0.6 : 1 }}
            >
              {checkoutLoading ? 'Φόρτωση...' : 'Ναι θέλω αυτή την αλλαγή'}
            </button>
          </div>
        </div>
      </section>

      {/* WITHIN PATH */}
      <section className="py-12 px-6 bg-white">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-sm font-medium tracking-widest text-gray-400 uppercase mb-8">The Within Path™</p>
          <div className="text-gray-700 leading-relaxed space-y-2 mb-10">
            <p>Η μέθοδος που μέχρι τώρα υπήρχε μόνο στο 1-1 coaching.</p>
            <p>Τώρα σε μορφή συστήματος.</p>
            <p className="font-semibold pt-4" style={{ fontFamily: 'Georgia, serif' }}>5 στάδια → 63 πράξεις → 1 νέα ταυτότητα.</p>
          </div>
          <div className="flex flex-col gap-4 max-w-sm mx-auto text-left">
            {[
              { stage: 'AWAKE', desc: 'Βλέπεις καθαρά.' },
              { stage: 'PAUSE', desc: 'Σταματάς το νοητικό θόρυβο.' },
              { stage: 'REMEMBER', desc: 'Επανασυνδέεσαι με αυτό που είσαι.' },
              { stage: 'ALIGN', desc: 'Ευθυγραμμίζεσαι με ό,τι έχει νόημα.' },
              { stage: 'EMBODY', desc: 'Ζεις τη νέα σου εκδοχή.' },
            ].map((item, i) => (
              <div key={i} className="flex items-baseline gap-3">
                <span className="text-xs font-semibold tracking-widest" style={{ color: GOLD, minWidth: 90 }}>{item.stage}</span>
                <span className="text-gray-600 text-sm">{item.desc}</span>
              </div>
            ))}
          </div>
          <p className="text-gray-500 text-sm mt-8 italic">Απλό. Καθαρό. Μεταμορφωτικό.</p>
        </div>
      </section>

      {/* VIBER CHANNEL */}
      <section className="py-12 px-6 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <p className="text-sm font-medium tracking-widest text-gray-400 uppercase mb-8 text-center">Viber broadcast channel</p>
          <div className="text-gray-700 leading-relaxed space-y-3 mb-8 text-center">
            <p className="text-lg font-semibold" style={{ fontFamily: 'Georgia, serif' }}>Δεν θα πορευτείς μόνος σου.</p>
            <p>Μπαίνεις σε ένα ιδιωτικό κανάλι όπου λαμβάνεις:</p>
          </div>
          <div className="space-y-2 text-gray-600 text-sm max-w-md mx-auto mb-8">
            <div className="flex items-start gap-3"><span className="text-gray-300 mt-0.5">—</span><span>Καθημερινές υπενθυμίσεις</span></div>
            <div className="flex items-start gap-3"><span className="text-gray-300 mt-0.5">—</span><span>Μικρά ηχητικά</span></div>
            <div className="flex items-start gap-3"><span className="text-gray-300 mt-0.5">—</span><span>Νοητικές άγκυρες</span></div>
            <div className="flex items-start gap-3"><span className="text-gray-300 mt-0.5">—</span><span>Καθοδήγηση για να μην βγεις από τροχιά</span></div>
          </div>
          <p className="text-center text-gray-700 font-medium mb-10">Αυτό αυξάνει τη συνέπεια ×10.</p>
          <Carousel images={broadcastImages} />
        </div>
      </section>

      {/* ΤΕΛΕΤΗ ΑΠΟΦΟΙΤΗΣΗΣ */}
      <section className="py-12 px-6 bg-white">
        <div className="max-w-2xl mx-auto">
          <p className="text-sm font-medium tracking-widest text-gray-400 uppercase mb-8 text-center">Τελετή αποφοίτησης</p>
          <div className="text-gray-700 leading-relaxed space-y-4 mb-8 text-center">
            <p>Στο τέλος του προγράμματος υπάρχει online τελετή αποφοίτησης.</p>
          </div>
          <div>
            <p className="text-gray-700 font-medium mb-4">Είναι η στιγμή που:</p>
            <div className="space-y-2 text-gray-600 text-sm">
              <div className="flex items-start gap-3"><span className="text-gray-300 mt-0.5">—</span><span>Κλείνεις έναν κύκλο</span></div>
              <div className="flex items-start gap-3"><span className="text-gray-300 mt-0.5">—</span><span>Βλέπεις τη μεταμόρφωση καθαρά</span></div>
              <div className="flex items-start gap-3"><span className="text-gray-300 mt-0.5">—</span><span>Αναγνωρίζεις τον νέο σου εαυτό</span></div>
              <div className="flex items-start gap-3"><span className="text-gray-300 mt-0.5">—</span><span>Μπαίνεις στην επόμενη φάση της ζωής σου</span></div>
            </div>
          </div>
          <div className="mt-8 space-y-2 text-gray-700">
            <p>Είναι η απόδειξη ότι ολοκλήρωσες κάτι δύσκολο.</p>
            <p className="font-semibold" style={{ fontFamily: 'Georgia, serif' }}>Και κανείς δεν μπορεί να στο πάρει.</p>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-12 px-6 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <p className="text-sm font-medium tracking-widest text-gray-400 uppercase mb-8 text-center">Αυτοί το έζησαν</p>
          <Carousel images={testimonialImages} />
        </div>
      </section>

      {/* ΓΙΑ ΠΟΙΟΝ ΕΙΝΑΙ */}
      <section className="py-12 px-6 bg-white">
        <div className="max-w-2xl mx-auto">
          <p className="text-sm font-medium tracking-widest text-gray-400 uppercase mb-8 text-center">Για ποιον είναι</p>
          <p className="text-gray-700 mb-6 text-center font-medium">Για σένα που:</p>
          <div className="space-y-2 text-gray-600 text-sm max-w-md mx-auto mb-8">
            <div className="flex items-start gap-3"><span className="text-gray-300 mt-0.5">—</span><span>Θέλεις πίσω την ψυχική ηρεμία</span></div>
            <div className="flex items-start gap-3"><span className="text-gray-300 mt-0.5">—</span><span>Θέλεις να σταματήσει η υπερανάλυση</span></div>
            <div className="flex items-start gap-3"><span className="text-gray-300 mt-0.5">—</span><span>Θέλεις να βάζεις όρια</span></div>
            <div className="flex items-start gap-3"><span className="text-gray-300 mt-0.5">—</span><span>Θέλεις πειθαρχία χωρίς πίεση</span></div>
            <div className="flex items-start gap-3"><span className="text-gray-300 mt-0.5">—</span><span>Έχεις κουραστεί να ξεκινάς και να σταματάς</span></div>
            <div className="flex items-start gap-3"><span className="text-gray-300 mt-0.5">—</span><span>Ψάχνεις μια καθαρή, σταθερή αλλαγή</span></div>
          </div>
          <div className="text-center space-y-1 text-gray-700">
            <p>Αν αυτό σε περιγράφει,</p>
            <p className="font-semibold" style={{ fontFamily: 'Georgia, serif' }}>οι 63 μέρες Ζωής είναι για εσένα.</p>
          </div>
        </div>
      </section>

      {/* Η ΑΠΟΦΑΣΗ */}
      <section className="py-12 px-6 bg-gray-50">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-3xl font-semibold mb-8" style={{ fontFamily: 'Georgia, serif' }}>Η απόφαση</h2>
          <div className="text-gray-700 leading-relaxed space-y-3 mb-10">
            <p>Το πρόγραμμα ξεκινάει στις 12 Μαΐου.</p>
            <p>Από εκεί και πέρα δεν υπάρχει δυνατότητα συμμετοχής.</p>
            <p>Οι θέσεις είναι περιορισμένες.</p>
            <p className="pt-2">Αν θέλεις να μπεις, η στιγμή είναι τώρα.</p>
            <p className="font-semibold pt-2" style={{ fontFamily: 'Georgia, serif' }}>Η αναβολή είναι η πρώτη σκέψη που πρέπει να νικήσεις.</p>
          </div>
          <PricingBlock onCheckout={handleCheckout} loading={checkoutLoading} ctaLabel="Θέλω να κατοχυρώσω τη θέση μου" />
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12 px-6 bg-white">
        <div className="max-w-2xl mx-auto">
          <p className="text-sm font-medium tracking-widest text-gray-400 uppercase mb-8 text-center">Συχνές ερωτήσεις</p>
          <div className="space-y-0">
            {[
              { q: 'Τι γίνεται αν χάσω μία μέρα;', a: 'Συνεχίζεις κανονικά. Δεν αναπληρώνεις. Η κατεύθυνση μετράει.' },
              { q: 'Πόσο χρόνο χρειάζεται καθημερινά;', a: '1-2 λεπτά. Η μικρή πράξη νικά την υπερανάλυση.' },
              { q: 'Τι γίνεται αν δεν έχω διάθεση;', a: 'Το πρόγραμμα δουλεύει χωρίς διάθεση. Οι πράξεις εκτελούνται πριν αντισταθεί το μυαλό.' },
              { q: 'Τι γίνεται αν δεν ξέρω από αυτοβελτίωση;', a: 'Δεν χρειάζεται εμπειρία. Κάθε μέρα ένα ξεκάθαρο βήμα. Τίποτα να σκέφτεσαι.' },
              { q: 'Θα χρειαστεί να μιλήσω σε άλλους;', a: 'Όχι. Το Viber channel είναι μονόδρομο. Λαμβάνεις, δεν εκτίθεσαι.' },
              { q: 'Τι γίνεται αν χάσω την τελετή αποφοίτησης;', a: 'Θα έχεις πρόσβαση στην καταγραφή.' },
              { q: 'Θα έχω υποστήριξη σε όλη τη διάρκεια;', a: 'Ναι. Καθημερινή παρουσία στο Viber channel και εβδομαδιαία καθοδήγηση.' },
              { q: 'Πόσο δύσκολο είναι;', a: 'Μία πράξη 1-2 λεπτών τη μέρα. Το πλαίσιο κάνει τη δουλειά, όχι η θέλησή σου.' },
              { q: 'Τι ακριβώς αλλάζει σε 63 μέρες;', a: 'Σκέψη, συμπεριφορά, ταυτότητα. Βήμα βήμα, πράξη πράξη.' },
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
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl font-semibold mb-8" style={{ fontFamily: 'Georgia, serif' }}>Κατοχύρωση θέσης</h2>
          <PricingBlock onCheckout={handleCheckout} loading={checkoutLoading} ctaLabel="Κατοχύρωσε τη θέση σου" />
          <p className="text-xs text-gray-400 mt-8">
            Για οποιαδήποτε απορία ή διευκρίνιση μη διστάσετε να επικοινωνήσετε μαζί μας στο hello@withinsuccess.gr
          </p>
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