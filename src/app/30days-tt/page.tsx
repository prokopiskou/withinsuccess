'use client'

// Εκδοχή του /30days για TikTok Ads (policy-safe):
// - χωρίς ποσοστά αποτελεσμάτων
// - timeline ως «τι δουλεύουμε», όχι ως υπόσχεση αποτελέσματος
// - disclaimer μαρτυριών + «δεν αντικαθιστά ψυχολογική υποστήριξη»
// - ορατά στοιχεία πωλητή + πολιτική επιστροφής
// Το tracking είναι ίδιο με το /30days (ίδιο product id → ενιαία δεδομένα).

import { useEffect, useState } from "react";
import MetaPixel, { trackEvent } from "@/components/MetaPixel";
import { trackBeginCheckout, generateEventId, trackViewContentTikTok } from "@/lib/analytics";
import { startCheckout } from '@/lib/checkout'
import { useViewPricing, useScrollDepth } from "@/lib/hooks/useAnalyticsHooks";
import UTMCapture from '@/components/UTMCapture';
import Footer from "@/components/Footer";
import ThirtyDaysWaitlist, { useThirtyDaysClosed } from '@/components/ThirtyDaysWaitlist';
import { isThirtyDaysClosed } from '@/lib/thirtyDays';

const testimonialOrder = [5, 1, 2, 3, 4];

