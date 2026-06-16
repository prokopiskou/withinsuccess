import Footer from "@/components/Footer";
import SiteNav from "@/components/SiteNav";
import MetaPixel from "@/components/MetaPixel";

export default function About() {
  return (
    <main className="min-h-screen bg-white font-sans">
      <MetaPixel />

      {/* NAV */}
      <SiteNav active="about" ctaHref="/assessment" ctaLabel="Ξεκίνα εδώ →" />

      {/* HERO */}
      <section className="pt-32 pb-16 px-6 max-w-4xl mx-auto">
        <p className="text-sm font-medium tracking-widest text-gray-400 uppercase mb-4">Ο Προκοπης Κουκης</p>
        <h1 className="text-4xl md:text-5xl font-semibold leading-tight mb-8" style={{fontFamily: 'Georgia, serif'}}>
          Δεν το επέλεξα.
        </h1>
        <div className="flex flex-col gap-4 text-xl text-gray-500 leading-relaxed max-w-2xl">
          <p>Κάποια στιγμή με χρειάστηκε ένας δικός μου άνθρωπος.</p>
          <p>Έπρεπε να βρω τον τρόπο να βοηθήσω.</p>
          <p>Και δεν σταμάτησα από τότε.</p>
        </div>
      </section>

      {/* STAGE PHOTO */}
      <section className="mb-16">
        <div className="relative overflow-hidden" style={{height: '70vh'}}>
          <img
            src="/prokopis_stage.webp"
            alt="Προκόπης Κούκης στη σκηνή - Live Coaching και σεμινάριο WithinSuccess"
            className="w-full h-full object-cover object-[87%] md:object-center"
          />
        </div>
      </section>

      {/* NUMBERS */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="text-center">
            <span className="text-4xl font-semibold" style={{fontFamily: 'Georgia, serif'}}>173k</span>
            <p className="text-sm text-gray-400 mt-2">Instagram</p>
          </div>
          <div className="text-center">
            <span className="text-4xl font-semibold" style={{fontFamily: 'Georgia, serif'}}>900+</span>
            <p className="text-sm text-gray-400 mt-2">Ατομα</p>
          </div>
          <div className="text-center">
            <span className="text-4xl font-semibold" style={{fontFamily: 'Georgia, serif'}}>7+</span>
            <p className="text-sm text-gray-400 mt-2">Χρονια</p>
          </div>
          <div className="text-center">
            <span className="text-4xl font-semibold" style={{fontFamily: 'Georgia, serif'}}>150+</span>
            <p className="text-sm text-gray-400 mt-2">Βιβλια</p>
          </div>
        </div>
      </section>

      {/* STORY */}
      <section className="py-16 px-6">
        <div className="max-w-2xl mx-auto flex flex-col gap-16 text-gray-600 leading-relaxed text-lg">

          <div>
            <p className="text-xs font-medium tracking-widest text-gray-500 uppercase mb-4">3 Οκτωβριου 2019</p>
            <p>Τότε έγινε η πρώτη μου απόπειρα. Μια σελίδα αυτοβελτίωσης στο Instagram. Το όνομα: <em>Successexplained</em>. Ξόδευα δεκάδες ώρες κάθε βδομάδα. Τα μηνύματα ξεκίνησαν. Τα like ανέβαιναν. Ήξερα τι θέλω.</p>
          </div>

          <div>
            <p className="text-xs font-medium tracking-widest text-gray-500 uppercase mb-4">18 Νοεμβριου 2019</p>
            <p>Ξύπνησα το πρωί με μια δυσάρεστη έκπληξη.</p>
            <p className="mt-4">Ο λογαριασμός του Successexplained είχε αποσυνδεθεί. Δεν μπορούσα να μπω. Με έστελνε να επαληθεύσω μέσω κινητού. Κανένας κωδικός δεν ερχόταν.</p>
            <p className="mt-4">Για 5 μέρες δοκίμασα τα πάντα. Forums, άρθρα, support του Instagram. Τίποτα.</p>
            <p className="mt-4">Έμπαινα κάθε μέρα στη σελίδα σαν θεατής. 560 ακόλουθοι να περιμένουν σημάδι ζωής. Με ακολούθησαν γιατί τους ενδιαφέρει αυτό που έχω να πω.</p>
            <p className="mt-4">Την 6η μέρα πήρα την απόφαση: «Την έχασες, Προκόπη.»</p>
          </div>

          <div>
            <p className="text-xs font-medium tracking-widest text-gray-500 uppercase mb-4">1 Δεκεμβριου 2019</p>
            <p>Μετά από 8ωρο στο ελαιοτριβείο, ήρθε η ώρα για τις ελιές της γιαγιάς.</p>
            <p className="mt-4">«Ρε γιαγιά, είναι ανάγκη να τις μαζέψουμε όλες; Είμαστε δύο άτομα με δύο ξύλινες βέργες για 20 δέντρα. Δεν το αφήνουμε;»</p>
            <p className="mt-4 font-medium text-gray-800">«Θα σταματήσουμε μόνο όταν τελειώσουμε.»</p>
            <p className="mt-4">Αυτή η πρόταση με χτύπησε. Το μυαλό μου πήγε στη σελίδα. Είχα τελειώσει αυτό που ξεκίνησα; Ή κάτι απλώς είχε προσπαθήσει να με σταματήσει;</p>
            <p className="mt-4">Το ίδιο βράδυ αποφάσισα να ξαναπροσπαθήσω.</p>
          </div>

          {/* Φωτογραφίες ελαιοτριβείο + polaroid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <div className="rounded-xl overflow-hidden">
                <img src="/prokopis_elaiotrivio.webp" alt="Προκόπης Κούκης στο ελαιοτριβείο - προσωπική ιστορία πίσω από το WithinSuccess" className="w-full object-cover" />
              </div>
              <p className="text-xs text-gray-400 text-center italic">Εγώ στο ελαιοτριβείο, Δεκέμβριος 2019</p>
            </div>
            <div className="flex flex-col gap-2">
              <div className="rounded-xl overflow-hidden">
                <img src="/prokopis_begin.webp" alt="Προκόπης Κούκης - polaroid με ελιά, οι ρίζες της διαδρομής coaching WithinSuccess" className="w-full object-cover" />
              </div>
              <p className="text-xs text-gray-400 text-center italic">Εγώ με μια ελιά, Εύβοια 2019</p>
            </div>
          </div>

          {/* Quote + γιαγιά — ίδιο ύψος παντού */}
          <div className="flex flex-row gap-6 items-stretch">
            <div className="flex-1 flex items-center">
              <div className="border-l-2 border-gray-100 pl-6 italic text-gray-400">
                <p>Το χαμόγελο της γιαγιάς μου όταν έβαζε από το δικό της λάδι στο φαγητό — αυτό είναι πραγματική επιτυχία. Η επιτυχία πηγάζει από μέσα μας.</p>
                <p className="mt-4 not-italic font-medium text-gray-600">Withinsuccess.</p>
              </div>
            </div>
            <div className="flex flex-col gap-2 flex-shrink-0 w-32">
              <div className="rounded-xl overflow-hidden h-full">
                <img src="/yiayia.webp" alt="Η γιαγιά του Προκόπη Κούκη με ελιές - έμπνευση για τη φιλοσοφία WithinSuccess" className="w-full h-full object-cover" />
              </div>
              <p className="text-xs text-gray-400 text-center italic">Η γιαγιά μου, Εύβοια 2019</p>
            </div>
          </div>

        </div>
      </section>

      {/* SEMINAR PHOTOS */}
      <section className="py-8 px-6">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
          <div className="relative rounded-2xl overflow-hidden aspect-[4/3]">
            <img src="/prokopis_audience.webp" alt="Κοινό σε σεμινάριο personal development του Προκόπη Κούκη, WithinSuccess" className="w-full h-full object-cover" />
          </div>
          <div className="relative rounded-2xl overflow-hidden aspect-[4/3]">
            <img src="/prokopis_corporate.webp" alt="Προκόπης Κούκης σε corporate εκδήλωση coaching WithinSuccess" className="w-full h-full object-cover" />
          </div>
        </div>
      </section>

      {/* PHILOSOPHY */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-medium tracking-widest text-gray-400 uppercase mb-6">Η φιλοσοφια</p>
          <div className="flex flex-col gap-6 text-gray-600 leading-relaxed text-lg">
            <p>Μετά από 7+ χρόνια προσωπικής ανάπτυξης και πάνω από 150 βιβλία, κατάλαβα κάτι απλό:</p>
            <p>Η αλλαγή δεν έρχεται από έξω. Έρχεται όταν αλλάξει η ιστορία που λες στον εαυτό σου.</p>
            <p>Έχω καθοδηγηθεί από Tony Robbins, Brendon Burchard και Marie Forleo. Έχω αναπτύξει τη δική μου φιλοσοφία και μέθοδο — το Within Path™.</p>
            <p>Και σήμερα τη μεταφέρω σε κάθε άνθρωπο που θέλει πραγματική αλλαγή.</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 bg-white text-center">
        <h2 className="text-3xl font-semibold mb-4" style={{fontFamily: 'Georgia, serif'}}>
          Έτοιμος να ξεκινήσεις;
        </h2>
        <p className="text-gray-500 mb-8">Κάνε το Within Assessment και ανακάλυψε πού βρίσκεσαι τώρα.</p>
        <a href="/assessment" className="inline-block bg-black text-white px-8 py-4 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors">
          Κάνε το assessment →
        </a>
      </section>

      <Footer />

    </main>
  );
}