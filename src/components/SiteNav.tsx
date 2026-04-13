"use client";

import { useState } from "react";

type SiteNavProps = {
  active?: "about" | "work" | "corporate" | "insights";
  ctaHref: string;
  ctaLabel: string;
};

export default function SiteNav({ active, ctaHref, ctaLabel }: SiteNavProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-6 py-4 relative">
        <div className="md:hidden flex items-center justify-between">
          <button
            type="button"
            className="flex flex-col gap-1.5"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
          >
            <span className="block w-5 h-0.5 bg-black" />
            <span className="block w-5 h-0.5 bg-black" />
            <span className="block w-5 h-0.5 bg-black" />
          </button>
          <a href="/" className="absolute left-1/2 -translate-x-1/2 text-lg font-semibold tracking-tight">WithinSuccess</a>
          <a href={ctaHref} className="text-sm font-medium border border-black px-4 py-2 rounded-full hover:bg-black hover:text-white transition-all">
            {ctaLabel}
          </a>
        </div>

        <div className="hidden md:flex items-center justify-between">
          <a href="/" className="text-lg font-semibold tracking-tight">WithinSuccess</a>
          <div className="flex items-center gap-8 text-sm text-gray-500">
            <a href="/about" className={active === "about" ? "text-black font-medium" : "hover:text-black transition-colors"}>About</a>
            <a href="/work" className={active === "work" ? "text-black font-medium" : "hover:text-black transition-colors"}>Work with me</a>
            <a href="/corporate" className={active === "corporate" ? "text-black font-medium" : "hover:text-black transition-colors"}>Corporate</a>
            <a href="/insights" className={active === "insights" ? "text-black font-medium" : "hover:text-black transition-colors"}>Insights</a>
          </div>
          <a href={ctaHref} className="text-sm font-medium border border-black px-4 py-2 rounded-full hover:bg-black hover:text-white transition-all">
            {ctaLabel}
          </a>
        </div>
      </div>
      {isMenuOpen && (
        <div className="md:hidden w-full bg-white px-6 py-4 flex flex-col gap-4 text-gray-500 border-t border-gray-100">
          <a href="/about" className="hover:text-black transition-colors">About</a>
          <a href="/work" className="hover:text-black transition-colors">Work with me</a>
          <a href="/corporate" className="hover:text-black transition-colors">Corporate</a>
          <a href="/insights" className="hover:text-black transition-colors">Insights</a>
        </div>
      )}
    </nav>
  );
}
