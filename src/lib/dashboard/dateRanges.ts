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

/**
 * Get the previous period for a given date range, for comparison.
 * - Today → Yesterday
 * - WTD → Previous week's same days
 * - MTD → Previous month's same days
 * - YTD → Previous year's YTD
 * - Last30 → 30-60 days ago
 * - All → null (no previous comparison)
 */
export function getPreviousDateRange(preset: DateRangePreset, current: DateRange): DateRange | null {
  const { start, end } = current
  const durationMs = end.getTime() - start.getTime()

  switch (preset) {
    case 'all':
      return null

    case 'today': {
      const yesterday = subDays(start, 1)
      return {
        start: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0),
        end: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59),
        label: 'Χθες',
      }
    }

    case 'yesterday': {
      const twoDaysAgo = subDays(start, 1)
      return {
        start: new Date(twoDaysAgo.getFullYear(), twoDaysAgo.getMonth(), twoDaysAgo.getDate(), 0, 0, 0),
        end: new Date(twoDaysAgo.getFullYear(), twoDaysAgo.getMonth(), twoDaysAgo.getDate(), 23, 59, 59),
        label: 'Προ-χθες',
      }
    }

    case 'wtd':
      return {
        start: subDays(start, 7),
        end: subDays(end, 7),
        label: 'Προηγ. εβδομάδα',
      }

    case 'mtd': {
      const prevMonthEnd = subDays(start, 1)
      const prevMonthStart = new Date(prevMonthEnd.getFullYear(), prevMonthEnd.getMonth(), 1)
      const sameDayPrevMonth = new Date(prevMonthEnd.getFullYear(), prevMonthEnd.getMonth(), end.getDate())
      return {
        start: prevMonthStart,
        end: sameDayPrevMonth,
        label: 'Προηγ. μήνας',
      }
    }

    case 'ytd': {
      const prevYearStart = new Date(start.getFullYear() - 1, 0, 1)
      const prevYearEnd = new Date(start.getFullYear() - 1, end.getMonth(), end.getDate())
      return {
        start: prevYearStart,
        end: prevYearEnd,
        label: 'Προηγ. έτος',
      }
    }

    case 'last7': {
      const prevEnd = subDays(start, 1)
      return {
        start: subDays(prevEnd, 7),
        end: prevEnd,
        label: 'Προηγ. 7 ημέρες',
      }
    }

    case 'last30': {
      const prevEnd = subDays(start, 1)
      return {
        start: subDays(prevEnd, 30),
        end: prevEnd,
        label: 'Προηγ. 30 ημέρες',
      }
    }

    default: {
      // Generic: shift back by duration
      const prevEnd = new Date(start.getTime() - 1)
      const prevStart = new Date(prevEnd.getTime() - durationMs)
      return {
        start: prevStart,
        end: prevEnd,
        label: 'Προηγ. περίοδος',
      }
    }
  }
}

/**
 * Calculate percent change between two values.
 * Returns null if previous is 0 (avoid divide-by-zero).
 */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null
  return ((current - previous) / previous) * 100
}
