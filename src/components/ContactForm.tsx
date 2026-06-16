"use client";

import { useState } from "react";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMessage("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Κάτι πήγε στραβά");
      }

      setStatus("success");
      setName("");
      setEmail("");
      setMessage("");
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Παρακαλώ δοκιμάστε ξανά");
    }
  }

  if (status === "success") {
    return (
      <div className="text-center py-12">
        <h3 className="text-2xl font-serif mb-4" style={{ color: "#0D0D0D" }}>
          Ευχαριστώ που επικοινώνησες
        </h3>
        <p className="text-lg" style={{ color: "#0D0D0D" }}>
          Έλαβα το μήνυμά σου και θα σου απαντήσω το συντομότερο δυνατό.
        </p>
        <button
          onClick={() => setStatus("idle")}
          className="mt-8 px-6 py-3 border border-current"
          style={{ color: "#C9A96E", borderColor: "#C9A96E" }}
        >
          Στείλε νέο μήνυμα
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-2" style={{ color: "#0D0D0D" }}>
          Ονοματεπώνυμο
        </label>
        <input
          id="name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 focus:border-current focus:outline-none transition-colors"
          style={{ color: "#0D0D0D" }}
          placeholder="Το όνομά σου"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-2" style={{ color: "#0D0D0D" }}>
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 focus:border-current focus:outline-none transition-colors"
          style={{ color: "#0D0D0D" }}
          placeholder="your@email.com"
        />
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium mb-2" style={{ color: "#0D0D0D" }}>
          Μήνυμα
        </label>
        <textarea
          id="message"
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={6}
          className="w-full px-4 py-3 border border-gray-300 focus:border-current focus:outline-none transition-colors resize-none"
          style={{ color: "#0D0D0D" }}
          placeholder="Πες μου τι σκέφτεσαι"
        />
      </div>

      {status === "error" && (
        <div className="text-sm" style={{ color: "#C9A96E" }}>
          {errorMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full py-4 font-medium tracking-wide transition-opacity hover:opacity-90 disabled:opacity-50"
        style={{ backgroundColor: "#0D0D0D", color: "#FFFFFF" }}
      >
        {status === "sending" ? "Αποστολή..." : "Αποστολή μηνύματος"}
      </button>
    </form>
  );
}