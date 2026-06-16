"use client";
import { useState } from "react";
import SiteNav from "@/components/SiteNav";
import MetaPixel from "@/components/MetaPixel";
import ClosedProgramCTA from "@/components/ClosedProgramCTA";
import Footer from "@/components/Footer";

const GOLD = '#C9A96E';

const seminars = [
  { title: "Κυριάρχησε απέναντι στο μυαλό σου", dates: ["11/6/2023 · Θεσσαλονίκη", "24/9/2023 · Αθήνα"] },
  { title: "Ξύπνησε τον νικητή μέσα σου", dates: ["14/4/2024 · Κύπρος", "30/6/2024 · Αθήνα", "4/10/2024 · Θεσσαλονίκη"] },
  { title: "Η τέχνη του να μην εγκαταλείπεις", dates: ["18/9/2024 · Δήμος Ελληνικού-Αργυρούπολης"] },
  { title: "Νέο Έτος: Νέα Αρχή", dates: ["15/1/2025 · Αθήνα"] },
  { title: "Απογείωσε τη ζωή σου", dates: ["10/4/2025 · Αθήνα"] },
  { title: "Βγαίνω από το μυαλό μου, μπαίνω στη ζωή μου", dates: ["28-29/3/2026 · Αθήνα"] },
];

const testimonials = [1, 2, 3, 4, 5, 6, 7];

