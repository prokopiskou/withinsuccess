import type { Metadata } from "next";
import ContactForm from "@/components/ContactForm";
import Footer from "@/components/Footer";
import SiteNav from "@/components/SiteNav";

export const metadata: Metadata = {
  title: "Επικοινωνία | WithinSuccess",
  description: "Επικοινώνησε με τον Προκόπη Κούκη και το WithinSuccess. Είμαι εδώ για να ακούσω.",
  openGraph: {
    title: "Επικοινωνία | WithinSuccess",
    description: "Επικοινώνησε με τον Προκόπη Κούκη και το WithinSuccess.",
  },
};

export default function ContactPage() {
  return (
    <main className="min-h-screen pt-32 pb-20 px-6" style={{ backgroundColor: "#FFFFFF" }}>
      <SiteNav active="contact" ctaHref="/assessment" ctaLabel="Ξεκίνα εδώ →" />
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-serif mb-6" style={{ color: "#0D0D0D" }}>
            Επικοινωνία
          </h1>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: "#0D0D0D" }}>
            Αν θέλεις να μου πεις κάτι, να ρωτήσεις κάτι ή απλά να συστηθείς,
            <br />
            θα χαρώ να σε ακούσω.
          </p>
          <div className="mt-4 inline-block w-16 h-px" style={{ backgroundColor: "#C9A96E" }} />
        </div>

        <ContactForm />

        <div className="mt-16 text-center text-sm" style={{ color: "#0D0D0D" }}>
          <p>Μπορείς επίσης να με βρεις στο</p>
          <a
            href="mailto:hello@withinsuccess.gr"
            className="hover:opacity-70 transition-opacity"
            style={{ color: "#C9A96E" }}
          >
            hello@withinsuccess.gr
          </a>
        </div>
      </div>

      <Footer />
    </main>
  );
}
