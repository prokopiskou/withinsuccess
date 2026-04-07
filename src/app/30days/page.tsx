"use client";
import { useState } from "react";

const testimonialOrder = [5, 1, 2, 3, 4];

export default function ThirtyDays() {
  const stripeLink = "https://buy.stripe.com/4gM28sdbFczj7iV00N4ZG1M";
  const [current, setCurrent] = useState(0);
  const prev = () => setCurrent((c) => (c - 1 + testimonialOrder.length) % testimonialOrder.length);
  const next = () => setCurrent((c) => (c + 1) % testimonialOrder.length);

  return (
    <main className="min-h-screen bg-white font-sans">

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="text-lg font-semibold tracking-tight">WithinSuccess</a>
          <a href={stripeLink} className="text-sm font-medium bg-black text-white px-5 py-2 rounded-full hover:bg-gray-800 transition-all">
            Αγόρασε τώρα — 15€
          </a>
        </div>
      </nav>

      {/* HERO */}
      <section className="pt-32 pb-16 px-6 max-w-3xl mx-auto text-center">
        <p className="text-sm font-medium tracking-widest text-gray-400 uppercase mb-6">30-Day Program</p>
        <h1 className="text-4xl md:text-6xl font-semibold leading-tight mb-8" style={{fontFamily: 'Georgia, serif'}}>
          30 μέρες.<br />Μία νέα εσωτερική ιστορία.
        </h1>
        <p className="text-xl text-gray-500 leading-relaxed mb-4 max-w-xl mx-auto">
          Κάθε μέρα ένα email. Μία άσκηση. 2-3 λεπτά.
        </p>
        <p className="text-lg text-gray-400 mb-12 max-w-lg mx-auto">
          Μικρές πράξεις που αλλάζουν τον τρόπο που βλέπεις τον εαυτό σου.
        </p>
        <a href={stripeLink} className="inline-block bg-black text-white px-10 py-4 rounded-full text-base font-medium hover:bg-gray-800 transition-colors">
          Ξεκίνα τώρα — 15€ →
        </a>
        <p className="text-xs text-gray-400 mt-4">Άμεση πρόσβαση. Ξεκινάς αύριο.</p>
      </section>

      {/* ΓΙΑ ΠΟΙΟΝ ΕΙΝΑΙ */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-medium tracking-widest text-gray-400 uppercase mb-8">Για ποιον ειναι</p>
          <div className="flex flex-col gap-4">
            {[
              "Ξέρεις τι πρέπει να κάνεις — αλλά δεν το εφαρμόζεις.",
              "Έχεις ξεκινήσει πολλές φορές. Και έχεις σταματήσει.",
              "Θέλεις αλλαγή — αλλά χωρίς θεωρίες και χωρίς υπερβολές.",
            ].map((item, i) => (
              <div key={i} className="flex gap-4 items-start p-6 bg-white rounded-2xl border border-gray-100">
                <span className="text-gray-300 font-light text-lg flex-shrink-0">{String(i + 1).padStart(2, '0')}</span>
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
              <p className="text-sm text-gray-500">emails — ένα κάθε μέρα</p>
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

      {/* ΠΟΥ ΘΑ ΕΙΣΑΙ */}
      <section className="py-16 px-6 bg-black text-white">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-medium tracking-widest text-gray-400 uppercase mb-8">Που θα εισαι</p>
          <div className="flex flex-col gap-8">
            {[
              { day: "Μέρα 1", text: "Θα νιώσεις την πρώτη σύγκρουση με τον εαυτό σου. Θα αναρωτηθείς γιατί δεν έχεις αλλάξει — και θα βρεις την απάντηση." },
              { day: "Μέρα 6", text: "Θα έχεις ήδη γράψει με τα ίδια σου τα χέρια «Μπορώ.»" },
              { day: "Μέρα 12", text: "Η αρνητική φωνή στο μυαλό σου θα αρχίσει να σωπαίνει. Ο παλιός σου εαυτός θα προσπαθήσει να σε τραβήξει πίσω. Αλλά αυτή τη φορά δεν θα του δώσεις χώρο." },
              { day: "Μέρα 18", text: "Θα έχεις ήδη κάνει 2 από τα 3 πράγματα που φοβόσουν. Θα μάθεις να δρας, ακόμα και όταν δεν έχεις κίνητρο." },
              { day: "Μέρα 24", text: "Θα κοιτάς πίσω και θα αναρωτιέσαι: «Ποιος ήμουν πριν ξεκινήσω;»" },
              { day: "Μέρα 30", text: "Θα φτάσεις στο τέλος. Ο παλιός σου εαυτός θα χτυπήσει την πόρτα. Αλλά αυτή τη φορά δεν θα ανοίξεις — γιατί θα ξέρεις ακριβώς ποιος είσαι." },
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
              { week: "Εβδομάδα 2", title: "Αλλάζεις την ιστορία", desc: "Αυτό που λες στον εαυτό σου — αλλάζει." },
              { week: "Εβδομάδα 3", title: "Χτίζεις δράση", desc: "Αυτοπεποίθηση και κίνηση χωρίς κίνητρο." },
              { week: "Εβδομάδα 4", title: "Γίνεσαι αυτός που δεν σταματάει", desc: "Η νέα σου ταυτότητα." },
            ].map((item, i) => (
              <div key={i} className="flex gap-6 items-start p-6 border border-gray-100 rounded-2xl">
                <span className="text-xs font-medium text-gray-300 tracking-widest flex-shrink-0 w-24">{item.week}</span>
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
              alt={`Testimonial ${current + 1}`}
              className="max-w-full max-h-[500px] object-contain"
            />
          </div>
          <div className="flex items-center justify-center gap-4 mt-6">
            <button onClick={prev} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:border-gray-400 hover:text-black transition-all text-sm">←</button>
            <div className="flex gap-2">
              {testimonialOrder.map((_, i) => (
                <button key={i} onClick={() => setCurrent(i)} className={`h-1.5 rounded-full transition-all ${current === i ? 'bg-black w-4' : 'bg-gray-300 w-1.5'}`} />
              ))}
            </div>
            <button onClick={next} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:border-gray-400 hover:text-black transition-all text-sm">→</button>
          </div>
        </div>
      </section>

      {/* ΣΤΑΤΙΣΤΙΚΑ */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-medium tracking-widest text-gray-400 uppercase mb-8">Αποτελεσματα</p>
          <div className="flex flex-col gap-6">
            {[
              { num: "87%", text: "δήλωσαν σημαντική μείωση άγχους μέσα στις πρώτες δύο εβδομάδες." },
              { num: "68%", text: "πέτυχαν τουλάχιστον έναν στόχο που ανέβαλαν για μήνες." },
              { num: "84%", text: "νιώθουν πιο συνδεδεμένοι με τον εαυτό τους στο τέλος του προγράμματος." },
            ].map((item, i) => (
              <div key={i} className="flex gap-6 items-center p-6 bg-gray-50 rounded-2xl border border-gray-100">
                <span className="text-3xl font-semibold flex-shrink-0" style={{fontFamily: 'Georgia, serif'}}>{item.num}</span>
                <p className="text-gray-500 leading-relaxed text-sm">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA ΤΕΛΙΚΟ */}
      <section className="py-16 px-6 bg-black text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-semibold mb-4 text-white" style={{fontFamily: 'Georgia, serif'}}>
            Έτοιμος να ξεκινήσεις;
          </h2>
          <p className="text-gray-400 mb-8">30 emails. 30 ασκήσεις. Μία νέα εσωτερική ιστορία.</p>
          <a href={stripeLink} className="inline-block bg-white text-black px-10 py-4 rounded-full text-base font-medium hover:bg-gray-100 transition-colors">
            Ξεκίνα τώρα — 15€ →
          </a>
          <p className="text-xs text-gray-500 mt-4">Για οποιαδήποτε απορία: hello@withinsuccess.gr</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 px-6 bg-white border-t border-gray-100">
        <div className="max-w-6xl mx-auto flex flex-col items-center gap-6 text-center">
          <span className="text-lg font-semibold tracking-tight" style={{fontFamily: 'Georgia, serif'}}>WithinSuccess</span>
          <div className="flex gap-6 text-sm text-gray-400">
            <a href="https://www.instagram.com/withinsuccess/" target="_blank" rel="noopener noreferrer" className="hover:text-black transition-colors">Instagram</a>
            <a href="https://www.youtube.com/@Prokopiskoukis" target="_blank" rel="noopener noreferrer" className="hover:text-black transition-colors">YouTube</a>
            <a href="mailto:hello@withinsuccess.gr" className="hover:text-black transition-colors">Email</a>
          </div>
          <div className="flex gap-4 text-xs text-gray-400">
            <a href="/privacy" className="hover:text-black transition-colors">Πολιτική Απορρήτου</a>
            <a href="/terms" className="hover:text-black transition-colors">Όροι Χρήσης</a>
          </div>
          <p className="text-xs text-gray-400">© 2026 WithinSuccess · Προκόπης Κούκης</p>
        </div>
      </footer>

    </main>
  );
}