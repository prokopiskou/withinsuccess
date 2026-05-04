export default function Terms() {
    return (
      <main className="min-h-screen bg-white font-sans">
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <a href="/" className="text-lg font-semibold tracking-tight">WithinSuccess</a>
            <a href="/" className="text-sm text-gray-500 hover:text-black transition-colors">← Πίσω</a>
          </div>
        </nav>
        <div className="max-w-3xl mx-auto px-6 pt-32 pb-24">
          <h1 className="text-3xl font-semibold mb-8" style={{fontFamily: 'Georgia, serif'}}>Όροι Χρήσης</h1>
          <div className="flex flex-col gap-6 text-gray-600 leading-relaxed">
            <p>Η χρήση της ιστοσελίδας και των υπηρεσιών της WithinSuccess συνεπάγεται αποδοχή των παρόντων όρων.</p>
            <h2 className="text-xl font-semibold text-black mt-4">1. Υπηρεσίες</h2>
            <p>Η WithinSuccess παρέχει coaching, σεμινάρια και ψηφιακά προγράμματα αυτοβελτίωσης. Δεν αποτελούν ψυχοθεραπεία ή ιατρική συμβουλή.</p>
            <h2 className="text-xl font-semibold text-black mt-4">2. Πνευματική Ιδιοκτησία</h2>
            <p>Όλο το περιεχόμενο (κείμενα, εικόνες, βίντεο, Within Path™) αποτελεί πνευματική ιδιοκτησία της WithinSuccess. Απαγορεύεται η αναπαραγωγή χωρίς γραπτή άδεια.</p>
            <h2 className="text-xl font-semibold text-black mt-4">3. Πληρωμές & Επιστροφές</h2>
            <p>Οι πληρωμές γίνονται εκ των προτέρων. Ακύρωση εντός 48 ωρών από αγορά δίνει δικαίωμα επιστροφής κατόπιν αιτήματος. Μετά δεν πραγματοποιούνται επιστροφές.</p>
            <h2 className="text-xl font-semibold text-black mt-4">4. Ευθύνη</h2>
            <p>Η WithinSuccess δεν φέρει ευθύνη για αποτελέσματα που δεν επιτεύχθηκαν λόγω μη εφαρμογής. Τα αποτελέσματα εξαρτώνται από την προσωπική προσπάθεια.</p>
            <h2 className="text-xl font-semibold text-black mt-4">5. Επικοινωνία</h2>
            <p>Email: <a href="mailto:hello@withinsuccess.gr" className="underline">hello@withinsuccess.gr</a></p>
          </div>
        </div>
      </main>
    );
  }