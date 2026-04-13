export default function Philosophy() {
  return (
    <main className="min-h-screen bg-white font-sans">

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="text-lg font-semibold tracking-tight">WithinSuccess</a>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-500">
            <a href="/about" className="hover:text-black transition-colors">About</a>
            <a href="/work" className="hover:text-black transition-colors">Work with me</a>
            <a href="/corporate" className="hover:text-black transition-colors">Corporate</a>
            <a href="/insights" className="hover:text-black transition-colors">Insights</a>
          </div>
          <a href="/assessment" className="text-sm font-medium border border-black px-4 py-2 rounded-full hover:bg-black hover:text-white transition-all">
            Ξεκίνα εδώ →
          </a>
        </div>
      </nav>

      {/* HERO */}
      <section className="pt-32 pb-16 px-6 max-w-2xl mx-auto">
        <p className="text-sm font-medium tracking-widest text-gray-400 uppercase mb-8">Φιλοσοφια</p>
        <h1 className="text-4xl md:text-5xl font-semibold leading-tight mb-12" style={{fontFamily: 'Georgia, serif'}}>
          Αυτά πιστεύω.
        </h1>
        <div className="flex flex-col gap-6 text-xl text-gray-500 leading-relaxed">
          <p>Όχι τι πουλάω.</p>
          <p>Όχι τι ακούς παντού.</p>
          <p>Αυτά που πιστεύω πραγματικά - και που πολλοί δεν θα συμφωνούσαν.</p>
        </div>
      </section>

      {/* BELIEF 1 */}
      <section className="py-16 px-6 border-t border-gray-100">
        <div className="max-w-2xl mx-auto flex flex-col gap-6">
          <span className="text-xs font-medium tracking-widest text-gray-300 uppercase">01</span>
          <h2 className="text-2xl md:text-3xl font-semibold leading-tight" style={{fontFamily: 'Georgia, serif'}}>
            Οι τεχνικές είναι ψευδαίσθηση ελέγχου.
          </h2>
          <div className="flex flex-col gap-4 text-gray-500 leading-relaxed">
            <p>Οι περισσότεροι coaches σου διδάσκουν τεχνικές. Πώς να κάνεις αυτό. Πώς να κάνεις εκείνο.</p>
            <p>Η πραγματική αλλαγή δεν πηγάζει από τεχνικές. Πηγάζει από το να αλλάξει η συναισθηματική σου κατάσταση.</p>
            <p>Και η κατάσταση δεν αλλάζει με βήματα. Αλλάζει όταν αλλάξει η εσωτερική ιστορία.</p>
          </div>
        </div>
      </section>

      {/* BELIEF 2 */}
      <section className="py-16 px-6 border-t border-gray-100 bg-gray-50">
        <div className="max-w-2xl mx-auto flex flex-col gap-6">
          <span className="text-xs font-medium tracking-widest text-gray-300 uppercase">02</span>
          <h2 className="text-2xl md:text-3xl font-semibold leading-tight" style={{fontFamily: 'Georgia, serif'}}>
            Δεν σε μαθαίνω κάτι. Σου δείχνω κάτι που ήδη ξέρεις.
          </h2>
          <div className="flex flex-col gap-4 text-gray-500 leading-relaxed">
            <p>Δεν έχεις πρόβλημα γνώσης. Έχεις πρόβλημα σύνδεσης με αυτό που ήδη ξέρεις.</p>
            <p>Μέσα σου υπάρχει ο άνθρωπος που θέλεις να γίνεις. Απλώς κάποιοι μηχανισμοί τον κρύβουν.</p>
            <p>Η δουλειά μου δεν είναι να σου προσθέσω κάτι. Είναι να αφαιρέσω αυτό που δεν είσαι εσύ.</p>
          </div>
        </div>
      </section>

      {/* BELIEF 3 */}
      <section className="py-16 px-6 border-t border-gray-100">
        <div className="max-w-2xl mx-auto flex flex-col gap-6">
          <span className="text-xs font-medium tracking-widest text-gray-300 uppercase">03</span>
          <h2 className="text-2xl md:text-3xl font-semibold leading-tight" style={{fontFamily: 'Georgia, serif'}}>
            Έχεις δύο εαυτούς. Και ξέρεις ποιος είναι ποιος.
          </h2>
          <div className="flex flex-col gap-4 text-gray-500 leading-relaxed">
            <p>Ο κατώτερος εαυτός εμφανίζεται όταν φοβάσαι. Επιτίθεται, αποσύρεται, λέει πράγματα που δεν εννοεί.</p>
            <p>Ο αληθινός εαυτός δεν φοβάται. Απλώς υπάρχει. Ξέρει τι θέλει. Βιώνει το παρόν.</p>
            <p>Πραγματικά ξέρουμε τι θέλουμε μέσα μας. Μετά εμφανίζονται οι φόβοι και μας κάνουν να νομίζουμε ότι δεν το θέλουμε.</p>
          </div>
        </div>
      </section>

      {/* BELIEF 4 */}
      <section className="py-16 px-6 border-t border-gray-100 bg-gray-50">
        <div className="max-w-2xl mx-auto flex flex-col gap-6">
          <span className="text-xs font-medium tracking-widest text-gray-300 uppercase">04</span>
          <h2 className="text-2xl md:text-3xl font-semibold leading-tight" style={{fontFamily: 'Georgia, serif'}}>
            Το τραύμα δεν είναι άλλοθι.
          </h2>
          <div className="flex flex-col gap-4 text-gray-500 leading-relaxed">
            <p>Το τραύμα είναι πραγματικό. Δεν το αμφισβητώ.</p>
            <p>Αλλά το τραύμα είναι εκκρεμότητα - ένα συναίσθημα που δεν έχεις βιώσει ακόμα. Δεν είναι ταυτότητα.</p>
            <p>Η θεραπεία δεν είναι να αναλύεις το παρελθόν επ' αόριστον. Είναι να βιώσεις αυτό που απέφυγες - και να προχωρήσεις.</p>
            <p>Αυτό που σε κράτησε πίσω δεν σε ορίζει. Εκτός αν το αποφασίσεις εσύ.</p>
          </div>
        </div>
      </section>

      {/* BELIEF 5 */}
      <section className="py-16 px-6 border-t border-gray-100">
        <div className="max-w-2xl mx-auto flex flex-col gap-6">
          <span className="text-xs font-medium tracking-widest text-gray-300 uppercase">05</span>
          <h2 className="text-2xl md:text-3xl font-semibold leading-tight" style={{fontFamily: 'Georgia, serif'}}>
            Being πριν Doing.
          </h2>
          <div className="flex flex-col gap-4 text-gray-500 leading-relaxed">
            <p>Το μεγαλύτερο ψέμα της αυτοβελτίωσης: "Κάνε αυτό και θα γίνεις αυτό."</p>
            <p>Δεν λειτουργεί έτσι.</p>
            <p>Πρώτα γίνεσαι. Μετά κάνεις.</p>
            <p>Αν δεν έχεις αλλάξει εσωτερικά, κάθε εξωτερική αλλαγή είναι προσωρινή. Επιστρέφεις πάντα στο ίδιο σημείο.</p>
          </div>
        </div>
      </section>

      {/* BELIEF 6 */}
      <section className="py-16 px-6 border-t border-gray-100 bg-gray-50">
        <div className="max-w-2xl mx-auto flex flex-col gap-6">
          <span className="text-xs font-medium tracking-widest text-gray-300 uppercase">06</span>
          <h2 className="text-2xl md:text-3xl font-semibold leading-tight" style={{fontFamily: 'Georgia, serif'}}>
            Η πιο επαναστατική κίνηση είναι να έχεις θάρρος.
          </h2>
          <div className="flex flex-col gap-4 text-gray-500 leading-relaxed">
            <p>Όχι να είσαι ευτυχισμένος. Όχι να πετύχεις. Όχι να γίνεις "καλύτερος εαυτός σου."</p>
            <p>Να έχεις θάρρος.</p>
            <p>Να πεις αυτό που σκέφτεσαι. Να κάνεις αυτό που ξέρεις ότι πρέπει. Να σταματήσεις να ζεις για τις προσδοκίες άλλων.</p>
            <p>Αν κάνεις αυτό - όλα τα άλλα έρχονται μόνα τους.</p>
          </div>
        </div>
      </section>

      {/* CLOSING */}
      <section className="py-24 px-6 bg-black text-white">
        <div className="max-w-2xl mx-auto flex flex-col gap-8">
          <h2 className="text-3xl md:text-4xl font-semibold leading-tight" style={{fontFamily: 'Georgia, serif'}}>
            Αν αυτά σε βρίσκουν κάπου μέσα σου, είμαστε στην ίδια συχνότητα.
          </h2>
          <div className="flex flex-col gap-4 text-gray-400 leading-relaxed">
            <p>Δεν ψάχνω να συμφωνήσουμε σε όλα.</p>
            <p>Ψάχνω αυτούς που νιώθουν ότι κάτι δεν κολλάει - και είναι έτοιμοι να το δουν.</p>
          </div>
          <a href="/assessment" className="self-start bg-white text-black px-8 py-4 rounded-full text-sm font-medium hover:bg-gray-100 transition-colors">
            Κάνε το assessment →
          </a>
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
          <p className="text-xs text-gray-400">© 2026 WithinSuccess · Προκόπης Κούκης</p>
        </div>
      </footer>

    </main>
  );
}