"use client";
import { useState } from "react";

type Props = {
  ctaHref: string;
  ctaLabel: string;
  active?: string;
};

export default function SiteNav({ ctaHref, ctaLabel, active }: Props) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-6 py-4">

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
          <a href="/" className="text-base font-semibold tracking-tight absolute left-1/2 -translate-x-1/2">
            WithinSuccess
          </a>
          <a href={ctaHref} className="text-xs font-medium border border-black px-3 py-1.5 rounded-full hover:bg-black hover:text-white transition-all"
            {ctaLabel}
          </a>
        </div>

        {/* DESKTOP */}
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

      {/* MOBILE MENU */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-6 py-4 flex flex-col gap-4 text-sm text-gray-500">
          <a href="/about" className="hover:text-black transition-colors">About</a>
          <a href="/work" className="hover:text-black transition-colors">Work with me</a>
          <a href="/corporate" className="hover:text-black transition-colors">Corporate</a>
          <a href="/insights" className="hover:text-black transition-colors">Insights</a>
        </div>
      )}
    </nav>
  );
}