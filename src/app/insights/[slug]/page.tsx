import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { articles } from "../articles";
export const dynamic = 'force-dynamic';

export async function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const article = articles.find((a) => a.slug === params.slug);
  if (!article) return {};
  return {
    title: article.title,
    description: article.excerpt,
    keywords: article.keywords,
    authors: [{ name: "Προκόπης Κούκης", url: "https://withinsuccess.gr" }],
    alternates: { canonical: `https://withinsuccess.gr/insights/${article.slug}` },
    openGraph: {
      title: article.title,
      description: article.excerpt,
      url: `https://withinsuccess.gr/insights/${article.slug}`,
      type: "article",
      publishedTime: article.date,
      authors: ["Προκόπης Κούκης"],
      images: [{ url: "/prokopis_about.webp", width: 1200, height: 630 }],
    },
  };
}

export default function ArticlePage({ params }: { params: { slug: string } }) {
  const article = articles.find((a) => a.slug === params.slug);
  if (!article) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    author: {
      "@type": "Person",
      name: "Προκόπης Κούκης",
      url: "https://withinsuccess.gr",
    },
    publisher: {
      "@type": "Organization",
      name: "WithinSuccess",
      url: "https://withinsuccess.gr",
    },
    datePublished: article.date,
    keywords: article.keywords.join(", "),
    inLanguage: "el",
    mainEntityOfPage: `https://withinsuccess.gr/insights/${article.slug}`,
  };

  return (
    <main className="min-h-screen bg-white font-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="text-lg font-semibold tracking-tight">WithinSuccess</a>
          <a href="/insights" className="text-sm text-gray-500 hover:text-black transition-colors">← Όλα τα άρθρα</a>
        </div>
      </nav>

      {/* ARTICLE */}
      <article className="pt-32 pb-24 px-6 max-w-2xl mx-auto">
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-xs font-medium tracking-widest text-gray-400 uppercase">{article.category}</span>
            <span className="text-xs text-gray-300">·</span>
            <span className="text-xs text-gray-400">{article.readTime} λεπτά ανάγνωση</span>
            <span className="text-xs text-gray-300">·</span>
            <span className="text-xs text-gray-400">{article.date}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold leading-tight mb-6" style={{fontFamily: 'Georgia, serif'}}>
            {article.title}
          </h1>
          <p className="text-xl text-gray-500 leading-relaxed">{article.excerpt}</p>
          <div className="flex items-center gap-3 mt-8 pt-8 border-t border-gray-100">
            <img src="/prokopis_about.webp" alt="Προκόπης Κούκης" className="w-10 h-10 rounded-full object-cover" />
            <div>
              <p className="text-sm font-medium">Προκόπης Κούκης</p>
              <p className="text-xs text-gray-400">WithinSuccess</p>
            </div>
          </div>
        </header>

        <div
          className="flex flex-col gap-6 text-gray-600 leading-relaxed [&>h2]:text-2xl [&>h2]:font-semibold [&>h2]:text-black [&>h2]:mt-8 [&>h3]:text-xl [&>h3]:font-semibold [&>h3]:text-black [&>p]:leading-relaxed [&>ul]:list-disc [&>ul]:pl-6 [&>ol]:list-decimal [&>ol]:pl-6 [&>strong]:text-black [&>blockquote]:border-l-4 [&>blockquote]:border-gray-200 [&>blockquote]:pl-6 [&>blockquote]:italic [&>blockquote]:text-gray-500"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        {/* CTA */}
        <div className="mt-16 p-8 bg-gray-50 rounded-2xl text-center">
          <p className="text-sm font-medium tracking-widest text-gray-400 uppercase mb-3">Επόμενο βήμα</p>
          <h3 className="text-2xl font-semibold mb-4" style={{fontFamily: 'Georgia, serif'}}>
            Ανακάλυψε πού βρίσκεσαι τώρα.
          </h3>
          <p className="text-gray-500 mb-6 text-sm">Κάνε το Within Assessment — δωρεάν. 3 λεπτά.</p>
          <a href="/assessment" className="inline-block bg-black text-white px-8 py-3 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors">
            Κάνε το assessment →
          </a>
        </div>
      </article>

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