"use client";
import { useState } from "react";

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

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="text-lg font-semibold tracking-tight">WithinSuccess</a>
          <a href="/assessment" className="text-sm font-medium border border-black px-4 py-2 rounded-full hover:bg-black hover:text-white transition-all">
            Ξεκίνα εδώ →
          </a>
        </div>
      </nav>

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
              <p>Είναι η δουλειά που αλλάζει τον τρόπο που βλέπεις τον εαυτό σου — και άρα τα πάντα γύρω σου.</p>
              <p>Κάθε περίοδο δέχομαι έναν συγκεκριμένο αριθμό ατόμων. Η διαδικασία ξεκινάει με ένα σύντομο ερωτηματολόγιο.</p>
            </div>
            <div className="flex flex-col gap-2 text-sm text-gray-400 border-t border-gray-800 pt-6">
              <p>✓ Βαθιά, εξατομικευμένη δουλειά</p>
              <p>✓ Πραγματική αλλαγή — όχι γενικές συμβουλές</p>
              <p>✓ Περιορισμένες θέσεις</p>
            </div>
            <a href="/assessment" className="self-start text-sm font-medium border border-white px-6 py-3 rounded-full hover:bg-white hover:text-black transition-all">
              Συμπλήρωσε το ερωτηματολόγιο →
            </a>
          </div>
          <div className="relative rounded-2xl overflow-hidden aspect-[4/5]">
            <img src="/prokopis_seminar.webp" alt="Coaching" className="w-full h-full object-cover" />
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
            2.5 ώρες. Καμία θεωρία. Μόνο αλλαγή. Κάθε seminar είναι διαφορετικό — και δεν επαναλαμβάνεται.
          </p>

          {/* Timeline οριζόντιο */}
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

          {/* Testimonials carousel */}
          <div className="mb-12">
            <p className="text-xs font-medium tracking-widest text-gray-400 uppercase mb-6">Τι λενε οσοι ηταν εκει</p>
            <div className="relative rounded-2xl overflow-hidden bg-gray-50 flex items-center justify-center" style={{minHeight: '400px'}}>
              <img
                src={`/seminar_testimonial${current + 1}.webp`}
                alt={`Testimonial ${current + 1}`}
                className="max-w-full max-h-[500px] object-contain"
              />
            </div>
            <div className="flex items-center justify-center gap-4 mt-6">
              <button onClick={prev} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:border-gray-400 hover:text-black transition-all text-sm">←</button>
              <div className="flex gap-2">
                {testimonials.map((_, i) => (
                  <button key={i} onClick={() => setCurrent(i)} className={`h-1.5 rounded-full transition-all ${current === i ? 'bg-black w-4' : 'bg-gray-300 w-1.5'}`} />
                ))}
              </div>
              <button onClick={next} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:border-gray-400 hover:text-black transition-all text-sm">→</button>
            </div>
          </div>

          <div className="text-center">
            <a href="/assessment" className="inline-block bg-black text-white px-8 py-4 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors">
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
              <p>Ανοίγει σε συγκεκριμένες περιόδους τον χρόνο — κάθε κύκλος έχει περιορισμένες θέσεις.</p>
            </div>
            <div className="flex flex-col gap-2 text-sm text-gray-400 border-t border-gray-100 pt-6">
              <p>✓ Πλήρες πρόγραμμα 30 ημερών</p>
              <p>✓ Εργαλεία & ασκήσεις καθημερινά</p>
              <p>✓ Άμεση πρόσβαση</p>
            </div>
            <a href="/30days" className="self-start bg-black text-white px-6 py-3 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors">
  Αγόρασε τώρα — 15€ →
</a>
          </div>
          <div className="relative rounded-2xl overflow-hidden aspect-[4/3]">
            <img src="/prokopis_audience.webp" alt="Program" className="w-full h-full object-cover" />
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
              <p className="text-sm text-gray-500 leading-relaxed">Επαναπροσδιορίζοντας την ισορροπία για μακροπρόθεσμη ευεξία. Workshop 90' με workbook.</p>
            </div>
            <div className="flex flex-col gap-3 p-6 border border-gray-100 rounded-2xl">
              <h3 className="font-semibold text-gray-900">Διαχείριση Χρόνου</h3>
              <p className="text-sm text-gray-500 leading-relaxed">Κάνε περισσότερα με λιγότερο άγχος. Workshop 90' με εξατομικευμένο πλάνο.</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <div className="relative rounded-2xl overflow-hidden aspect-[4/3]">
              <img src="/prokopis_workshop.webp" alt="Workshop" className="w-full h-full object-cover object-[50%_25%]" />
            </div>
            <div className="relative rounded-2xl overflow-hidden aspect-[4/3]">
              <img src="/prokopis_team.webp" alt="Team" className="w-full h-full object-cover object-[50%_25%]" />
            </div>
          </div>

          <div className="text-center">
            <p className="text-gray-500 mb-6">Ας μιλήσουμε για τις ανάγκες της ομάδας σου.</p>
            <a href="mailto:hello@withinsuccess.gr" className="inline-block bg-black text-white px-8 py-4 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors">
              Επικοινώνησε μαζί μας →
            </a>
          </div>
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