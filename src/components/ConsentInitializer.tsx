'use client'

import { useEffect } from 'react'
import { initializeConsent } from '@/lib/consent'

export default function ConsentInitializer() {
  useEffect(() => {
    initializeConsent()
  }, [])
  
  return null
}
