'use client'

import { useEffect, useRef } from 'react'
import { trackViewPricing, trackScrollDepth } from '@/lib/analytics'

// ============================================================
// useViewPricing — Tracks when pricing section enters viewport
// Usage: const pricingRef = useViewPricing('63days')
//        <div ref={pricingRef}>...pricing content...</div>
// ============================================================
export function useViewPricing(pageName: string) {
  const ref = useRef<HTMLElement | null>(null)
  const firedRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    let observer: IntersectionObserver | null = null
    let rafId: number | null = null
    let frameCount = 0
    const maxFrames = 120

    const tryAttach = () => {
      if (cancelled || firedRef.current) return
      const element = ref.current
      if (!element) {
        if (frameCount++ < maxFrames) {
          rafId = requestAnimationFrame(tryAttach)
        }
        return
      }

      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && entry.intersectionRatio >= 0.5 && !firedRef.current) {
              trackViewPricing(pageName)
              firedRef.current = true
              observer?.disconnect()
            }
          })
        },
        { threshold: 0.5 }
      )

      observer.observe(element)
    }

    rafId = requestAnimationFrame(tryAttach)

    return () => {
      cancelled = true
      if (rafId != null) cancelAnimationFrame(rafId)
      observer?.disconnect()
    }
  }, [pageName])

  return ref
}

// ============================================================
// useScrollDepth — Tracks 25%, 50%, 75%, 100% scroll milestones
// Usage: useScrollDepth('63days')
// ============================================================
export function useScrollDepth(pageName: string) {
  const firedRef = useRef<Set<number>>(new Set())

  useEffect(() => {
    function calculateDepth(): number {
      const scrollTop = window.scrollY || document.documentElement.scrollTop
      const docHeight = 
        document.documentElement.scrollHeight - window.innerHeight
      
      if (docHeight <= 0) return 100
      
      const percent = (scrollTop / docHeight) * 100
      return Math.round(percent)
    }

    function handleScroll() {
      const depth = calculateDepth()
      const milestones: (25 | 50 | 75 | 100)[] = [25, 50, 75, 100]

      milestones.forEach((milestone) => {
        if (depth >= milestone && !firedRef.current.has(milestone)) {
          trackScrollDepth(milestone, pageName)
          firedRef.current.add(milestone)
        }
      })
    }

    // Throttle to avoid excessive calls
    let timeoutId: NodeJS.Timeout | null = null
    function throttledHandler() {
      if (timeoutId) return
      timeoutId = setTimeout(() => {
        handleScroll()
        timeoutId = null
      }, 200)
    }

    window.addEventListener('scroll', throttledHandler, { passive: true })
    handleScroll() // Check initial position

    return () => {
      window.removeEventListener('scroll', throttledHandler)
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [pageName])
}
