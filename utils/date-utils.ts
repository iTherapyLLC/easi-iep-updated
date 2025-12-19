/**
 * Date utilities for flexible date parsing and formatting
 * Supports multiple input formats and validates date existence
 */

// Constants for date validation
const MIN_INPUT_LENGTH = 6 // Minimum for shortest valid format like "1/1/22"
const MIN_YEAR = 1900 // Earliest reasonable birth year for IEPs
const MAX_YEAR = 2100 // Latest reasonable year for date entries

// Flexible date parser - accepts multiple formats, returns ISO (YYYY-MM-DD) or null
export function parseDateFlexible(input: string): string | null {
  if (!input || input.trim().length < MIN_INPUT_LENGTH) return null
  
  const cleaned = input.trim()
  
  // Try ISO format first: YYYY-MM-DD
  const isoMatch = cleaned.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (isoMatch) {
    const [, year, month, day] = isoMatch
    if (isValidDate(parseInt(year), parseInt(month), parseInt(day))) {
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    }
  }
  
  // Try US format: MM/DD/YYYY or M/D/YYYY
  const usMatch = cleaned.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
  if (usMatch) {
    const [, month, day, year] = usMatch
    if (isValidDate(parseInt(year), parseInt(month), parseInt(day))) {
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    }
  }
  
  // Try written format: "June 18, 2019" or "Jun 18 2019"
  const months: Record<string, number> = {
    january: 1, jan: 1,
    february: 2, feb: 2,
    march: 3, mar: 3,
    april: 4, apr: 4,
    may: 5,
    june: 6, jun: 6,
    july: 7, jul: 7,
    august: 8, aug: 8,
    september: 9, sep: 9, sept: 9,
    october: 10, oct: 10,
    november: 11, nov: 11,
    december: 12, dec: 12
  }
  
  const writtenMatch = cleaned.match(/^([a-zA-Z]+)\s+(\d{1,2}),?\s*(\d{4})$/)
  if (writtenMatch) {
    const [, monthStr, day, year] = writtenMatch
    const month = months[monthStr.toLowerCase()]
    if (month && isValidDate(parseInt(year), month, parseInt(day))) {
      return `${year}-${String(month).padStart(2, '0')}-${day.padStart(2, '0')}`
    }
  }
  
  return null
}

// Validate that date actually exists (handles Feb 30, etc.)
export function isValidDate(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12) return false
  if (day < 1 || day > 31) return false
  if (year < MIN_YEAR || year > MAX_YEAR) return false
  
  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year && 
         date.getMonth() === month - 1 && 
         date.getDate() === day
}

// Format ISO date for display
export function formatDateForDisplay(isoDate: string | undefined): string {
  if (!isoDate) return ''
  
  const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (match) {
    const [, year, month, day] = match
    return `${month}/${day}/${year}`
  }
  
  return isoDate // Return as-is if not ISO format
}
