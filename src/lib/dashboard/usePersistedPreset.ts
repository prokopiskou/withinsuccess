'use client'

import { useEffect, useState } from 'react'
import type { DateRangePreset } from './dateRanges'

const STORAGE_KEY = 'dashboard_preset'

export function usePersistedPreset(defaultPreset: DateRangePreset = 'last30'): [DateRangePreset, (p: DateRangePreset) => void] {
  const [preset, setPresetState] = useState<DateRangePreset>(defaultPreset)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        setPresetState(saved as DateRangePreset)
      }
    } catch {}
    setHydrated(true)
  }, [])

  const setPreset = (p: DateRangePreset) => {
    setPresetState(p)
    try {
      localStorage.setItem(STORAGE_KEY, p)
    } catch {}
  }

  return [hydrated ? preset : defaultPreset, setPreset]
}
