'use client'

import { useEffect } from 'react'
import { captureUTMs } from '@/lib/utmCapture'

/**
 * Mount on landing pages to capture UTMs.
 * Renders nothing — just runs side effect on mount.
 */
export default function UTMCapture() {
  useEffect(() => {
    captureUTMs()
  }, [])

  return null
}
