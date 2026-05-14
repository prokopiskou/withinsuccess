'use client'

export default function ClosedBanner() {
  return (
    <div 
      className="w-full py-3 px-4 text-center"
      style={{ 
        backgroundColor: '#1A1A1A',
        color: 'white',
      }}
    >
      <p className="text-xs sm:text-sm tracking-wide">
        <span className="font-semibold mr-2">🔒 Πρόγραμμα κλειστό</span>
        <span className="text-gray-300 mx-2">·</span>
        <a 
          href="#waitlist" 
          className="underline hover:opacity-80 transition-opacity"
          style={{ color: '#C9A96E' }}
        >
          Μπες στη waitlist ↓
        </a>
      </p>
    </div>
  )
}
