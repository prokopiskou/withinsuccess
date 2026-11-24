import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Διαγραφή δεδομένων | WithinSuccess',
  description: 'Πώς ζητάτε διαγραφή των δεδομένων σας από το WithinSuccess, και από τα μηνύματα Instagram.',
}

export default function DataDeletion() {
  return (
    <main className="min-h-screen bg-white font-sans">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-lg font-semibold tracking-tight">WithinSuccess</Link>
          <Link href="/" className="text-sm text-gray-500 hover:text-black transition-colors">← Πίσω</Link>
        </div>
      </nav>
      <div className="max-w-3xl mx-auto px-6 pt-32 pb-24">
        <h1 className="text-3xl font-semibold mb-8">Διαγραφή δεδομένων</h1>
        <div className="flex flex-col gap-6 text-gray-600 leading-relaxed">
          <p>
            Μπορείτε να ζητήσετε ανά πάσα στιγμή να διαγραφούν τα δεδομένα σας. Και όσα λάβαμε μέσω του Instagram,
            όταν σχολιάσατε ή μας στείλατε μήνυμα: όνομα χρήστη, αναγνωριστικό Instagram, κείμενο σχολίου ή μηνύματος, κλικ.
          </p>

          <h2 className="text-xl font-semibold text-black mt-4">Πώς</h2>
          <ol className="list-decimal pl-5 flex flex-col gap-2">
            <li>
              Στείλτε email στο <a href="mailto:hello@withinsuccess.gr?subject=Διαγραφή δεδομένων" className="underline">hello@withinsuccess.gr</a> με
              θέμα «Διαγραφή δεδομένων».
            </li>
            <li>Γράψτε το όνομα χρήστη σας στο Instagram ή το email σας.</li>
          </ol>
          <p>Διαγράφουμε τα δεδομένα σας μέσα σε 30 ημέρες και σας το επιβεβαιώνουμε με email.</p>

          <h2 className="text-xl font-semibold text-black mt-4">English</h2>
          <p>
            To delete the data we received from Instagram (username, Instagram-scoped ID, comment or message text, link clicks)
            or any other data we hold about you, email{' '}
            <a href="mailto:hello@withinsuccess.gr?subject=Data deletion" className="underline">hello@withinsuccess.gr</a> with
            the subject «Data deletion» and your Instagram username or email. We delete it within 30 days and confirm by email.
          </p>

          <p className="text-sm text-gray-400 mt-6">
            Ατομική επιχείρηση «ΠΡΟΚΟΠΙΟΣ ΚΟΥΚΗΣ», Ηρακλείου 4, Γλυφάδα 16675. Δείτε και την{' '}
            <Link href="/privacy" className="underline">Πολιτική Απορρήτου</Link>.
          </p>
        </div>
      </div>
    </main>
  )
}
