import { 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth,
  startOfYear,
  endOfYear,
  subDays,
  format,
} from 'date-fns'

export type DateRangePreset = 'today' | 'yesterday' | 'wtd' | 'mtd' | 'ytd' | 'last7' | 'last30' | 'all'

export type DateRange = {
  start: Date
  end: Date
  label: string
}

const ALL_TIME_START = new Date('2024-01-01T00:00:00.000Z')

export function getDateRange(preset: DateRangePreset): DateRange {
  const now = new Date()

  switch (preset) {
    case 'today':
      return {
        start: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0),
        end: now,
        label: 'Σήμερα',
      }

    case 'yesterday': {
      const yesterday = subDays(now, 1)
      return {
        start: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0),
        end: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59),
        label: 'Χθες',
      }
    }

    case 'wtd':
      return {
        start: startOfWeek(now, { weekStartsOn: 1 }),
        end: now,
        label: 'Αυτή την εβδομάδα',
      }

    case 'mtd':
      return {
        start: startOfMonth(now),
        end: now,
        label: 'Αυτόν τον μήνα',
      }

    case 'ytd':
      return {
        start: startOfYear(now),
        end: now,
        label: 'Φέτος',
      }

    case 'last7':
      return {
        start: subDays(now, 7),
        end: now,
        label: 'Τελευταίες 7 ημέρες',
      }

    case 'last30':
      return {
        start: subDays(now, 30),
        end: now,
        label: 'Τελευταίες 30 ημέρες',
      }

    case 'all':
      return {
        start: ALL_TIME_START,
        end: now,
        label: 'Όλη η περίοδος',
      }

    default:
      return getDateRange('last30')
  }
}

export function formatDateRange(range: DateRange): string {
  return `${format(range.start, 'dd/MM/yyyy')} — ${format(range.end, 'dd/MM/yyyy')}`
}
