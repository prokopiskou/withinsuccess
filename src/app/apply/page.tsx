"use client";
import { useState } from "react";
import SiteNav from "@/components/SiteNav";

const GOLD = '#C9A96E';

export default function Apply() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "",
    email: "",
    reason: "",
    experience: "",
    goal: "",
    readiness: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    await fetch("/api/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <main className="min-h-screen bg-white font-sans">
        <SiteNav ctaHref="/assessment" ctaLabel="Ξεκίνα εδώ →" />
        <section className="pt-40 pb-24 px-6 max-w-xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-semibold leading-tight mb-6" style={{fontFamily: 'Georgia, serif'}}>
            Η αίτησή σου έφτασε.
          </h1>
          <p className="text-gray-500 leading-relaxed">
            Αν υπάρχει αντιστοιχία, θα λάβεις μία απάντηση τις επόμενες ημέρες.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white font-sans">
      <SiteNav ctaHref="/assessment" ctaLabel="Ξεκίνα εδώ →" />

      <section className="pt-32 pb-24 px-6 max-w-xl mx-auto">
        <p className="text-sm font-medium tracking-widest text-gray-400 uppercase mb-4">1:1 Coaching</p>
        <h1 className="text-3xl md:text-4xl font-semibold leading-tight mb-4" style={{fontFamily: 'Georgia, serif'}}>
          Αίτηση Συνεργασίας
        </h1>
        <p className="text-gray-500 mb-12">
          Μετά την αξιολόγηση της αίτησής σου θα λάβεις ένα email εντός 2-3 εργάσιμων ημερών.
        </p>

        {/* PROGRESS */}
        <div className="flex gap-2 mb-12">
          {[1,2,3,4,5].map(i => (
            <div key={i} className={`h-px flex-1 transition-all ${i <= step ? 'bg-black' : 'bg-gray-200'}`} />
          ))}
        </div>

        {/* STEP 1 */}
        {step === 1 && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-900">Όνομα</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({...form, name: e.target.value})}
                placeholder="Το όνομά σου"
                className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-900">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({...form, email: e.target.value})}
                placeholder="το@email.σου"
                className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
              />
            </div>
            <button
              onClick={() => form.name && form.email && setStep(2)}
              className="self-start text-white px-8 py-3 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
              style={{backgroundColor: form.name && form.email ? GOLD : '#D1D5DB'}}
            >
              Συνέχεια →
            </button>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold mb-2" style={{fontFamily: 'Georgia, serif'}}>Τι σε έφερε εδώ τώρα;</h2>
            {[
              "Νιώθω κολλημένος και δεν ξέρω από πού να ξεκινήσω",
              "Ξεκινάω αλλά δεν συνεχίζω",
              "Κάτι δεν κολλάει - στη δουλειά, στις σχέσεις, στον εαυτό μου",
              "Κάνω πολλά αλλά νιώθω άδειος",
            ].map(option => (
              <button
                key={option}
                onClick={() => { setForm({...form, reason: option}); setStep(3); }}
                className="text-left px-6 py-4 rounded-xl border border-gray-200 text-sm hover:border-black transition-all"
              >
                {option}
              </button>
            ))}
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold mb-2" style={{fontFamily: 'Georgia, serif'}}>Έχεις δουλέψει ξανά με coach ή σε πρόγραμμα;</h2>
            {[
              "Όχι, είναι η πρώτη φορά",
              "Ναι, αλλά δεν είδα αποτελέσματα",
              "Ναι, και θέλω κάτι βαθύτερο",
            ].map(option => (
              <button
                key={option}
                onClick={() => { setForm({...form, experience: option}); setStep(4); }}
                className="text-left px-6 py-4 rounded-xl border border-gray-200 text-sm hover:border-black transition-all"
              >
                {option}
              </button>
            ))}
          </div>
        )}

        {/* STEP 4 */}
        {step === 4 && (
          <div className="flex flex-col gap-6">
            <h2 className="text-xl font-semibold" style={{fontFamily: 'Georgia, serif'}}>Σε 2-3 προτάσεις - τι θέλεις να έχει αλλάξει στη ζωή σου σε 6 μήνες;</h2>
            <textarea
              value={form.goal}
              onChange={e => setForm({...form, goal: e.target.value})}
              placeholder="Γράψε ελεύθερα..."
              rows={5}
              className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors resize-none"
            />
            <button
              onClick={() => form.goal && setStep(5)}
              className="self-start text-white px-8 py-3 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
              style={{backgroundColor: form.goal ? GOLD : '#D1D5DB'}}
            >
              Συνέχεια →
            </button>
          </div>
        )}

        {/* STEP 5 */}
        {step === 5 && (
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold mb-2" style={{fontFamily: 'Georgia, serif'}}>Το 1:1 coaching είναι επένδυση χρόνου και χρημάτων. Πώς το βλέπεις;</h2>
            {[
              "Είμαι έτοιμος αν αυτό είναι το σωστό βήμα",
              "Θέλω να μάθω περισσότερα πριν αποφασίσω",
              "Με δυσκολεύει οικονομικά αυτή τη στιγμή",
            ].map(option => (
              <button
                key={option}
                onClick={() => setForm({...form, readiness: option})}
                className={`text-left px-6 py-4 rounded-xl border text-sm transition-all ${form.readiness === option ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-black'}`}
              >
                {option}
              </button>
            ))}
            {form.readiness && (
              <button
                onClick={handleSubmit}
                className="self-start text-white px-8 py-3 rounded-full text-sm font-medium hover:opacity-90 transition-opacity mt-4"
                style={{backgroundColor: GOLD}}
              >
                Στείλε την αίτηση →
              </button>
            )}
          </div>
        )}
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