export default function Work() {
  const [current, setCurrent] = useState(0);
  const prev = () => setCurrent((c) => (c - 1 + testimonials.length) % testimonials.length);
  const next = () => setCurrent((c) => (c + 1) % testimonials.length);

  return (
    <main className="min-h-screen bg-white font-sans">
      <MetaPixel />

      <SiteNav active="work" ctaHref="/assessment" ctaLabel="Ξεκίνα εδώ →" />

      {/* HERO */}
      <section className="pt-32 pb-16 px-6 max-w-4xl mx-auto">
        <p className="text-sm font-medium tracking-widest text-gray-400 uppercase mb-4">Πως δουλευουμε μαζι</p>
        <h1 className="text-4xl md:text-5xl font-semibold leading-tight mb-8" style={{fontFamily: 'Georgia, serif'}}>
          Κάποιοι άνθρωποι είναι έτοιμοι για αλλαγή.
        </h1>
        <div className="flex flex-col gap-4 text-xl text-gray-500 leading-relaxed max-w-2xl">
          <p>Το νιώθουν. Το ξέρουν. Απλώς δεν έχουν βρει ακόμα τον σωστό τρόπο.</p>
          <p>Αυτούς ψάχνω.</p>
        </div>
      </section>

      {/* COACHING */}
      <section id="coaching" className="py-16 px-6 bg-black text-white">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div className="flex flex-col gap-6">
            <p className="text-xs font-medium tracking-widest text-gray-400 uppercase">1:1 Coaching</p>
            <h2 className="text-3xl md:text-4xl font-semibold leading-tight" style={{fontFamily: 'Georgia, serif'}}>
              Η πιο δυνατή επένδυση που θα κάνεις στον εαυτό σου.
            </h2>
            <div className="flex flex-col gap-3 text-gray-400 leading-relaxed">
              <p>Δεν είναι απλώς συνεδρίες.</p>
              <p>Είναι η δουλειά που αλλάζει τον τρόπο που βλέπεις τον εαυτό σου - και άρα τα πάντα γύρω σου.</p>
              <p>Κάθε περίοδο γίνεται δεκτός συγκεκριμένος αριθμός ατόμων. Η διαδικασία ξεκινάει με ένα σύντομο ερωτηματολόγιο.</p>
            </div>
            <div className="flex flex-col gap-2 text-sm text-gray-400 border-t border-gray-800 pt-6">
              <p>✓ Βαθιά, εξατομικευμένη δουλειά</p>
              <p>✓ Πραγματική αλλαγή - όχι γενικές συμβουλές</p>
              <p>✓ Περιορισμένες θέσεις</p>
            </div>
            <a href="/apply" className="self-start text-sm font-medium px-6 py-3 rounded-full hover:opacity-90 transition-opacity" style={{backgroundColor: GOLD, color: '#0D0D0D'}}>
              Συμπλήρωσε το ερωτηματολόγιο →
            </a>
          </div>
          <div className="relative rounded-2xl overflow-hidden aspect-[4/5]">
            <img src="/prokopis_seminar.webp" alt="Προκόπης Κούκης σε Live Seminar" className="w-full h-full object-cover" />
          </div>
        </div>
      </section>

      {/* WITHIN PATH */}
      <section id="within-path" className="py-16 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-medium tracking-widest text-gray-400 uppercase mb-4">The Within Path™</p>
          <h2 className="text-3xl md:text-4xl font-semibold leading-tight mb-4" style={{fontFamily: 'Georgia, serif'}}>
            Η αλλαγή δεν είναι τυχαία. Έχει δρόμο.
          </h2>
          <div className="flex flex-col gap-3 text-lg text-gray-500 leading-relaxed max-w-2xl mb-12">
            <p>Πέντε στάδια. Μία μέθοδος.</p>
            <p>Ο δρόμος που 900+ άνθρωποι ακολούθησαν για να περάσουν από τον φόβο στη δύναμη.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-12">
            {[
              { num: '01', title: 'Awake', desc: 'Βλέπεις τι πραγματικά συμβαίνει.' },
              { num: '02', title: 'Pause', desc: 'Σταματάς τον αυτόματο πιλότο.' },
              { num: '03', title: 'Remember', desc: 'Επιστρέφεις σε ό,τι ξέρεις ήδη.' },
              { num: '04', title: 'Align', desc: 'Συγχρονίζεις σκέψη και πράξη.' },
              { num: '05', title: 'Embody', desc: 'Ζεις διαφορετικά.' },
            ].map((s) => (
              <div key={s.num} className="flex flex-col gap-2 p-5 border border-gray-100 rounded-2xl">
                <span className="text-sm font-light" style={{color: GOLD}}>{s.num}</span>
                <h3 className="font-semibold text-gray-900">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center">
            <p className="text-gray-500 mb-6">Το πρώτο βήμα; Να δεις πού βρίσκεσαι τώρα.</p>
            <a href="/path" className="inline-block px-8 py-4 rounded-full text-sm font-medium hover:opacity-90 transition-opacity" style={{backgroundColor: GOLD, color: '#0D0D0D'}}>
              Δες ολόκληρο το Within Path →
            </a>
          </div>
        </div>
      </section>

      {/* 63 ΜΕΡΕΣ — κλειστός κύκλος, waitlist */}
      <section id="63days" className="py-16 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="my-12 sm:my-16">
            <p className="text-center text-xs uppercase tracking-widest text-gray-400 mb-6">
              63 Μέρες Ζωής
            </p>
            <ClosedProgramCTA source="work" />
          </div>
        </div>
      </section>

      {/* SEMINARS */}
      <section id="seminars" className="py-16 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-medium tracking-widest text-gray-400 uppercase mb-4">Live Seminars</p>
          <h2 className="text-3xl md:text-4xl font-semibold leading-tight mb-4" style={{fontFamily: 'Georgia, serif'}}>
            Βιωματικές εμπειρίες που μένουν.
          </h2>
          <p className="text-lg text-gray-500 mb-12 max-w-2xl">
            2.5 ώρες. Καμία θεωρία. Μόνο αλλαγή. Κάθε seminar είναι διαφορετικό - και δεν επαναλαμβάνεται.
          </p>
          <div className="mb-16 overflow-x-auto pb-4">
            <div className="relative" style={{minWidth: '600px'}}>
              <div className="absolute top-3 left-0 right-0 h-px bg-gray-200" />
              <div className="flex">
                {seminars.map((s, i) => (
                  <div key={i} className="flex flex-col items-start gap-3 pr-8 relative flex-1">
                    <div className="w-6 h-6 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center z-10 flex-shrink-0">
                      <div className="w-2 h-2 rounded-full bg-gray-400" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="text-xs font-medium text-gray-900 leading-snug">{s.title}</p>
                      <div className="flex flex-col gap-0.5">
                        {s.dates.map((d, j) => (
                          <span key={j} className="text-xs text-gray-400">{d}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="mb-12">
            <p className="text-xs font-medium tracking-widest text-gray-400 uppercase mb-6">Τι λενε οσοι ηταν εκει</p>
            <div className="relative rounded-2xl overflow-hidden bg-gray-50 flex items-center justify-center" style={{minHeight: '400px'}}>
              <img src={`/seminar_testimonial${current + 1}.webp`} alt={`Μαρτυρία συμμετέχοντος σε σεμινάριο WithinSuccess — ${current + 1}`} className="max-w-full max-h-[500px] object-contain" />
            </div>
            <div className="flex items-center justify-center gap-4 mt-6">
              <button onClick={prev} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:border-gray-400 hover:text-black transition-all text-sm">←</button>
              <div className="flex gap-2">
                {testimonials.map((_, i) => (
                  <button key={i} onClick={() => setCurrent(i)} aria-label={`Μαρτυρία ${i + 1}`} className="flex items-center justify-center min-h-[24px] min-w-[24px]"><span className={`block h-1.5 rounded-full transition-all ${current === i ? 'bg-black w-4' : 'bg-gray-300 w-1.5'}`} /></button>
                ))}
              </div>
              <button onClick={next} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:border-gray-400 hover:text-black transition-all text-sm">→</button>
            </div>
          </div>
          <div className="text-center">
            <a href="/waitlist" className="inline-block text-black px-8 py-4 rounded-full text-sm font-medium hover:opacity-90 transition-opacity" style={{backgroundColor: GOLD}}>
              Μπες στη λίστα αναμονής →
            </a>
          </div>
        </div>
      </section>

      {/* 30-DAY PROGRAMS */}
      <section id="programs" className="py-16 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <p className="text-xs font-medium tracking-widest text-gray-400 uppercase">30-Day Program</p>
              <span className="flex items-center gap-1.5 bg-green-50 text-green-600 text-xs font-medium px-3 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block"></span>
                Ανοιχτό τώρα
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-semibold leading-tight" style={{fontFamily: 'Georgia, serif'}}>
              30 μέρες που αλλάζουν τη βάση.
            </h2>
            <div className="flex flex-col gap-3 text-gray-500 leading-relaxed">
              <p>Ένα δομημένο πρόγραμμα 30 ημερών. Βήμα βήμα, με εργαλεία και καθοδήγηση.</p>
              <p>Ανοίγει σε συγκεκριμένες περιόδους τον χρόνο - κάθε κύκλος έχει περιορισμένες θέσεις.</p>
            </div>
            <div className="flex flex-col gap-2 text-sm text-gray-400 border-t border-gray-100 pt-6">
              <p>✓ Πλήρες πρόγραμμα 30 ημερών</p>
              <p>✓ Εργαλεία & ασκήσεις καθημερινά</p>
              <p>✓ Άμεση πρόσβαση</p>
            </div>
            <a href="/30days" className="self-start px-6 py-3 rounded-full text-sm font-medium hover:opacity-90 transition-opacity" style={{backgroundColor: GOLD, color: '#0D0D0D'}}>
              Κατοχύρωσε τώρα - 15€ →
            </a>
          </div>
          <div className="relative rounded-2xl overflow-hidden aspect-[4/3]">
            <img src="/prokopis_audience.webp" alt="Κοινό σεμιναρίου WithinSuccess Αθήνα" className="w-full h-full object-cover" />
          </div>
        </div>
      </section>

      {/* ΕΤΑΙΡΕΙΕΣ */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-medium tracking-widest text-gray-400 uppercase mb-4">Για Οργανισμους & Εταιρειες</p>
          <h2 className="text-3xl md:text-4xl font-semibold leading-tight mb-4" style={{fontFamily: 'Georgia, serif'}}>
            Ενδυνάμωσε την ομάδα σου.
          </h2>
          <p className="text-lg text-gray-500 mb-12 max-w-2xl">
            Βιωματικά προγράμματα εσωτερικής ισορροπίας, σύνδεσης και ψυχικής ανθεκτικότητας για εργαζόμενους και στελέχη. Κάθε πρόγραμμα σχεδιάζεται εξατομικευμένα για τις ανάγκες του οργανισμού σου.
          </p>
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="flex flex-col gap-3 p-6 border border-gray-100 rounded-2xl">
              <h3 className="font-semibold text-gray-900">Διαχείριση Άγχους</h3>
              <p className="text-sm text-gray-500 leading-relaxed">Εργαλεία ανθεκτικότητας για την καθημερινή πίεση. Workshop 90' με βιωματικές ασκήσεις.</p>
            </div>
            <div className="flex flex-col gap-3 p-6 border border-gray-100 rounded-2xl">
              <h3 className="font-semibold text-gray-900">Ισορροπία Ζωής & Εργασίας</h3>
              <p className="text-sm text-gray-500 leading-relaxed">Επαναπροσδιορισμός ισορροπίας για μακροπρόθεσμη ευεξία. Workshop 90' με τετράδιο εργασίας.</p>
            </div>
            <div className="flex flex-col gap-3 p-6 border border-gray-100 rounded-2xl">
              <h3 className="font-semibold text-gray-900">Διαχείριση Χρόνου</h3>
              <p className="text-sm text-gray-500 leading-relaxed">Κάνε περισσότερα με λιγότερο άγχος. Workshop 90' με εξατομικευμένο πλάνο.</p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <div className="relative rounded-2xl overflow-hidden aspect-[4/3]">
              <img src="/prokopis_workshop.webp" alt="Βιωματικό Workshop WithinSuccess" className="w-full h-full object-cover object-[50%_25%]" />
            </div>
            <div className="relative rounded-2xl overflow-hidden aspect-[4/3]">
              <img src="/prokopis_team.webp" alt="Team WithinSuccess" className="w-full h-full object-cover object-[50%_25%]" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-gray-500 mb-6">Ας μιλήσουμε για τις ανάγκες της ομάδας σου.</p>
            <a href="/corporate" className="inline-block bg-black text-white px-8 py-4 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors">
              Δες τις συνεργασίες →
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <Footer />

    </main>
  );
}