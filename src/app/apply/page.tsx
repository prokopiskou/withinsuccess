"use client";
import { useState } from "react";
import SiteNav from "@/components/SiteNav";

const GOLD = '#C9A96E';

export default function Waitlist() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name || !email) return;
    setLoading(true);
    await fetch("/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email }),
    });
    setSubmitted(true);
    setLoading(false);
  };

  if (submitted) {
    return (
      <main className="min-h-screen bg-white font-sans">
        <SiteNav ctaHref="/assessment" ctaLabel="Ξεκίνα εδώ →" />
        <section className="pt-40 pb-24 px-6 max-w-xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-semibold leading-tight mb-6" style={{fontFamily: 'Georgia, serif'}}>
            Είσαι μέσα.
          </h1>
          <p className="text-gray-500 leading-relaxed">
            Θα είσαι ο πρώτος που θα μάθει για το επόμενο seminar.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white font-sans">
      <SiteNav ctaHref="/assessment" ctaLabel="Ξεκίνα εδώ →" />

      <section className="pt-32 pb-24 px-6 max-w-xl mx-auto">
        <p className="text-sm font-medium tracking-widest text-gray-400 uppercase mb-4">Live Seminars</p>
        <h1 className="text-3xl md:text-4xl font-semibold leading-tight mb-4" style={{fontFamily: 'Georgia, serif'}}>
          Λίστα Αναμονής
        </h1>
        <p className="text-gray-500 mb-12">
          Τα seminars γεμίζουν γρήγορα. Μπες στη λίστα και θα είσαι ο πρώτος που θα ξέρει.
        </p>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-900">Όνομα</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Το όνομά σου"
              className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-900">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="το@email.σου"
              className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="self-start text-white px-8 py-3 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
            style={{backgroundColor: name && email ? GOLD : '#D1D5DB'}}
          >
            {loading ? "..." : "Μπες στη λίστα →"}
          </button>
        </div>
      </section>

      <footer className="py-12 px-6 bg-white border-t border-gray-100">
        <div className="max-w-6xl mx-auto flex flex-col items-center gap-6 text-center">
          <span className="text-lg font-semibold tracking-tight" style={{fontFamily: 'Georgia, serif'}}>WithinSuccess</span>
          <p className="text-xs text-gray-400">© 2026 WithinSuccess · Προκόπης Κούκης</p>
        </div>
      </footer>
    </main>
  );
}