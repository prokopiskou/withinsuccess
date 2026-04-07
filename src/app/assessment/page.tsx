export default function Assessment() {
  return (
    <main className="min-h-screen bg-white font-sans">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="text-lg font-semibold tracking-tight">WithinSuccess</a>
          <a href="/" className="text-sm text-gray-500 hover:text-black transition-colors">← Πίσω</a>
        </div>
      </nav>
      <div className="pt-16 h-screen">
        <iframe
          data-tally-src="https://tally.so/r/pbWozb?transparentBackground=1"
          width="100%"
          height="100%"
          frameBorder="0"
          marginHeight={0}
          marginWidth={0}
          title="Quiz - Αυτογνωσίας"
        />
        <script async src="https://tally.so/widgets/embed.js" />
      </div>
    </main>
  );
}