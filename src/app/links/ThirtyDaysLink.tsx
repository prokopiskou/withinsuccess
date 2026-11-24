'use client'

import LinkButton from './LinkButton'
import { useThirtyDaysOffer } from '@/components/ThirtyDaysOffer'

/** Κουμπί 30 ημερών: στο Black Friday τονίζεται με πλαίσιο, badge και έναρξη 1/12. Μετά γυρνάει μόνο του. */
export default function ThirtyDaysLink() {
  const { promo } = useThirtyDaysOffer()
  return (
    <LinkButton
      href="/30days"
      title="Πρόγραμμα μεταμόρφωσης 30 ημερών"
      subtitle={promo ? 'Έναρξη 1/12 · όλοι μαζί' : 'Άμεση πρόσβαση'}
      symbol="◈"
      destination="30days"
      featured={promo}
      badge={promo ? 'Black Friday −40%' : undefined}
    />
  )
}
