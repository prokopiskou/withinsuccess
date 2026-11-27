'use client'

export default function PrintButton() {
  return (
    <button onClick={() => window.print()} className="bg-black text-white text-sm px-5 py-2 rounded-full">
      Εκτύπωση / PDF
    </button>
  )
}
