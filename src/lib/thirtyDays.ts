// ============================================================
// 30 μέρες — κλείσιμο εγγραφών
// Μετά από αυτή τη στιγμή: κανένα κουμπί πληρωμής, μόνο waitlist.
// Για νέο κύκλο: άλλαξε την ημερομηνία (ή βάλε null για ανοιχτές εγγραφές).
// ============================================================
export const THIRTY_DAYS_CLOSES_AT: number | null = null  // ανοιχτές εγγραφές (άμεση πρόσβαση)

export function isThirtyDaysClosed(now: number = Date.now()): boolean {
  return THIRTY_DAYS_CLOSES_AT !== null && now >= THIRTY_DAYS_CLOSES_AT
}
