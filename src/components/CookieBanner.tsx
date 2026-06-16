'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { getConsent, acceptAll, rejectAll } from '@/lib/consent'
import CookiePreferencesModal from './CookiePreferencesModal'

export default function CookieBanner() {
  const [show, setShow] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()

  // Το cookie banner ΔΕΝ εμφανίζεται στο /links (Linktree-style σελίδα)
  const hideOnRoute = pathname === '/links'

  useEffect(() => {
    setMounted(true)
    
    // Show banner only if no consent saved yet
    const existing = getConsent()
    if (!existing) {
      // Small delay for smooth UX (let page load first)
      const timer = setTimeout(() => setShow(true), 800)
      return () => clearTimeout(timer)
    }
  }, [])

  // Listen for "reopen preferences" event from CookieTrigger
  useEffect(() => {
    function handleOpen() {
      setShowModal(true)
    }
    window.addEventListener('open-cookie-preferences', handleOpen)
    return () => window.removeEventListener('open-cookie-preferences', handleOpen)
  }, [])

  if (!mounted) return null
  if (hideOnRoute) return null

  function handleAccept() {
    acceptAll()
    setShow(false)
  }

  function handleReject() {
    rejectAll()
    setShow(false)
  }

  function handleManage() {
    setShowModal(true)
  }

  return (
    <>
      {show && (
        <div 
          className="fixed bottom-4 right-4 left-4 md:left-auto md:max-w-[400px] z-[60] animate-in slide-in-from-bottom-4 fade-in duration-500"
          role="dialog"
          aria-labelledby="cookie-banner-title"
          aria-describedby="cookie-banner-description"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
            {/* Gold accent line */}
            <div className="h-1" style={{ backgroundColor: '#C9A96E' }} />
            
            <div className="p-6">
              <h3 
                id="cookie-banner-title"
                className="text-lg font-semibold mb-2"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                Σεβόμαστε τον χρόνο σου.
              </h3>
              
              <p 
                id="cookie-banner-description"
                className="text-sm text-gray-600 leading-relaxed mb-5"
              >
                Χρησιμοποιούμε cookies για να βελτιώσουμε την εμπειρία σου. 
                Μπορείς να αποδεχτείς όλα, να απορρίψεις τα μη απαραίτητα, ή να διαχειριστείς λεπτομερώς.{' '}
                <a 
                  href="/privacy" 
                  className="underline hover:text-black transition-colors"
                  style={{ color: '#8A6D2F' }}
                >
                  Πολιτική Απορρήτου
                </a>
              </p>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={handleAccept}
                  className="flex-1 bg-black text-white px-4 py-2.5 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  Αποδοχή
                </button>
                <button
                  onClick={handleReject}
                  className="flex-1 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  Απόρριψη
                </button>
                <button
                  onClick={handleManage}
                  className="flex-1 text-gray-500 px-4 py-2.5 rounded-full text-sm font-medium hover:text-black transition-colors underline-offset-2 hover:underline"
                >
                  Διαχείριση
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <CookiePreferencesModal 
        open={showModal}
        onClose={() => {
          setShowModal(false)
          setShow(false)  // Hide banner too once preferences saved
        }}
      />
    </>
  )
}
