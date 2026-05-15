import { startOfWeek, startOfMonth, startOfYear, subDays, endOfDay, startOfDay } from 'date-fns'
import { fromZonedTime, toZonedTime } from 'date-fns-tz'

const ATHENS_TZ = 'Europe/Athens'

export type DateRangePreset = 
  | 'today'
  | 'yesterday'
  | 'wtd'
  | 'mtd'
  | 'last7'
  | 'last30'
  | 'last90'
  | 'ytd'
  | 'all'

export type DateRange = {
  start: Date
  end: Date
  label: string
}

function nowInAthens(): Date {
  return toZonedTime(new Date(), ATHENS_TZ)
}

function athensToUtc(athensDate: Date): Date {
  return fromZonedTime(athensDate, ATHENS_TZ)
}

export function getDateRange(preset: DateRangePreset): DateRange {
  const athensNow = nowInAthens()
  
  switch (preset) {
    case 'today': {
      const start = startOfDay(athensNow)
      return {
        start: athensToUtc(start),
        end: athensToUtc(athensNow),
        label: 'Σήμερα',
      }
    }
    case 'yesterday': {
      const yesterday = subDays(athensNow, 1)
      return {
        start: athensToUtc(startOfDay(yesterday)),
        end: athensToUtc(endOfDay(yesterday)),
        label: 'Χθες',
      }
    }
    case 'wtd': {
      const start = startOfWeek(athensNow, { weekStartsOn: 1 })
      return {
        start: athensToUtc(startOfDay(start)),
        end: athensToUtc(athensNow),
        label: 'WTD',
      }
    }
    case 'mtd': {
      const start = startOfMonth(athensNow)
      return {
        start: athensToUtc(startOfDay(start)),
        end: athensToUtc(athensNow),
        label: 'MTD',
      }
    }
    case 'last7': {
      const start = subDays(athensNow, 7)
      return {
        start: athensToUtc(startOfDay(start)),
        end: athensToUtc(athensNow),
        label: 'Τελευταίες 7 ημέρες',
      }
    }
    case 'last30': {
      const start = subDays(athensNow, 30)
      return {
        start: athensToUtc(startOfDay(start)),
        end: athensToUtc(athensNow),
        label: 'Τελευταίες 30 ημέρες',
      }
    }
    case 'last90': {
      const start = subDays(athensNow, 90)
      return {
        start: athensToUtc(startOfDay(start)),
        end: athensToUtc(athensNow),
        label: 'Τελευταίες 90 ημέρες',
      }
    }
    case 'ytd': {
      const start = startOfYear(athensNow)
      return {
        start: athensToUtc(startOfDay(start)),
        end: athensToUtc(athensNow),
        label: 'YTD',
      }
    }
    case 'all': {
      return {
        start: new Date('2020-01-01T00:00:00Z'),
        end: athensToUtc(athensNow),
        label: 'Όλος ο χρόνος',
      }
    }
  }
}

export function formatDateRange(range: DateRange): string {
  return range.label
}

/**
 * Get the previous period for a given date range, for comparison.
 */
export function getPreviousDateRange(preset: DateRangePreset, current: DateRange): DateRange | null {
  const { start, end } = current
  const durationMs = end.getTime() - start.getTime()

  switch (preset) {
    case 'all':
      return null

    case 'today':
      return getDateRange('yesterday')

    case 'yesterday': {
      const athensNow = nowInAthens()
      const twoDaysAgo = subDays(athensNow, 2)
      return {
        start: athensToUtc(startOfDay(twoDaysAgo)),
        end: athensToUtc(endOfDay(twoDaysAgo)),
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
      const athensEnd = toZonedTime(end, ATHENS_TZ)
      const prevMonthEnd = subDays(startOfMonth(athensEnd), 1)
      const prevMonthStart = startOfMonth(prevMonthEnd)
      const sameDay = Math.min(athensEnd.getDate(), prevMonthEnd.getDate())
      const prevEndAthens = new Date(
        prevMonthEnd.getFullYear(),
        prevMonthEnd.getMonth(),
        sameDay,
        athensEnd.getHours(),
        athensEnd.getMinutes(),
        athensEnd.getSeconds(),
        athensEnd.getMilliseconds()
      )
      return {
        start: athensToUtc(startOfDay(prevMonthStart)),
        end: athensToUtc(prevEndAthens),
        label: 'Προηγ. μήνας',
      }
    }

    case 'ytd': {
      const athensEnd = toZonedTime(end, ATHENS_TZ)
      const prevYearStart = new Date(athensEnd.getFullYear() - 1, 0, 1)
      const prevYearEnd = new Date(
        athensEnd.getFullYear() - 1,
        athensEnd.getMonth(),
        athensEnd.getDate(),
        athensEnd.getHours(),
        athensEnd.getMinutes(),
        athensEnd.getSeconds(),
        athensEnd.getMilliseconds()
      )
      return {
        start: athensToUtc(startOfDay(prevYearStart)),
        end: athensToUtc(prevYearEnd),
        label: 'Προηγ. έτος',
      }
    }

    case 'last7': {
      const athensStart = toZonedTime(start, ATHENS_TZ)
      const prevEnd = subDays(athensStart, 1)
      const prevStart = subDays(prevEnd, 7)
      return {
        start: athensToUtc(startOfDay(prevStart)),
        end: athensToUtc(endOfDay(prevEnd)),
        label: 'Προηγ. 7 ημέρες',
      }
    }

    case 'last30': {
      const athensStart = toZonedTime(start, ATHENS_TZ)
      const prevEnd = subDays(athensStart, 1)
      const prevStart = subDays(prevEnd, 30)
      return {
        start: athensToUtc(startOfDay(prevStart)),
        end: athensToUtc(endOfDay(prevEnd)),
        label: 'Προηγ. 30 ημέρες',
      }
    }

    case 'last90': {
      const athensStart = toZonedTime(start, ATHENS_TZ)
      const prevEnd = subDays(athensStart, 1)
      const prevStart = subDays(prevEnd, 90)
      return {
        start: athensToUtc(startOfDay(prevStart)),
        end: athensToUtc(endOfDay(prevEnd)),
        label: 'Προηγ. 90 ημέρες',
      }
    }

    default: {
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