export default function ThirtyDaysTT() {
  const stripeLink = "https://buy.stripe.com/4gM28sdbFczj7iV00N4ZG1M";
  async function handleCheckout() {
    if (isThirtyDaysClosed()) { window.location.reload(); return }
    const eventId = generateEventId('checkout')
    trackBeginCheckout({ id: '30days-program', name: '30 Μέρες', price: 15 }, eventId)
    await startCheckout('30days', stripeLink, eventId)
  }
  const closed = useThirtyDaysClosed();
  const [current, setCurrent] = useState(0);
  const prev = () => setCurrent((c) => (c - 1 + testimonialOrder.length) % testimonialOrder.length);
  const next = () => setCurrent((c) => (c + 1) % testimonialOrder.length);

  useScrollDepth('30days-tt');
  const pricingRef = useViewPricing('30days-tt');

  useEffect(() => {
    trackEvent("ViewContent", { content_name: "30days" });
    trackViewContentTikTok({ id: '30days-program', name: '30 Μέρες', price: 15 });
  }, []);

  return (
    <main className="min-h-screen bg-white font-sans">
      <UTMCapture />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Course",
            name: "30-Day Program | WithinSuccess",
            description:
              "Ψηφιακό εκπαιδευτικό πρόγραμμα 30 ημερών μέσω email για αλλαγή νοοτροπίας και συνηθειών.",
            provider: {
              "@type": "Person",
              name: "Προκόπης Κούκης",
              url: "https://withinsuccess.gr",
            },
            offers: {
              "@type": "Offer",
              price: "15",
              priceCurrency: "EUR",
              availability: "https://schema.org/InStock",
            },
            url: "https://withinsuccess.gr/30days",
          }),
        }}
      />
      <MetaPixel />

      {/* HERO */}
      <section className="pt-16 md:pt-20 pb-16 px-6 max-w-3xl mx-auto text-center">
        <p className="text-sm font-medium tracking-widest text-gray-400 uppercase mb-6">30-Day Program</p>
        <h1 className="text-4xl md:text-6xl font-semibold leading-tight mb-8" style={{fontFamily: 'Georgia, serif'}}>
          30 μέρες.<br />Μία νέα εσωτερική ιστορία.
        </h1>
        <p className="text-xl text-gray-500 leading-relaxed mb-4 max-w-xl mx-auto">
          Κάθε μέρα ένα email με μια σημαντική αλλαγή νοοτροπίας και μία άσκηση για την πραγματική σου ζωή. 2-3 λεπτά.
        </p>
        <p className="text-lg text-gray-400 mb-12 max-w-lg mx-auto">
          Μικρές πράξεις που αλλάζουν τον τρόπο που βλέπεις τον εαυτό σου.
        </p>
        {closed ? (
          <ThirtyDaysWaitlist source="30days_hero" />
        ) : (<>
        <button type="button" onClick={handleCheckout} className="inline-block bg-black text-white px-10 py-4 rounded-full text-base font-medium hover:bg-gray-800 transition-colors cursor-pointer border-0">
          Ξεκίνα τώρα 15€ →
        </button>
        <p className="text-xs text-gray-400 mt-4">Άμεση πρόσβαση · Ψηφιακό πρόγραμμα μέσω email · Εφάπαξ πληρωμή, χωρίς συνδρομή</p>
        </>)}
      </section>

      {/* ΓΙΑ ΠΟΙΟΝ ΕΙΝΑΙ */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-medium tracking-widest text-gray-400 uppercase mb-8">Για ποιον ειναι</p>
          <div className="flex flex-col gap-4">
            {[
              "Ξέρεις τι πρέπει να κάνεις, αλλά δεν το εφαρμόζεις.",
              "Έχεις ξεκινήσει πολλές φορές. Και έχεις σταματήσει.",
              "Θέλεις αλλαγή, αλλά χωρίς θεωρίες και χωρίς υπερβολές.",
            ].map((item, i) => (
              <div key={i} className="flex gap-4 items-start p-6 bg-white rounded-2xl border border-gray-100">
                <span className="text-gray-500 font-light text-lg flex-shrink-0">{String(i + 1).padStart(2, '0')}</span>
                <p className="text-gray-700 leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ΠΩΣ ΔΟΥΛΕΥΕΙ */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-xs font-medium tracking-widest text-gray-400 uppercase mb-8">Πως δουλευει</p>
          <div className="grid grid-cols-3 gap-8">
            <div className="flex flex-col gap-2">
              <span className="text-4xl font-semibold" style={{fontFamily: 'Georgia, serif'}}>30</span>
              <p className="text-sm text-gray-500">emails, ένα κάθε μέρα</p>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-4xl font-semibold" style={{fontFamily: 'Georgia, serif'}}>1</span>
              <p className="text-sm text-gray-500">άσκηση ανά μέρα</p>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-4xl font-semibold" style={{fontFamily: 'Georgia, serif'}}>2'</span>
              <p className="text-sm text-gray-500">μόλις 2-3 λεπτά</p>
            </div>
          </div>
        </div>
      </section>

      {/* Η ΔΙΑΔΡΟΜΗ (τι δουλεύουμε, όχι υπόσχεση αποτελέσματος) */}
      <section className="py-16 px-6 bg-black text-white">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-medium tracking-widest text-gray-400 uppercase mb-8">Η διαδρομη</p>
          <div className="flex flex-col gap-8">
            {[
              { day: "Μέρα 1", text: "Η πρώτη ειλικρινής ματιά στον εαυτό σου: γιατί δεν έχεις αλλάξει μέχρι τώρα." },
              { day: "Μέρα 6", text: "Γράφεις με τα δικά σου χέρια τη φράση «Μπορώ.» και τι σημαίνει για σένα." },
              { day: "Μέρα 12", text: "Δουλεύουμε την αρνητική φωνή στο μυαλό σου και το πώς ο παλιός σου εαυτός σε τραβάει πίσω." },
              { day: "Μέρα 18", text: "Ασκήσεις δράσης: μικρά βήματα προς όσα φοβάσαι, ακόμα και όταν δεν έχεις κίνητρο." },
              { day: "Μέρα 24", text: "Κοιτάς πίσω: τι έχει αλλάξει στον τρόπο που βλέπεις τον εαυτό σου." },
              { day: "Μέρα 30", text: "Κλείνουμε με τη νέα σου ιστορία: ποιος διαλέγεις να είσαι από εδώ και πέρα." },
            ].map((item, i) => (
              <div key={i} className="flex gap-6 items-start border-b border-gray-800 pb-8 last:border-0">
                <span className="text-sm font-medium text-gray-500 flex-shrink-0 w-16">{item.day}</span>
                <p className="text-gray-300 leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ΕΒΔΟΜΑΔΕΣ */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-medium tracking-widest text-gray-400 uppercase mb-8">Προγραμμα</p>
          <div className="flex flex-col gap-4">
            {[
              { week: "Εβδομάδα 1", title: "Βλέπεις τον εχθρό σου", desc: "Αποδόμηση του παλιού εαυτού." },
              { week: "Εβδομάδα 2", title: "Αλλάζεις την ιστορία", desc: "Αυτό που λες στον εαυτό σου." },
              { week: "Εβδομάδα 3", title: "Χτίζεις δράση", desc: "Αυτοπεποίθηση και κίνηση χωρίς κίνητρο." },
              { week: "Εβδομάδα 4", title: "Η νέα σου ταυτότητα", desc: "Ποιος διαλέγεις να είσαι." },
            ].map((item, i) => (
              <div key={i} className="flex gap-6 items-start p-6 border border-gray-100 rounded-2xl">
                <span className="text-xs font-medium text-gray-500 tracking-widest flex-shrink-0 w-24">{item.week}</span>
                <div>
                  <p className="font-semibold text-gray-900 mb-1">{item.title}</p>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-medium tracking-widest text-gray-400 uppercase mb-8">Τι λενε οσοι το εκαναν</p>
          <div className="relative rounded-2xl overflow-hidden bg-white flex items-center justify-center" style={{minHeight: '400px'}}>
            <img
              src={`/program_testimonial${testimonialOrder[current]}.webp`}
              alt={`Μαρτυρία συμμετέχοντος στο πρόγραμμα 30 ημερών WithinSuccess, ${current + 1}`}
              className="max-w-full max-h-[500px] object-contain"
            />
          </div>
          <div className="flex items-center justify-center gap-4 mt-6">
            <button onClick={prev} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:border-gray-400 hover:text-black transition-all text-sm">←</button>
            <div className="flex gap-2">
              {testimonialOrder.map((_, i) => (
                <button key={i} onClick={() => setCurrent(i)} aria-label={`Μαρτυρία ${i + 1}`} className="flex items-center justify-center min-h-[24px] min-w-[24px]"><span className={`block h-1.5 rounded-full transition-all ${current === i ? 'bg-black w-4' : 'bg-gray-300 w-1.5'}`} /></button>
              ))}
            </div>
            <button onClick={next} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:border-gray-400 hover:text-black transition-all text-sm">→</button>
          </div>
          <p className="text-xs text-gray-400 text-center mt-6">Πραγματικές μαρτυρίες συμμετεχόντων. Τα αποτελέσματα διαφέρουν από άτομο σε άτομο.</p>
        </div>
      </section>

      {/* CTA ΤΕΛΙΚΟ */}
      <section ref={pricingRef} className="py-16 px-6 bg-black text-center">
        <div className="max-w-xl mx-auto">
          {closed ? (
            <ThirtyDaysWaitlist dark source="30days_final" />
          ) : (<>
          <h2 className="text-3xl md:text-4xl font-semibold mb-4 text-white" style={{fontFamily: 'Georgia, serif'}}>
            Έτοιμος να ξεκινήσεις;
          </h2>
          <p className="text-gray-400 mb-8">30 emails. 30 ασκήσεις. Μία νέα εσωτερική ιστορία.</p>
          <button type="button" onClick={handleCheckout} className="inline-block bg-white text-black px-10 py-4 rounded-full text-base font-medium hover:bg-gray-100 transition-colors cursor-pointer border-0">
            Ξεκίνα τώρα 15€ →
          </button>
          <p className="text-sm text-gray-300 mt-6 leading-relaxed">15€. Όχι για το περιεχόμενο.<br />Για να πεις «το εννοώ αυτή τη φορά.»</p>
          </>)}
        </div>
      </section>

      {/* ΔΙΑΦΑΝΕΙΑ: τι αγοράζεις, επιστροφή, πωλητής */}
      <section className="py-12 px-6 bg-gray-50">
        <div className="max-w-2xl mx-auto flex flex-col gap-4 text-sm text-gray-500 leading-relaxed">
          <p>
            <span className="font-semibold text-gray-700">Τι αγοράζεις:</span> ψηφιακό εκπαιδευτικό πρόγραμμα 30 ημερών μέσω email (30 emails, 30 ασκήσεις), με άμεση πρόσβαση. Τιμή 15€, εφάπαξ πληρωμή μέσω Stripe. Χωρίς συνδρομή.
          </p>
          <p>
            <span className="font-semibold text-gray-700">Επιστροφή χρημάτων:</span> ακύρωση εντός 48 ωρών από την αγορά με πλήρη επιστροφή, κατόπιν αιτήματος στο{' '}
            <a href="mailto:hello@withinsuccess.gr" className="underline hover:text-black">hello@withinsuccess.gr</a>. Δες τους{' '}
            <a href="/terms" className="underline hover:text-black">Όρους Χρήσης</a>.
          </p>
          <p>
            Εκπαιδευτικό πρόγραμμα αυτοβελτίωσης. Δεν αποτελεί και δεν αντικαθιστά ψυχολογική ή ιατρική υποστήριξη.
          </p>
          <p>
            <span className="font-semibold text-gray-700">Πωλητής:</span> Προκόπιος Κούκης (WithinSuccess), ατομική επιχείρηση · Ηρακλείου 4, Γλυφάδα 16675 ·{' '}
            <a href="mailto:hello@withinsuccess.gr" className="underline hover:text-black">hello@withinsuccess.gr</a> · +30 210 9627352
          </p>
        </div>
      </section>

      <Footer />

    </main>
  );
}
