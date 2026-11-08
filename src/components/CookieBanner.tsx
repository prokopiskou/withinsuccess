'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { getConsent, acceptAll, rejectAll } from '@/lib/consent'
import CookiePreferencesModal from './CookiePreferencesModal'

export default function CookieBanner() {
  const [show, setShow] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [mounted, setMounted] = useState(false)
  const barRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  // Το cookie banner ΔΕΝ εμφανίζεται στο /links (Linktree-style σελίδα)
  const hideOnRoute = pathname === '/links'
  // Στις landing του 30days και της Ανοιχτής Συζήτησης: λεπτή μπάρα αντί για κάρτα (λιγότερη τριβή στο κινητό)
  const slimBar =
    pathname === '/30days' ||
    pathname === '/30days-tt' ||
    pathname?.startsWith('/anoixti-syzitisi')

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

  // Ύψος της μπάρας ως CSS μεταβλητή (--cookie-h), για να κάθεται από πάνω το sticky CTA
  useEffect(() => {
    const root = document.documentElement
    const el = barRef.current
    if (!show || !slimBar || !el) {
      root.style.setProperty('--cookie-h', '0px')
      return
    }
    const set = () => root.style.setProperty('--cookie-h', `${el.offsetHeight}px`)
    set()
    const ro = new ResizeObserver(set)
    ro.observe(el)
    return () => {
      ro.disconnect()
      root.style.setProperty('--cookie-h', '0px')
    }
  }, [show, slimBar])

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
      {show && slimBar && (
        <div
          ref={barRef}
          className="fixed bottom-0 left-0 right-0 z-[60] bg-white border-t border-gray-200 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] pb-[env(safe-area-inset-bottom)]"
          role="dialog"
          aria-labelledby="cookie-slim-title"
        >
          <div className="max-w-3xl mx-auto px-4 pt-3 pb-3 md:flex md:items-center md:gap-6">
            <div className="md:flex-1">
              <p id="cookie-slim-title" className="text-sm font-semibold text-black">
                Επιτρέπεις τα cookies;
              </p>
              <p className="text-xs leading-snug text-gray-600 mt-0.5">
                Μας βοηθούν να βελτιώνουμε τη σελίδα και να σου δείχνουμε μόνο ό,τι σε αφορά.{' '}
                <a href="/privacy" className="underline hover:text-black">Πολιτική</a>
                {' · '}
                <button type="button" onClick={handleManage} className="underline hover:text-black">Ρυθμίσεις</button>
              </p>
            </div>
            <div className="mt-2.5 md:mt-0 grid grid-cols-2 gap-2 md:w-[280px]">
              <button
                type="button"
                onClick={handleReject}
                className="py-2.5 rounded-full text-sm font-medium border border-black text-black hover:bg-gray-50"
              >
                Απόρριψη
              </button>
              <button
                type="button"
                onClick={handleAccept}
                className="py-2.5 rounded-full text-sm font-medium border border-black bg-black text-white hover:bg-gray-800"
              >
                Αποδοχή
              </button>
            </div>
          </div>
        </div>
      )}

      {show && !slimBar && (
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
