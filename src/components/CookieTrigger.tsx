'use client'

import { useEffect, useState } from 'react'
import { getConsent } from '@/lib/consent'

export default function CookieTrigger() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Show trigger only if user has already given consent (so banner is hidden)
    const check = () => {
      setShow(!!getConsent())
    }
    
    check()
    window.addEventListener('consent-updated', check)
    return () => window.removeEventListener('consent-updated', check)
  }, [])

  function handleClick() {
    window.dispatchEvent(new CustomEvent('open-cookie-preferences'))
  }

  if (!show) return null

  return (
    <button
      onClick={handleClick}
      aria-label="Διαχείριση Cookies"
      className="fixed bottom-4 left-4 z-40 w-11 h-11 bg-white border border-gray-200 rounded-full shadow-md hover:shadow-lg transition-shadow flex items-center justify-center group"
      title="Διαχείριση cookies"
    >
      <svg 
        width="20" 
        height="20" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2"
        className="text-gray-500 group-hover:text-black transition-colors"
      >
        <circle cx="12" cy="12" r="10" />
        <circle cx="8" cy="9" r="1" fill="currentColor" />
        <circle cx="15" cy="10" r="1" fill="currentColor" />
        <circle cx="10" cy="14" r="1" fill="currentColor" />
        <circle cx="14" cy="15" r="1" fill="currentColor" />
      </svg>
    </button>
  )
}
