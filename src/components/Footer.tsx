import Link from "next/link";

export default function Footer() {
  return (
    <footer className="py-12 px-6 bg-white border-t border-gray-100">
      <div className="max-w-6xl mx-auto flex flex-col items-center gap-6 text-center">
        <span className="text-lg font-semibold tracking-tight" style={{ fontFamily: "Georgia, serif" }}>
          WithinSuccess
        </span>
        <div className="flex gap-6 text-sm text-gray-500">
          <a
            href="https://www.instagram.com/withinsuccess/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-black transition-colors"
          >
            Instagram
          </a>
          <a
            href="https://www.youtube.com/@Prokopiskoukis"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-black transition-colors"
          >
            YouTube
          </a>
          <a href="mailto:hello@withinsuccess.gr" className="hover:text-black transition-colors">
            Email
          </a>
        </div>
        <div className="flex gap-4 text-xs text-gray-500">
          <Link href="/contact" className="hover:opacity-70 transition-opacity">
            Επικοινωνία
          </Link>
          <a href="/privacy" className="hover:text-black transition-colors">
            Πολιτική Απορρήτου
          </a>
          <a href="/terms" className="hover:text-black transition-colors">
            Όροι Χρήσης
          </a>
        </div>
        <p className="text-xs text-gray-500">© 2026 WithinSuccess</p>
      </div>
    </footer>
  );
}
