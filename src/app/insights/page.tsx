import type { Metadata } from "next";
import { articles } from "./articles";
import SiteNav from "@/components/SiteNav";
import MetaPixel from "@/components/MetaPixel";
import Footer from "@/components/Footer";

const greekMonths: Record<string, number> = {
  'Ιανουαρίου': 0, 'Φεβρουαρίου': 1, 'Μαρτίου': 2, 'Απριλίου': 3,
  'Μαΐου': 4, 'Ιουνίου': 5, 'Ιουλίου': 6, 'Αυγούστου': 7,
  'Σεπτεμβρίου': 8, 'Οκτωβρίου': 9, 'Νοεμβρίου': 10, 'Δεκεμβρίου': 11,
  'Μάιος': 4, 'Μάιου': 4,
};

function parseGreekDate(dateStr: string): number {
  const parts = dateStr.trim().split(/\s+/);
  const day = parseInt(parts[0]) || 0;
  const month = greekMonths[parts[1]] ?? 0;
  const year = parseInt(parts[2]) || 0;
  return new Date(year, month, day).getTime();
}

const sortedArticles = [...articles].sort(
  (a, b) => parseGreekDate(b.date) - parseGreekDate(a.date)
);

export const metadata: Metadata = {
  title: "Insights — Άρθρα για Προσωπική Ανάπτυξη & Αλλαγή Νοοτροπίας",
  description: "Άρθρα για αλλαγή νοοτροπίας, διαχείριση άγχους, αυτογνωσία και προσωπική ανάπτυξη από τον Προκόπη Κούκη.",
  alternates: { canonical: "https://withinsuccess.gr/insights" },
  openGraph: {
    title: "Insights | WithinSuccess",
    description: "Άρθρα για αλλαγή νοοτροπίας, διαχείριση άγχους και προσωπική ανάπτυξη.",
    url: "https://withinsuccess.gr/insights",
  },
};

export default function Insights() {
  return (
    <main className="min-h-screen bg-white font-sans">
      <MetaPixel />

      {/* NAV */}
      <SiteNav active="insights" ctaHref="/assessment" ctaLabel="Ξεκίνα εδώ →" />

      {/* HERO */}
      <section className="pt-32 pb-16 px-6 max-w-4xl mx-auto">
        <p className="text-sm font-medium tracking-widest text-gray-400 uppercase mb-4">Insights</p>
        <h1 className="text-4xl md:text-5xl font-semibold leading-tight mb-6" style={{fontFamily: 'Georgia, serif'}}>
          Σκέψεις που αλλάζουν κάτι.
        </h1>
        <p className="text-xl text-gray-500 max-w-xl">
          Άρθρα για αλλαγή νοοτροπίας, διαχείριση άγχους και εσωτερική μεταμόρφωση.
        </p>
      </section>

      {/* ARTICLES GRID */}
      <section className="pb-24 px-6">
        <div className="max-w-4xl mx-auto">
          {sortedArticles.length === 0 ? (
            <div className="text-center py-24 text-gray-400">
              <p className="text-lg">Σύντομα νέα άρθρα.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-8">
              {sortedArticles.map((article) => (
                <a key={article.slug} href={`/insights/${article.slug}`} className="group flex flex-col gap-4 p-8 border border-gray-100 rounded-2xl hover:border-gray-300 transition-all">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium tracking-widest text-gray-400 uppercase">{article.category}</span>
                    <span className="text-xs text-gray-500">·</span>
                    <span className="text-xs text-gray-400">{article.readTime} λεπτά ανάγνωση</span>
                  </div>
                  <h2 className="text-xl font-semibold leading-snug group-hover:text-gray-600 transition-colors" style={{fontFamily: 'Georgia, serif'}}>
                    {article.title}
                  </h2>
                  <p className="text-gray-500 text-sm leading-relaxed">{article.excerpt}</p>
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                    <span className="text-xs text-gray-400">{article.date}</span>
                    <span className="text-xs font-medium text-black group-hover:underline">Διάβασε →</span>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <Footer />

    </main>
  );
}