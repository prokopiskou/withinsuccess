"use client";
import { useState, useEffect, useRef } from "react";

const SEMINAR1 = "https://lfexi0dp6vzacawb.public.blob.vercel-storage.com/seminar1.mp4";
const SEMINAR2 = "https://lfexi0dp6vzacawb.public.blob.vercel-storage.com/seminar2.mp4";
const TESTIMONIAL1 = "https://lfexi0dp6vzacawb.public.blob.vercel-storage.com/testimonial1.MP4";
const TESTIMONIAL2 = "https://lfexi0dp6vzacawb.public.blob.vercel-storage.com/testimonial2.MP4";

const reviews = [
  {
    text: "Όλα ξεκίνησαν πριν 3 χρόνια που έπαθα την πρώτη κρίση πανικού. Σταδιακά άρχισα να μην μπορώ να διαχειριστώ καμία κατάσταση. Μετά από κάθε συνεδρία άρχισα να νιώθω δυνατή όπως παλιά. Σήμερα αισθάνομαι δυνατή, ήρεμη και μπορώ να σταθώ στα πόδια μου.",
    name: "Ανθούλα Ευαγγελίδη",
    sub: "Google Review · Local Guide",
    color: "#4285F4",
  },
  {
    text: "Είμαι ευγνώμων με τη συνεργασία μας. Συνιστώ ανεπιφύλακτα το πρόγραμμα των 30 ημερών. Είχα κρίσεις πανικού και αγχώδη διαταραχή και ακολουθώντας το πρόγραμμα κατάφερα να επανέλθω. Οι συνεδρίες με βοήθησαν να συνειδητοποιήσω τι μου δημιουργούσε το άγχος.",
    name: "Litsa Kafousi",
    sub: "Google Review",
    color: "#34A853",
  },
  {
    text: "Είναι ο άνθρωπος που θα εμπιστεύομαι κάθε φορά όταν θα νιώθω ότι θέλω καθοδήγηση. Κάθε συνεδρία ήτανε πολύτιμη για εμένα.",
    name: "Anjeza Lushaj",
    sub: "Google Review",
    color: "#EA4335",
  },
  {
    text: "Ο Προκόπης με βοήθησε πραγματικά σε μια δύσκολη περίοδο. Είναι άνθρωπος που ακούει, καταλαβαίνει και σε στηρίζει με ουσιαστικό τρόπο. Ειλικρινής, υποστηρικτικός και ανθρώπινος.",
    name: "Alexandros Neofytos",
    sub: "Google Review",
    color: "#FBBC05",
  },
  {
    text: "Μέσα σε 3 μήνες με τη βοήθεια του Προκόπη και σίγουρα με προσωπική σκληρή δουλειά άλλαξα συνήθειες και μοτίβα που με πήγαιναν πίσω στη ζωή μου επί χρόνια. Με την καθοδήγησή του δεν έχεις να χάσεις τίποτα παρά μόνο να κερδίσεις.",
    name: "Λεάνα Μπάκι",
    sub: "Google Review",
    color: "#4285F4",
  },
  {
    text: "Ανακάλυψα τον Προκόπη μέσω Instagram και από τότε παρακολούθησα σεμινάρια και ατομικές συνεδρίες. Κάθε φορά θέτουμε στόχους και πραγματικά βλέπω εξέλιξη. Μεταδίδει φοβερή ενέργεια, είναι αυθεντικός και τον προτείνω ανεπιφύλακτα!",
    name: "Αναστασία Λεωνιδοπούλου",
    sub: "Google Review · Local Guide",
    color: "#34A853",
  },
  {
    text: "Δεν είναι απλώς coach, είναι άνθρωπος που σε βλέπει, σε ακούει και σε βοηθά να θυμηθείς ποιος πραγματικά είσαι. Κάθε συζήτηση μαζί του αφήνει καθαρότητα, ηρεμία και πίστη ότι μπορείς να αλλάξεις ό,τι σε βαραίνει.",
    name: "Alexandra Skouria",
    sub: "Google Review · Local Guide",
    color: "#EA4335",
  },
  {
    text: "Εύστοχος, βαθιά ενημερωμένος και ικανός καθοδηγητής στο σωστό τρόπο σκέψης. Άψογος ακροατής που σε βοηθά να ξεδιπλώνεις πτυχές του χαρακτήρα σου και της ζωής σου με άνεση. Κάθε συνάντηση μαζί του είναι μοναδική.",
    name: "N V",
    sub: "Google Review",
    color: "#FBBC05",
  },
  {
    text: "Με τον Προκόπη ξεκινήσαμε συνεδρίες με σκοπό ουσιαστικά να ξαναβρώ τον εαυτό μου. Ήταν το καλύτερο δώρο που έκανα στον εαυτό μου. Κατάφερα να νικήσω φόβους και να γίνω πιο δραστήριος και χαρούμενος. Ο Προκόπης θα σου δώσει όλα τα εφόδια για να φτάσεις στον στόχο σου.",
    name: "Nikos D",
    sub: "Google Review",
    color: "#4285F4",
  },
  {
    text: "Πραγματικά εξαιρετική εμπειρία. Αυτό το πρόγραμμα σε βοηθάει να χτίσεις συνήθειες βήμα βήμα και με μέθοδο, προκειμένου να επιτύχεις πράγματα που προηγουμένως φάνταζαν αρκετά δύσκολα. Αυτό το πρόγραμμα μπορεί πραγματικά να σε αλλάξει.",
    name: "Νίκος Ολύμπιος",
    sub: "Google Review",
    color: "#34A853",
  },
];

