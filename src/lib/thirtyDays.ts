// ============================================================
// 30 μέρες — κλείσιμο εγγραφών
// Μετά από αυτή τη στιγμή: κανένα κουμπί πληρωμής, μόνο waitlist.
// Για νέο κύκλο: άλλαξε την ημερομηνία (ή βάλε null για ανοιχτές εγγραφές).
// ============================================================
export const THIRTY_DAYS_CLOSES_AT: number | null = null  // ανοιχτές εγγραφές (άμεση πρόσβαση)

export function isThirtyDaysClosed(now: number = Date.now()): boolean {
  return THIRTY_DAYS_CLOSES_AT !== null && now >= THIRTY_DAYS_CLOSES_AT
}

// ============================================================
// 30 μέρες — τιμή & προσφορά (Black Friday)
// Η προσφορά ανοίγει και κλείνει ΜΟΝΗ της. Ο server (create-session) είναι
// αυτός που αποφασίζει τι χρεώνεται· η σελίδα απλώς το δείχνει.
// ============================================================
export const THIRTY_DAYS_PRICE = 15

export const THIRTY_DAYS_PROMO = {
  label: 'Black Friday',
  price: 9,
  startsAt: Date.parse('2026-11-23T18:00:00+02:00'),
  endsAt: Date.parse('2026-11-30T23:59:59+02:00'),
  endsLabel: 'Δευτέρα 30/11, 23:59',
  // Όσοι αγοράζουν στην προσφορά ξεκινάνε ΟΛΟΙ ΜΑΖΙ
  cohortLabel: 'Ξεκινάμε όλοι μαζί Τρίτη 1/12',
} as const

export function isThirtyDaysPromo(now: number = Date.now()): boolean {
  return now >= THIRTY_DAYS_PROMO.startsAt && now <= THIRTY_DAYS_PROMO.endsAt
}

export function thirtyDaysPrice(now: number = Date.now()): number {
  return isThirtyDaysPromo(now) ? THIRTY_DAYS_PROMO.price : THIRTY_DAYS_PRICE
}
