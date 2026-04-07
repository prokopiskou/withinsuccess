import type { Metadata } from "next";
import { articles } from "./articles";

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

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="text-lg font-semibold tracking-tight">WithinSuccess</a>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-500">
            <a href="/about" className="hover:text-black transition-colors">About</a>
            <a href="/work" className="hover:text-black transition-colors">Work with me</a>
            <a href="/insights" className="text-black font-medium">Insights</a>
          </div>
          <a href="/assessment" className="text-sm font-medium border border-black px-4 py-2 rounded-full hover:bg-black hover:text-white transition-all">
            Ξεκίνα εδώ →
          </a>
        </div>
      </nav>

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
          {articles.length === 0 ? (
            <div className="text-center py-24 text-gray-400">
              <p className="text-lg">Σύντομα νέα άρθρα.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-8">
              {articles.map((article) => (
                <a key={article.slug} href={`/insights/${article.slug}`} className="group flex flex-col gap-4 p-8 border border-gray-100 rounded-2xl hover:border-gray-300 transition-all">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium tracking-widest text-gray-400 uppercase">{article.category}</span>
                    <span className="text-xs text-gray-300">·</span>
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