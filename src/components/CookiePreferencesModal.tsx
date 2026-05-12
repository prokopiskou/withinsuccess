'use client'

import { useEffect, useState } from 'react'
import { getConsent, saveConsent, acceptAll } from '@/lib/consent'

type Props = {
  open: boolean
  onClose: () => void
}

export default function CookiePreferencesModal({ open, onClose }: Props) {
  const [statistics, setStatistics] = useState(true)
  const [marketing, setMarketing] = useState(true)

  useEffect(() => {
    if (open) {
      const existing = getConsent()
      if (existing) {
        setStatistics(existing.statistics)
        setMarketing(existing.marketing)
      }
    }
  }, [open])

  // Lock body scroll when modal open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [open])

  if (!open) return null

  function handleSave() {
    saveConsent({ statistics, marketing })
    onClose()
  }

  function handleAcceptAll() {
    acceptAll()
    onClose()
  }

  return (
    <div 
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 animate-in fade-in duration-300"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-modal-title"
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Gold accent */}
        <div className="h-1" style={{ backgroundColor: '#C9A96E' }} />
        
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 
                id="cookie-modal-title"
                className="text-xl font-semibold"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                Προτιμήσεις Cookies
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Επίλεξε ποια cookies θες να ενεργοποιήσεις.
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Κλείσιμο"
              className="text-gray-400 hover:text-black transition-colors -mt-1 -mr-2 p-2"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Categories */}
        <div className="px-6 py-4 overflow-y-auto max-h-[50vh]">
          {/* NECESSARY */}
          <div className="py-4 border-b border-gray-100">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <h3 className="font-semibold text-sm">Απαραίτητα</h3>
                <p className="text-xs text-gray-400 mt-0.5">Πάντα ενεργά</p>
              </div>
              <div className="w-11 h-6 bg-gray-300 rounded-full flex items-center px-0.5 cursor-not-allowed">
                <div className="w-5 h-5 bg-white rounded-full ml-auto shadow-sm" />
              </div>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Απαραίτητα για τη βασική λειτουργία του site. Περιλαμβάνουν προτιμήσεις, ασφάλεια, και βασικές ρυθμίσεις.
            </p>
          </div>

          {/* STATISTICS */}
          <div className="py-4 border-b border-gray-100">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <h3 className="font-semibold text-sm">Στατιστικά</h3>
                <p className="text-xs text-gray-400 mt-0.5">Google Analytics</p>
              </div>
              <button
                onClick={() => setStatistics(!statistics)}
                role="switch"
                aria-checked={statistics}
                className="relative w-11 h-6 rounded-full transition-colors flex items-center px-0.5"
                style={{ backgroundColor: statistics ? '#C9A96E' : '#d1d5db' }}
              >
                <div 
                  className="w-5 h-5 bg-white rounded-full shadow-sm transition-transform"
                  style={{ transform: statistics ? 'translateX(20px)' : 'translateX(0)' }}
                />
              </button>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Μας βοηθούν να κατανοήσουμε πώς χρησιμοποιείς το site, ώστε να βελτιώσουμε την εμπειρία.
            </p>
          </div>

          {/* MARKETING */}
          <div className="py-4">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <h3 className="font-semibold text-sm">Marketing</h3>
                <p className="text-xs text-gray-400 mt-0.5">Meta Pixel</p>
              </div>
              <button
                onClick={() => setMarketing(!marketing)}
                role="switch"
                aria-checked={marketing}
                className="relative w-11 h-6 rounded-full transition-colors flex items-center px-0.5"
                style={{ backgroundColor: marketing ? '#C9A96E' : '#d1d5db' }}
              >
                <div 
                  className="w-5 h-5 bg-white rounded-full shadow-sm transition-transform"
                  style={{ transform: marketing ? 'translateX(20px)' : 'translateX(0)' }}
                />
              </button>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Μας επιτρέπουν να σου δείχνουμε πιο σχετικό περιεχόμενο και να μετράμε την απόδοση των διαφημίσεων.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleSave}
            className="flex-1 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            Αποθήκευση επιλογών
          </button>
          <button
            onClick={handleAcceptAll}
            className="flex-1 bg-black text-white px-4 py-2.5 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Αποδοχή όλων
          </button>
        </div>

        {/* Footer link */}
        <div className="px-6 py-3 border-t border-gray-100 text-center">
          <a 
            href="/privacy" 
            className="text-xs text-gray-400 hover:text-black transition-colors underline"
          >
            Διάβασε την Πολιτική Απορρήτου
          </a>
        </div>
      </div>
    </div>
  )
}
