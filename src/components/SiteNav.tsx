"use client";
import { useState } from "react";
import Image from "next/image";

type Props = {
  ctaHref: string;
  ctaLabel: string;
  active?: string;
};

export default function SiteNav({ ctaHref, ctaLabel, active }: Props) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-6xl mx-auto pl-3 pr-6 py-3">

        {/* MOBILE */}
        <div className="flex md:hidden items-center justify-between">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex flex-col gap-1.5 p-1 w-8"
          >
            <span className="w-6 h-px bg-black block"></span>
            <span className="w-6 h-px bg-black block"></span>
            <span className="w-6 h-px bg-black block"></span>
          </button>
          <a href="/" className="absolute left-1/2 -translate-x-1/2">
            <Image
              src="/logo.png"
              alt="WithinSuccess"
              width={40}
              height={40}
              priority
              className="w-10 h-10"
            />
          </a>
          <a href={ctaHref} className="text-xs font-medium border border-black px-3 py-1.5 rounded-full hover:bg-black hover:text-white transition-all">
            {ctaLabel}
          </a>
        </div>

        {/* DESKTOP */}
        <div className="hidden md:flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="WithinSuccess"
              width={48}
              height={48}
              priority
              className="w-12 h-12"
            />
            <span className="text-lg font-semibold tracking-tight" style={{ fontFamily: "Georgia, serif" }}>
              WithinSuccess
            </span>
          </a>
          <div className="flex items-center gap-8 text-sm text-gray-500">
            <a href="/about" className={active === "about" ? "text-black font-medium" : "hover:text-black transition-colors"}>Η ιστορία</a>
            <a href="/work" className={active === "work" ? "text-black font-medium" : "hover:text-black transition-colors"}>Συνεργασία</a>
            <a href="/corporate" className={active === "corporate" ? "text-black font-medium" : "hover:text-black transition-colors"}>Για εταιρείες</a>
            <a href="/insights" className={active === "insights" ? "text-black font-medium" : "hover:text-black transition-colors"}>Σκέψεις</a>
          </div>
          <a href={ctaHref} className="text-sm font-medium border border-black px-4 py-2 rounded-full hover:bg-black hover:text-white transition-all">
            {ctaLabel}
          </a>
        </div>
      </div>

      {/* MOBILE MENU */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-6 py-4 flex flex-col gap-4 text-sm text-gray-500">
          <a href="/about" className="hover:text-black transition-colors">Η ιστορία</a>
          <a href="/work" className="hover:text-black transition-colors">Συνεργασία</a>
          <a href="/corporate" className="hover:text-black transition-colors">Για εταιρείες</a>
          <a href="/insights" className="hover:text-black transition-colors">Σκέψεις</a>
        </div>
      )}
    </nav>
  );
}
