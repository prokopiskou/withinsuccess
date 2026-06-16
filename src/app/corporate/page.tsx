import SiteNav from "@/components/SiteNav";
import MetaPixel from "@/components/MetaPixel";
import Footer from "@/components/Footer";

export default function Corporate() {
  return (
    <main className="min-h-screen bg-white font-sans">
      <MetaPixel />

      {/* NAV */}
      <SiteNav active="corporate" ctaHref="mailto:hello@withinsuccess.gr" ctaLabel="Επικοινωνία →" />

      {/* HERO */}
      <section className="pt-32 pb-16 px-6 max-w-4xl mx-auto">
        <p className="text-sm font-medium tracking-widest text-gray-400 uppercase mb-4">Για Οργανισμους & Εταιριες</p>
        <h1 className="text-4xl md:text-5xl font-semibold leading-tight mb-8" style={{fontFamily: 'Georgia, serif'}}>
          Οι άνθρωποί σου είναι η επιχείρησή σου.
        </h1>
        <div className="flex flex-col gap-4 text-xl text-gray-500 leading-relaxed max-w-2xl">
          <p>Το burnout, το άγχος και η έλλειψη κινήτρου δεν είναι προσωπικά προβλήματα.</p>
          <p>Είναι organizational problems. Και έχουν λύση.</p>
        </div>
      </section>

      {/* ΤΟ ΠΡΟΒΛΗΜΑ */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-semibold leading-tight mb-12" style={{fontFamily: 'Georgia, serif'}}>
            Τι κοστίζει η αδράνεια.
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex flex-col gap-4 p-8 bg-white rounded-2xl border border-gray-100">
              <span className="text-2xl font-light text-gray-200">01</span>
              <h3 className="text-lg font-semibold">Burnout</h3>
              <p className="text-gray-500 leading-relaxed">Ο εργαζόμενος που δεν αποδίδει δεν είναι τεμπέλης. Είναι εξαντλημένος.</p>
            </div>
            <div className="flex flex-col gap-4 p-8 bg-white rounded-2xl border border-gray-100">
              <span className="text-2xl font-light text-gray-200">02</span>
              <h3 className="text-lg font-semibold">Αποδοτικότητα</h3>
              <p className="text-gray-500 leading-relaxed">Το άγχος κοστίζει. Σε χαμένες ώρες, λάθη και αποφάσεις που δεν παίρνονται.</p>
            </div>
            <div className="flex flex-col gap-4 p-8 bg-white rounded-2xl border border-gray-100">
              <span className="text-2xl font-light text-gray-200">03</span>
              <h3 className="text-lg font-semibold">Retention</h3>
              <p className="text-gray-500 leading-relaxed">Οι άνθρωποι δεν φεύγουν από εταιρίες. Φεύγουν από περιβάλλοντα που δεν τους βλέπουν.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ΤΙ ΠΡΟΣΦΕΡΩ */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-medium tracking-widest text-gray-400 uppercase mb-4">Τι προσφερω</p>
          <h2 className="text-3xl md:text-4xl font-semibold leading-tight mb-4" style={{fontFamily: 'Georgia, serif'}}>
            Βιωματικά workshops για ομάδες.
          </h2>
          <p className="text-lg text-gray-500 mb-12 max-w-2xl">
            Δεν είναι διαλέξεις. Δεν είναι θεωρία. Είναι 90 λεπτά που αλλάζουν τον τρόπο που η ομάδα σου βλέπει τον εαυτό της - και δουλεύει μαζί.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex flex-col gap-3 p-6 border border-gray-100 rounded-2xl">
              <p className="text-xs font-medium tracking-widest text-gray-400 uppercase">Workshop 01</p>
              <h3 className="font-semibold text-gray-900 text-lg" style={{fontFamily: 'Georgia, serif'}}>Διαχείριση Άγχους</h3>
              <p className="text-sm text-gray-500 leading-relaxed">Εργαλεία ανθεκτικότητας για την καθημερινή πίεση. Βιωματικές ασκήσεις που εφαρμόζονται αμέσως.</p>
              <p className="text-xs text-gray-400 mt-auto">90 λεπτά · έως 30 άτομα</p>
            </div>
            <div className="flex flex-col gap-3 p-6 border border-gray-100 rounded-2xl">
              <p className="text-xs font-medium tracking-widest text-gray-400 uppercase">Workshop 02</p>
              <h3 className="font-semibold text-gray-900 text-lg" style={{fontFamily: 'Georgia, serif'}}>Ισορροπία Ζωής & Εργασίας</h3>
              <p className="text-sm text-gray-500 leading-relaxed">Επαναπροσδιορισμός ισορροπίας για μακροπρόθεσμη ευεξία. Με workbook και προσωπικό πλάνο.</p>
              <p className="text-xs text-gray-400 mt-auto">90 λεπτά · έως 30 άτομα</p>
            </div>
            <div className="flex flex-col gap-3 p-6 border border-gray-100 rounded-2xl">
              <p className="text-xs font-medium tracking-widest text-gray-400 uppercase">Workshop 03</p>
              <h3 className="font-semibold text-gray-900 text-lg" style={{fontFamily: 'Georgia, serif'}}>Εσωτερική Δύναμη & Αυτοπεποίθηση</h3>
              <p className="text-sm text-gray-500 leading-relaxed">Για ομάδες που θέλουν να λειτουργούν από δύναμη - όχι από φόβο.</p>
              <p className="text-xs text-gray-400 mt-auto">90 λεπτά · έως 30 άτομα</p>
            </div>
          </div>
        </div>
      </section>

      {/* ΣΥΝΕΡΓΑΣΙΕΣ */}
      <section className="py-16 px-6 bg-black text-white">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-medium tracking-widest text-gray-400 uppercase mb-8">Μας έχουν εμπιστευτεί</p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-4 p-8 border border-gray-800 rounded-2xl">
              <p className="text-xs font-medium text-gray-400 tracking-widest uppercase">Medusa</p>
              <p className="text-gray-300 leading-relaxed">3ωρο Excellence Workshop για την ομάδα. Σύνδεση προσωπικών στόχων εργαζομένων με το brand vision - και εκπαίδευση στη μέγιστη εμπειρία πελάτη.</p>
              <p className="text-sm text-gray-500 mt-auto">Excellence Workshop · Σεπτέμβριος 2025</p>
            </div>
            <div className="flex flex-col gap-4 p-8 border border-gray-800 rounded-2xl">
              <p className="text-xs font-medium text-gray-400 tracking-widest uppercase">Δήμος Ελληνικού - Αργυρούπολης</p>
              <p className="text-gray-300 leading-relaxed">Δύο εκδηλώσεις στο Πολιτιστικό Συνεδριακό Κέντρο «Μίκης Θεοδωράκης». Workshop και seminar αυτοβελτίωσης με εκατοντάδες συμμετέχοντες.</p>
              <p className="text-sm text-gray-500 mt-auto">Seminar · Workshop · 2024</p>
            </div>
            <div className="flex flex-col gap-4 p-8 border border-gray-800 rounded-2xl">
              <p className="text-xs font-medium text-gray-400 tracking-widest uppercase">Ρομβός Φροντιστήρια</p>
              <p className="text-gray-300 leading-relaxed">Ημερίδα προσωπικής ανάπτυξης για μαθητές και γονείς. Κατάμεστη αίθουσα με ενεργή συμμετοχή και live Q&A.</p>
              <p className="text-sm text-gray-500 mt-auto">Ημερίδα · Φεβρουάριος 2025</p>
            </div>
            <div className="flex flex-col gap-4 p-8 border border-gray-800 rounded-2xl">
              <p className="text-xs font-medium text-gray-400 tracking-widest uppercase">Breath Pilates by Ifigenia</p>
              <p className="text-gray-300 leading-relaxed">Outdoor event αυτοφροντίδας στον Εθνικό Κήπο της Αθήνας. Βιωματική εμπειρία για την κοινότητα.</p>
              <p className="text-sm text-gray-500 mt-auto">Outdoor Event · Δεκέμβριος 2024</p>
            </div>
            <div className="flex flex-col gap-4 p-8 border border-gray-800 rounded-2xl md:col-span-2">
              <p className="text-xs font-medium text-gray-400 tracking-widest uppercase">Beauty Mastery</p>
              <p className="text-gray-300 leading-relaxed">Seminar αυτοπεποίθησης για επαγγελματίες του beauty industry. Εστίαση στην εσωτερική δύναμη ως βάση για επαγγελματική παρουσία.</p>
              <p className="text-sm text-gray-500 mt-auto">Seminar · Μάιος 2025</p>
            </div>
          </div>
        </div>
      </section>

      {/* ΦΩΤΟΓΡΑΦΙΕΣ */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="relative rounded-2xl overflow-hidden aspect-[4/3]">
              <img src="/prokopis_workshop.webp" alt="Βιωματικό corporate workshop WithinSuccess για εταιρικές ομάδες" className="w-full h-full object-cover object-[50%_25%]" />
            </div>
            <div className="relative rounded-2xl overflow-hidden aspect-[4/3]">
              <img src="/prokopis_team.webp" alt="Ομάδα WithinSuccess σε corporate coaching session" className="w-full h-full object-cover object-[50%_25%]" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 bg-gray-50 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-semibold mb-4" style={{fontFamily: 'Georgia, serif'}}>
            Ας μιλήσουμε.
          </h2>
          <p className="text-gray-500 mb-8">Κάθε πρόγραμμα σχεδιάζεται εξατομικευμένα για τις ανάγκες της ομάδας σου.</p>
          <a href="mailto:hello@withinsuccess.gr" className="inline-block bg-black text-white px-10 py-4 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors">
            hello@withinsuccess.gr →
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <Footer />

    </main>
  );
}