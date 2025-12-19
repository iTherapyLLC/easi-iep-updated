/**
 * Utility functions for IEP calculations
 */

/**
 * Calculate age from date of birth
 * @param dob - Date of birth string in various formats (MM/DD/YYYY, YYYY-MM-DD, etc.)
 * @returns Age as a number, or null if invalid date
 */
export function calculateAge(dob: string | undefined | null): number | null {
  if (!dob) return null

  try {
    // Parse the date string - handles various formats
    const birthDate = new Date(dob)
    
    // Check if date is valid
    if (isNaN(birthDate.getTime())) return null

    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    // Adjust age if birthday hasn't occurred yet this year
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    
    return age
  } catch (error) {
    console.error("Error calculating age:", error)
    return null
  }
}

/**
 * Calculate next annual review date (1 year from current IEP date)
 * @param currentIEPDate - Current IEP date string in various formats
 * @returns Next annual review date string (YYYY-MM-DD), or null if invalid
 */
export function calculateNextAnnualReview(currentIEPDate: string | undefined | null): string | null {
  if (!currentIEPDate) return null

  try {
    const iepDate = new Date(currentIEPDate)
    
    // Check if date is valid
    if (isNaN(iepDate.getTime())) return null

    // Add one year
    const nextReview = new Date(iepDate)
    nextReview.setFullYear(nextReview.getFullYear() + 1)
    
    // Return in YYYY-MM-DD format
    return nextReview.toISOString().split('T')[0]
  } catch (error) {
    console.error("Error calculating next annual review date:", error)
    return null
  }
}

/**
 * Calculate current grade level based on previous grade and IEP date
 * Increments grade if we've crossed into a new school year (after August)
 * @param previousGrade - Previous grade level (e.g., "3", "4th", "K", "Pre-K")
 * @param previousIEPDate - Date of previous IEP
 * @returns Current grade level string, or original grade if can't calculate
 */
export function calculateCurrentGrade(
  previousGrade: string | undefined | null,
  previousIEPDate: string | undefined | null
): string {
  if (!previousGrade) return "Not specified"

  try {
    // If no date provided, return original grade
    if (!previousIEPDate) return previousGrade

    const iepDate = new Date(previousIEPDate)
    if (isNaN(iepDate.getTime())) return previousGrade

    const now = new Date()
    
    // Determine if we've crossed a school year boundary
    // School year typically starts in August/September
    const iepYear = iepDate.getFullYear()
    const iepMonth = iepDate.getMonth() // 0-11
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()
    
    // Calculate how many school years have passed
    let schoolYearsPassed = 0
    
    // If IEP was before September and we're now after August of a later year
    if (iepMonth < 8 && currentYear > iepYear) {
      // IEP in spring/summer, count full school years since then
      schoolYearsPassed = currentYear - iepYear
    } else if (iepMonth >= 8 && currentYear > iepYear) {
      // IEP in fall, count school years
      if (currentMonth >= 8) {
        schoolYearsPassed = currentYear - iepYear
      } else {
        schoolYearsPassed = currentYear - iepYear - 1
      }
    } else if (iepMonth < 8 && currentMonth >= 8 && currentYear === iepYear) {
      // Same year, but crossed into new school year
      schoolYearsPassed = 1
    }
    
    if (schoolYearsPassed === 0) {
      return previousGrade
    }

    // Parse the grade number
    const gradeStr = previousGrade.toLowerCase().trim()
    
    // Handle special cases
    if (gradeStr.includes("pre-k") || gradeStr.includes("prek")) {
      return schoolYearsPassed >= 1 ? "K" : previousGrade
    }
    if (gradeStr === "k" || gradeStr === "kindergarten") {
      return schoolYearsPassed >= 1 ? "1" : previousGrade
    }
    
    // Extract numeric grade
    const gradeMatch = gradeStr.match(/\d+/)
    if (gradeMatch) {
      const gradeNum = parseInt(gradeMatch[0], 10)
      const newGrade = gradeNum + schoolYearsPassed
      
      // Cap at 12th grade
      if (newGrade > 12) return "12"
      
      return newGrade.toString()
    }
    
    // If we can't parse, return original
    return previousGrade
  } catch (error) {
    console.error("Error calculating current grade:", error)
    return previousGrade
  }
}

/**
 * Calculate total service minutes per week from services array
 * @param services - Array of service objects with frequency and duration
 * @returns Total minutes per week, or null if can't calculate
 */
export function calculateServiceMinutesTotals(
  services: Array<{
    frequency?: string
    duration?: string
  }> | undefined | null
): number | null {
  if (!services || services.length === 0) return null

  try {
    let totalMinutes = 0
    
    for (const service of services) {
      if (!service.frequency || !service.duration) continue
      
      // Parse duration (e.g., "30 minutes", "1 hour", "45 min")
      const durationStr = service.duration.toLowerCase()
      let minutes = 0
      
      // Extract number
      const durationMatch = durationStr.match(/(\d+)/)
      if (!durationMatch) continue
      
      const durationNum = parseInt(durationMatch[1], 10)
      
      // Convert to minutes
      if (durationStr.includes("hour")) {
        minutes = durationNum * 60
      } else {
        minutes = durationNum
      }
      
      // Parse frequency (e.g., "2x per week", "3 times weekly", "daily", "5x/week")
      const frequencyStr = service.frequency.toLowerCase()
      let timesPerWeek = 1
      
      if (frequencyStr.includes("daily")) {
        timesPerWeek = 5 // Assume school days
      } else {
        const frequencyMatch = frequencyStr.match(/(\d+)/)
        if (frequencyMatch) {
          timesPerWeek = parseInt(frequencyMatch[1], 10)
        }
      }
      
      totalMinutes += minutes * timesPerWeek
    }
    
    return totalMinutes > 0 ? totalMinutes : null
  } catch (error) {
    console.error("Error calculating service minutes:", error)
    return null
  }
}

/**
 * Format minutes into a human-readable string
 * @param minutes - Total minutes
 * @returns Formatted string (e.g., "150 minutes (2.5 hours)")
 */
export function formatServiceMinutes(minutes: number | null): string {
  if (!minutes) return "Not calculated"
  
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  
  if (hours === 0) {
    return `${minutes} minutes`
  } else if (remainingMinutes === 0) {
    return `${minutes} minutes (${hours} hour${hours > 1 ? 's' : ''})`
  } else {
    const decimalHours = (minutes / 60).toFixed(1)
    return `${minutes} minutes (${decimalHours} hours)`
  }
}
