export default function Home() {
  return (
    <main className="min-h-screen bg-white text-black font-sans">
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-lg font-semibold tracking-tight">WithinSuccess</span>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-500">
            <a href="#" className="hover:text-black transition-colors">Home</a>
            <a href="#" className="hover:text-black transition-colors">About</a>
            <a href="#" className="hover:text-black transition-colors">Work with me</a>
            <a href="#" className="hover:text-black transition-colors">Insights</a>
          </div>
          <a href="#assessment" className="text-sm font-medium border border-black px-4 py-2 rounded-full hover:bg-black hover:text-white transition-all">
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
            <a href="#assessment" className="self-start bg-black text-white px-8 py-4 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors">
              Ξεκίνα εδώ →
            </a>
            <div className="flex gap-8 pt-4 border-t border-gray-100">
              <div>
                <span className="text-2xl font-semibold">500+</span>
                <p className="text-xs text-gray-400 mt-1">Άτομα</p>
              </div>
              <div>
                <span className="text-2xl font-semibold">6.000+</span>
                <p className="text-xs text-gray-400 mt-1">Community</p>
              </div>
              <div>
                <span className="text-2xl font-semibold">164k</span>
                <p className="text-xs text-gray-400 mt-1">Instagram</p>
              </div>
              <div>
                <span className="text-2xl font-semibold">5+</span>
                <p className="text-xs text-gray-400 mt-1">Χρόνια</p>
              </div>
            </div>
          </div>
          <div className="relative rounded-2xl overflow-hidden aspect-[4/5]">
            <img
              src="/withinsuccess_head.webp"
              alt="Προκόπης Κούκης"
              className="w-full h-full object-cover object-[right_top]"
            />
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
            <p className="text-sm font-medium tracking-widest text-gray-400 uppercase mb-3">The Within Path™</p>
            <h2 className="text-3xl md:text-4xl font-semibold leading-tight" style={{fontFamily: 'Georgia, serif'}}>
              Η αλλαγή έχει δρόμο.
            </h2>
            <p className="text-lg text-gray-500 mt-4 max-w-xl">
              Το Within Path™ είναι η μέθοδος που έχει βοηθήσει 500+ ανθρώπους να περάσουν από τη σύγχυση στη σαφήνεια.
            </p>
          </div>
          <div className="grid md:grid-cols-5 gap-4">
            {[
              { num: '01', title: 'Awake', desc: 'Βλέπεις τι πραγματικά συμβαίνει.' },
              { num: '02', title: 'Pause', desc: 'Σταματάς τον αυτόματο πιλότο.' },
              { num: '03', title: 'Remember', desc: 'Επιστρέφεις σε αυτό που ξέρεις ήδη.' },
              { num: '04', title: 'Align', desc: 'Συγχρονίζεις σκέψη, συναίσθημα, πράξη.' },
              { num: '05', title: 'Embody', desc: 'Ζεις διαφορετικά — όχι προσπαθείς.' },
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
              <img
                src="/withinsuccess_head.webp"
                alt="Προκόπης Κούκης"
                className="w-full h-full object-cover object-[right_top]"
              />
            </div>
            <div className="flex flex-col gap-6">
              <p className="text-sm font-medium tracking-widest text-gray-400 uppercase">Ο Προκόπης Κούκης</p>
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
            <p className="text-lg text-gray-500 mt-4">
              2.5 ώρες. Καμία θεωρία. Μόνο αλλαγή.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 md:gap-8">
            <div className="relative rounded-2xl overflow-hidden aspect-[9/16]">
              <video src="/seminar1.mp4" className="w-full h-full object-cover" autoPlay muted loop playsInline />
            </div>
            <div className="relative rounded-2xl overflow-hidden aspect-[9/16]">
              <video src="/seminar2.mp4" className="w-full h-full object-cover" autoPlay muted loop playsInline />
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <p className="text-sm font-medium tracking-widest text-gray-400 uppercase mb-3">Αυτοί το έζησαν</p>
            <h2 className="text-3xl md:text-4xl font-semibold leading-tight" style={{fontFamily: 'Georgia, serif'}}>
              Πραγματικές ιστορίες.
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-4 md:gap-8 mb-16">
            <div className="relative rounded-2xl overflow-hidden aspect-[9/16]">
              <video src="/testimonial1.mp4" className="w-full h-full object-cover" autoPlay muted loop playsInline />
            </div>
            <div className="relative rounded-2xl overflow-hidden aspect-[9/16]">
              <video src="/testimonial2.mp4" className="w-full h-full object-cover" autoPlay muted loop playsInline />
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex flex-col gap-4 p-8 bg-white rounded-2xl border border-gray-100">
              <div className="flex gap-1 text-yellow-400 text-sm">★★★★★</div>
              <p className="text-gray-600 leading-relaxed text-sm">"Μετά από κάθε συνεδρία άρχισα να νιώθω δυνατή όπως παλιά. Ο Προκόπης μου έδωσε προοπτικές και λύσεις σε κάθε μου προβληματισμό. Σήμερα αισθάνομαι δυνατή, ήρεμη και μπορώ να σταθώ στα πόδια μου."</p>
              <div className="flex items-center gap-2 mt-auto">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{background: '#4285F4'}}>G</div>
                <p className="text-sm font-medium text-gray-900">Ανθούλα Ευαγγελίδη</p>
              </div>
              <p className="text-xs text-gray-400">Google Review · Local Guide</p>
            </div>
            <div className="flex flex-col gap-4 p-8 bg-white rounded-2xl border border-gray-100">
              <div className="flex gap-1 text-yellow-400 text-sm">★★★★★</div>
              <p className="text-gray-600 leading-relaxed text-sm">"Είμαι ευγνώμων με τη συνεργασία μας. Είχα κρίσεις πανικού και αγχώδη διαταραχή και ακολουθώντας το πρόγραμμα κατάφερα να επανέλθω. Οι συνεδρίες με βοήθησαν να συνειδητοποιήσω τι μου δημιουργούσε το άγχος."</p>
              <div className="flex items-center gap-2 mt-auto">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{background: '#34A853'}}>G</div>
                <p className="text-sm font-medium text-gray-900">Litsa Kafousi</p>
              </div>
              <p className="text-xs text-gray-400">Google Review</p>
            </div>
            <div className="flex flex-col gap-4 p-8 bg-white rounded-2xl border border-gray-100">
              <div className="flex gap-1 text-yellow-400 text-sm">★★★★★</div>
              <p className="text-gray-600 leading-relaxed text-sm">"Είναι ο άνθρωπος που θα εμπιστεύομαι κάθε φορά όταν θα νιώθω ότι θέλω καθοδήγηση. Κάθε συνεδρία ήτανε πολύτιμη για εμένα."</p>
              <div className="flex items-center gap-2 mt-auto">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{background: '#EA4335'}}>G</div>
                <p className="text-sm font-medium text-gray-900">Anjeza Lushaj</p>
              </div>
              <p className="text-xs text-gray-400">Google Review</p>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}