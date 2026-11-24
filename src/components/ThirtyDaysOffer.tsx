'use client'

import { useEffect, useState } from 'react'
import { THIRTY_DAYS_PRICE, THIRTY_DAYS_PROMO, isThirtyDaysPromo } from '@/lib/thirtyDays'

/** Τιμή 30 ημερών όπως ισχύει τώρα. Ανοίγει/κλείνει την προσφορά μόνο του, χωρίς refresh. */
export function useThirtyDaysOffer() {
  const [now, setNow] = useState<number>(() => Date.now())
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const t = setInterval(() => { setNow(Date.now()); setMounted(true) }, 1000)
    return () => clearInterval(t)
  }, [])
  const promo = isThirtyDaysPromo(now)
  return {
    promo,
    price: promo ? THIRTY_DAYS_PROMO.price : THIRTY_DAYS_PRICE,
    regular: THIRTY_DAYS_PRICE,
    // Η αντίστροφη μέτρηση δείχνεται μόνο στον browser (όχι στο SSR)
    msLeft: mounted && promo ? THIRTY_DAYS_PROMO.endsAt - now : null,
  }
}

function fmt(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000))
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return d > 0 ? `${d}μ ${pad(h)}ώ ${pad(m)}λ` : `${pad(h)}:${pad(m)}:${pad(sec)}`
}

/** Λεπτή μπάρα στην κορυφή όσο τρέχει η προσφορά */
export function ThirtyDaysPromoBar() {
  const { promo, msLeft } = useThirtyDaysOffer()
  if (!promo) return null
  return (
    <div className="bg-black text-white text-center text-xs md:text-sm px-4 py-2.5 tracking-wide">
      <span className="font-semibold" style={{ color: '#C9A96E' }}>{THIRTY_DAYS_PROMO.label.toUpperCase()}</span>
      <span className="mx-2 text-gray-500">·</span>
      <span>{THIRTY_DAYS_PROMO.price}€ αντί {THIRTY_DAYS_PRICE}€</span>
      <span className="mx-2 text-gray-500">·</span>
      <span className="text-gray-300">
        {msLeft !== null ? <>λήγει σε <span className="tabular-nums text-white">{fmt(msLeft)}</span></> : <>έως {THIRTY_DAYS_PROMO.endsLabel}</>}
      </span>
    </div>
  )
}

/** Banner για την αρχική: όλο κλικ προς /30days, μόνο όσο τρέχει η προσφορά */
export function ThirtyDaysHomeBanner() {
  const { promo } = useThirtyDaysOffer()
  if (!promo) return null
  return (
    <a
      href="/30days"
      className="block bg-black text-white text-center text-xs md:text-sm px-4 py-2.5 tracking-wide hover:bg-neutral-900 transition-colors"
    >
      <span className="font-semibold" style={{ color: '#C9A96E' }}>BLACK FRIDAY −40%</span>
      <span className="mx-2 text-gray-500">·</span>
      <span>30 Μέρες Μεταμόρφωσης</span>
      <span className="hidden sm:inline">
        <span className="mx-2 text-gray-500">·</span>
        <span className="text-gray-300">Έναρξη 1/12</span>
      </span>
      <span className="ml-2 underline underline-offset-4">Δες το →</span>
    </a>
  )
}

/** Κείμενο κουμπιού: «Ξεκίνα τώρα ~~15€~~ 9€ →» στην προσφορά */
export function ThirtyDaysCtaLabel() {
  const { promo, price, regular } = useThirtyDaysOffer()
  if (!promo) return <>Ξεκίνα τώρα {regular}€ →</>
  return <>Ξεκίνα τώρα <s className="opacity-50 mx-1">{regular}€</s> {price}€ →</>
}
