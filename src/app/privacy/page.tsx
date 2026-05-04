export default function Privacy() {
    return (
      <main className="min-h-screen bg-white font-sans">
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <a href="/" className="text-lg font-semibold tracking-tight">WithinSuccess</a>
            <a href="/" className="text-sm text-gray-500 hover:text-black transition-colors">← Πίσω</a>
          </div>
        </nav>
        <div className="max-w-3xl mx-auto px-6 pt-32 pb-24">
          <h1 className="text-3xl font-semibold mb-8" style={{fontFamily: 'Georgia, serif'}}>Πολιτική Απορρήτου</h1>
          <div className="flex flex-col gap-6 text-gray-600 leading-relaxed">
            <p>Η παρούσα Πολιτική Απορρήτου ισχύει για την ατομική επιχείρηση «ΠΡΟΚΟΠΙΟΣ ΚΟΥΚΗΣ», με έδρα στην Ηρακλείου 4, Γλυφάδα 16675, Ελλάδα, σύμφωνα με τον GDPR (ΕΕ) 2016/679.</p>
            <h2 className="text-xl font-semibold text-black mt-4">1. Τι δεδομένα συλλέγουμε</h2>
            <p>Συλλέγουμε ονοματεπώνυμο, email, τηλέφωνο και πόλη μέσω φορμών εγγραφής, Facebook Lead Ads και ManyChat (Messenger/Instagram bot).</p>
            <h2 className="text-xl font-semibold text-black mt-4">2. Πού αποθηκεύονται</h2>
            <p>Τα δεδομένα αποθηκεύονται σε MailerLite, Meta Platforms και ManyChat — όλες GDPR-compliant πλατφόρμες. Χρησιμοποιούνται αποκλειστικά για επικοινωνία και ενημέρωση.</p>
            <h2 className="text-xl font-semibold text-black mt-4">3. Νομική βάση</h2>
            <p>Η επεξεργασία βασίζεται στη ρητή συγκατάθεσή σας. Μπορείτε να την ανακαλέσετε ανά πάσα στιγμή μέσω "unsubscribe" ή με email.</p>
            <h2 className="text-xl font-semibold text-black mt-4">4. Cookies</h2>
            <p>Χρησιμοποιούμε cookies για βελτίωση εμπειρίας και Google Analytics. Ζητείται συγκατάθεση κατά την πρώτη είσοδο.</p>
            <h2 className="text-xl font-semibold text-black mt-4">5. Τα δικαιώματά σας</h2>
            <p>Έχετε δικαίωμα πρόσβασης, διόρθωσης, διαγραφής, εναντίωσης και φορητότητας των δεδομένων σας.</p>
            <h2 className="text-xl font-semibold text-black mt-4">6. Επικοινωνία</h2>
            <p>Προκόπιος Κούκης · Ηρακλείου 4, Γλυφάδα 16675<br />Email: hello@withinsuccess.gr · Τηλ: +30 210 9627352</p>
            <h2 className="text-xl font-semibold text-black mt-4">7. Εποπτική Αρχή</h2>
            <p>Αρχή Προστασίας Δεδομένων — <a href="https://www.dpa.gr" className="underline">www.dpa.gr</a></p>
          </div>
        </div>
      </main>
    );
  }