export default function Home() {
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 3) % reviews.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const prev = () => setCurrent((c) => (c - 3 + reviews.length) % reviews.length);
  const next = () => setCurrent((c) => (c + 3) % reviews.length);
  const prevOne = () => setCurrent((c) => (c - 1 + reviews.length) % reviews.length);
  const nextOne = () => setCurrent((c) => (c + 1) % reviews.length);

  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.changedTouches[0].screenX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].screenX;
    if (touchStartX.current - touchEndX.current > 50) nextOne();
    if (touchEndX.current - touchStartX.current > 50) prevOne();
  };

  const visible = [
    reviews[current % reviews.length],
    reviews[(current + 1) % reviews.length],
    reviews[(current + 2) % reviews.length],
  ];

  return (
    <main className="min-h-screen bg-white text-black font-sans">

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-lg font-semibold tracking-tight">WithinSuccess</span>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-500">
            <a href="/about" className="hover:text-black transition-colors">About</a>
            <a href="/work" className="hover:text-black transition-colors">Work with me</a>
            <a href="/insights" className="hover:text-black transition-colors">Insights</a>
          </div>
          <a href="/assessment" className="text-sm font-medium border border-black px-4 py-2 rounded-full hover:bg-black hover:text-white transition-all">
            Ξεκίνα εδώ →
          </a>
        </div>
      </nav>

      {/* HERO */}
      <section className="pt-32 pb-16 px-6 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div className="flex flex-col gap-8">
            <h1 className="text-4xl md:text-5xl font-semibold leading-tight tracking-tight" style={{fontFamily: 'Georgia, serif'}}>
              Η ζωή αλλάζει όταν αλλάξει η εσωτερική ιστορία.
            </h1>
            <p className="text-lg text-gray-500 leading-relaxed">
              Δεν είσαι χαμένη. Απλώς κάποιος δεν σου είπε ποτέ ότι η ιστορία που λες στον εαυτό σου — μπορεί να αλλάξει.
            </p>
            <a href="/assessment" className="self-start bg-black text-white px-8 py-4 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors">
              Ξεκίνα εδώ →
            </a>
            <div className="flex gap-8 pt-4 border-t border-gray-100">
              <div><span className="text-2xl font-semibold">900+</span><p className="text-xs text-gray-400 mt-1">Ατομα</p></div>
              <div><span className="text-2xl font-semibold">9.000+</span><p className="text-xs text-gray-400 mt-1">Community</p></div>
              <div><span className="text-2xl font-semibold">173k</span><p className="text-xs text-gray-400 mt-1">Instagram</p></div>
              <div><span className="text-2xl font-semibold">7+</span><p className="text-xs text-gray-400 mt-1">Χρονια</p></div>
            </div>
          </div>
          <div className="relative rounded-2xl overflow-hidden aspect-[4/5]">
            <img src="/withinsuccess_head.webp" alt="Προκόπης Κούκης" className="w-full h-full object-cover object-center" />
          </div>
        </div>
      </section>

      {/* THE PROBLEM */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-semibold leading-tight mb-12" style={{fontFamily: 'Georgia, serif'}}>
            Κάτι δεν κολλάει.<br />Και το ξέρεις.
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex flex-col gap-4 p-8 bg-white rounded-2xl border border-gray-100">
              <span className="text-2xl font-light text-gray-200">01</span>
              <h3 className="text-lg font-semibold">Νιώθεις χαμένη</h3>
              <p className="text-gray-500 leading-relaxed">Ξέρεις ότι κάτι πρέπει να αλλάξει — αλλά δεν ξέρεις από πού να αρχίσεις.</p>
            </div>
            <div className="flex flex-col gap-4 p-8 bg-white rounded-2xl border border-gray-100">
              <span className="text-2xl font-light text-gray-200">02</span>
              <h3 className="text-lg font-semibold">Έχεις προσπαθήσει</h3>
              <p className="text-gray-500 leading-relaxed">Έχεις διαβάσει. Ακούσει. Δοκιμάσει. Και πάλι κάτι σε κρατάει στη θέση σου.</p>
            </div>
            <div className="flex flex-col gap-4 p-8 bg-white rounded-2xl border border-gray-100">
              <span className="text-2xl font-light text-gray-200">03</span>
              <h3 className="text-lg font-semibold">Δεν είναι το έξω</h3>
              <p className="text-gray-500 leading-relaxed">Δεν σου λείπει η θέληση. Σου λείπει η σωστή εσωτερική βάση.</p>
            </div>
          </div>
        </div>
      </section>

      {/* WITHIN PATH */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <p className="text-sm font-medium tracking-widest text-gray-400 uppercase mb-3">The Within Path</p>
            <h2 className="text-3xl md:text-4xl font-semibold leading-tight" style={{fontFamily: 'Georgia, serif'}}>
              Η αλλαγή έχει δρόμο.
            </h2>
            <p className="text-lg text-gray-500 mt-4 max-w-xl">
              Το Within Path™ είναι η μέθοδος που έχει βοηθήσει 900+ ανθρώπους να περάσουν από το φόβο στη δύναμη.
            </p>
          </div>
          <div className="grid md:grid-cols-5 gap-4">
            {[
              { num: '01', title: 'Awake', desc: 'Βλέπεις τι πραγματικά συμβαίνει.' },
              { num: '02', title: 'Pause', desc: 'Σταματάς τον αυτόματο πιλότο.' },
              { num: '03', title: 'Remember', desc: 'Επιστρέφεις σε αυτό που ξέρεις ήδη.' },
              { num: '04', title: 'Align', desc: 'Συγχρονίζεις σκέψη, συναίσθημα, πράξη.' },
              { num: '05', title: 'Embody', desc: 'Ζεις διαφορετικά.' },
            ].map((step) => (
              <div key={step.num} className="flex flex-col gap-3 p-6 border border-gray-100 rounded-2xl hover:border-gray-300 transition-colors">
                <span className="text-xs font-medium text-gray-300 tracking-widest">{step.num}</span>
                <h3 className="text-lg font-semibold" style={{fontFamily: 'Georgia, serif'}}>{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT TEASER */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="relative rounded-2xl overflow-hidden aspect-[4/5]">
              <img src="/prokopis_about.webp" alt="Προκόπης Κούκης" className="w-full h-full object-cover object-[right_top]" />
            </div>
            <div className="flex flex-col gap-6">
              <p className="text-sm font-medium tracking-widest text-gray-400 uppercase">Ο Προκοπης Κουκης</p>
              <h2 className="text-3xl md:text-4xl font-semibold leading-tight" style={{fontFamily: 'Georgia, serif'}}>
                Δεν το επέλεξα.
              </h2>
              <div className="flex flex-col gap-3 text-lg text-gray-500 leading-relaxed">
                <p>Κάποια στιγμή με χρειάστηκε ένας δικός μου άνθρωπος.</p>
                <p>Έπρεπε να βρω τον τρόπο να βοηθήσω.</p>
                <p>Και δεν σταμάτησα από τότε.</p>
              </div>
              <a href="/about" className="self-start text-sm font-medium border border-black px-6 py-3 rounded-full hover:bg-black hover:text-white transition-all">
                Μάθε περισσότερα →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* SEMINAR */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <p className="text-sm font-medium tracking-widest text-gray-400 uppercase mb-3">Live Experience</p>
            <h2 className="text-3xl md:text-4xl font-semibold leading-tight" style={{fontFamily: 'Georgia, serif'}}>
              Δες τι συμβαίνει σε ένα seminar.
            </h2>
            <p className="text-lg text-gray-500 mt-4">2.5 ώρες. Καμία θεωρία. Μόνο αλλαγή.</p>
          </div>
          <div className="grid grid-cols-2 gap-4 md:gap-8">
            <div className="relative rounded-2xl overflow-hidden aspect-[9/16]">
              <video src={SEMINAR1} className="w-full h-full object-cover" autoPlay muted loop playsInline preload="none" />
            </div>
            <div className="relative rounded-2xl overflow-hidden aspect-[9/16]">
              <video src={SEMINAR2} className="w-full h-full object-cover" autoPlay muted loop playsInline preload="none" />
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <p className="text-sm font-medium tracking-widest text-gray-400 uppercase mb-3">Αυτοι το εζησαν</p>
            <h2 className="text-3xl md:text-4xl font-semibold leading-tight" style={{fontFamily: 'Georgia, serif'}}>
              Πραγματικές ιστορίες.
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-4 md:gap-8 mb-16">
            <div className="relative rounded-2xl overflow-hidden aspect-[9/16]">
              <video src={TESTIMONIAL1} className="w-full h-full object-cover" autoPlay muted loop playsInline preload="none" />
            </div>
            <div className="relative rounded-2xl overflow-hidden aspect-[9/16]">
              <video src={TESTIMONIAL2} className="w-full h-full object-cover" autoPlay muted loop playsInline preload="none" />
            </div>
          </div>

          <div className="hidden md:grid md:grid-cols-3 gap-8">
            {visible.map((review, i) => (
              <div key={i} className="flex flex-col gap-4 p-8 bg-white rounded-2xl border border-gray-100">
                <div className="flex gap-1 text-yellow-400 text-sm">★★★★★</div>
                <p className="text-gray-600 leading-relaxed text-sm">"{review.text}"</p>
                <div className="flex items-center gap-2 mt-auto">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{background: review.color}}>G</div>
                  <p className="text-sm font-medium text-gray-900">{review.name}</p>
                </div>
                <p className="text-xs text-gray-400">{review.sub}</p>
              </div>
            ))}
          </div>

          <div className="md:hidden" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
            <div className="flex flex-col gap-4 p-8 bg-white rounded-2xl border border-gray-100">
              <div className="flex gap-1 text-yellow-400 text-sm">★★★★★</div>
              <p className="text-gray-600 leading-relaxed text-sm">"{reviews[current].text}"</p>
              <div className="flex items-center gap-2 mt-auto">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{background: reviews[current].color}}>G</div>
                <p className="text-sm font-medium text-gray-900">{reviews[current].name}</p>
              </div>
              <p className="text-xs text-gray-400">{reviews[current].sub}</p>
            </div>
            <p className="text-center text-xs text-gray-300 mt-3">← σύρε για περισσότερα →</p>
          </div>

          <div className="flex items-center justify-center gap-4 mt-8">
            <button onClick={prev} className="hidden md:flex w-8 h-8 rounded-full border border-gray-200 items-center justify-center text-gray-400 hover:border-gray-400 hover:text-black transition-all text-sm">←</button>
            <div className="flex gap-2">
              {reviews.map((_, i) => (
                <button key={i} onClick={() => setCurrent(i)} className={`h-1.5 rounded-full transition-all ${current === i ? 'bg-black w-4' : 'bg-gray-300 w-1.5'}`} />
              ))}
            </div>
            <button onClick={next} className="hidden md:flex w-8 h-8 rounded-full border border-gray-200 items-center justify-center text-gray-400 hover:border-gray-400 hover:text-black transition-all text-sm">→</button>
          </div>
        </div>
      </section>

      {/* HOW I WORK */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <p className="text-sm font-medium tracking-widest text-gray-400 uppercase mb-3">Πως δουλευουμε μαζι</p>
            <h2 className="text-3xl md:text-4xl font-semibold leading-tight" style={{fontFamily: 'Georgia, serif'}}>
              Διάλεξε το επόμενο βήμα σου.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex flex-col gap-4 p-8 border border-gray-100 rounded-2xl hover:border-gray-300 transition-colors">
              <span className="text-xs font-medium tracking-widest text-gray-300 uppercase">Coaching</span>
              <h3 className="text-xl font-semibold" style={{fontFamily: 'Georgia, serif'}}>1:1 Συνεδρίες</h3>
              <p className="text-gray-500 leading-relaxed text-sm">Βαθιά, εξατομικευμένη δουλειά. Για όσους θέλουν πραγματική μεταμόρφωση — όχι γενικές συμβουλές.</p>
              <a href="/work#coaching" className="mt-auto self-start text-sm font-medium border border-black px-5 py-2.5 rounded-full hover:bg-black hover:text-white transition-all">Ξεκίνα →</a>
            </div>
            <div className="flex flex-col gap-4 p-8 bg-black text-white rounded-2xl">
              <span className="text-xs font-medium tracking-widest text-gray-400 uppercase">Seminars</span>
              <h3 className="text-xl font-semibold" style={{fontFamily: 'Georgia, serif'}}>Live Εμπειρίες</h3>
              <p className="text-gray-400 leading-relaxed text-sm">2.5 ώρες βιωματικής αλλαγής. Όχι διαλέξεις — εμπειρίες που μένουν.</p>
              <a href="/work#seminars" className="mt-auto self-start text-sm font-medium border border-white px-5 py-2.5 rounded-full hover:bg-white hover:text-black transition-all">Δες τα seminars →</a>
            </div>
            <div className="flex flex-col gap-4 p-8 border border-gray-100 rounded-2xl hover:border-gray-300 transition-colors">
              <span className="text-xs font-medium tracking-widest text-gray-300 uppercase">Programs</span>
              <h3 className="text-xl font-semibold" style={{fontFamily: 'Georgia, serif'}}>30-Day Programs</h3>
              <p className="text-gray-500 leading-relaxed text-sm">Δομημένα digital programs. Βήμα βήμα αλλαγή — με εργαλεία, δομή και καθοδήγηση.</p>
              <a href="/30days" className="mt-auto self-start text-sm font-medium border border-black px-5 py-2.5 rounded-full hover:bg-black hover:text-white transition-all">Δες τα programs →</a>
            </div>
          </div>
        </div>
      </section>

      {/* EMAIL OPT-IN */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-sm font-medium tracking-widest text-gray-400 uppercase mb-4">Within Assessment</p>
          <h2 className="text-3xl md:text-4xl font-semibold leading-tight mb-4" style={{fontFamily: 'Georgia, serif'}}>
            Ανακάλυψε σε ποιο στάδιο βρίσκεσαι.
          </h2>
          <p className="text-lg text-gray-500 mb-8">
            Κάνε το Within Assessment — δωρεάν. 3 λεπτά. Αποτέλεσμα που σου λέει ακριβώς πού είσαι και ποιο είναι το επόμενο βήμα.
          </p>
          <a href="/assessment" className="inline-block bg-black text-white px-8 py-4 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors">
            Κάνε το assessment →
          </a>
          <p className="text-xs text-gray-400 mt-4">9.000+ άνθρωποι που επέλεξαν την αλλαγή.</p>
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