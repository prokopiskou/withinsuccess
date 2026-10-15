// ============================================================
// «Ανοιχτή Συζήτηση με τον Προκόπη» — ρυθμίσεις εκδήλωσης
// Όλα όσα αλλάζουν (χώρος, θέσεις, ώρες) είναι ΜΟΝΟ εδώ.
// ============================================================

export const SEMINAR = {
  slug: 'anoixti-syzitisi',
  title: 'Ανοιχτή Συζήτηση με τον Προκόπη',
  subtitle: 'Ξεκάθαρες απαντήσεις σε πραγματικές ερωτήσεις.',

  dateLabel: 'Κυριακή 15 Νοεμβρίου 2026',
  timeLabel: '11:00 – 13:30',
  // ISO με ώρα Ελλάδας (Νοέμβριος = UTC+2)
  startsAt: '2026-11-15T11:00:00+02:00',
  endsAt: '2026-11-15T13:30:00+02:00',

  venueName: 'Ιωνικό Κέντρο' as string | null,
  venueAddress: 'Λυσίου 11, Πλάκα' as string | null,
  city: 'Αθήνα',

  // TODO: βάλε τον ακριβή αριθμό θέσεων του χώρου.
  liveCapacity: 80,

  priceEur: 15,
} as const

export type SeminarTicket = 'seminar_live' | 'seminar_online'

export const SEMINAR_TICKETS: Record<SeminarTicket, { name: string; short: string }> = {
  seminar_live: { name: 'Ανοιχτή Συζήτηση 15/11 · Δια ζώσης', short: 'Δια ζώσης' },
  seminar_online: { name: 'Ανοιχτή Συζήτηση 15/11 · Online', short: 'Online' },
}

/** Πωλήσεις κλείνουν με την έναρξη της εκδήλωσης. */
export function isSeminarSalesClosed(now: number = Date.now()): boolean {
  return now >= new Date(SEMINAR.startsAt).getTime()
}

export function isSeminarTicket(p: unknown): p is SeminarTicket {
  return p === 'seminar_live' || p === 'seminar_online'
}
