/**
 * Checks if a suggested fix is a real fix (not placeholder text).
 * Placeholder text typically starts with "[" or contains "Enter " instructions.
 * 
 * @param suggestedFix - The suggested fix string to validate
 * @returns true if the fix is real (not placeholder), false otherwise
 */
export function hasRealSuggestedFix(suggestedFix: string | undefined): boolean {
  if (!suggestedFix || suggestedFix.trim().length === 0) {
    return false;
  }
  
  // Check for placeholder patterns
  if (suggestedFix.startsWith("[") || suggestedFix.includes("Enter ")) {
    return false;
  }
  
  return true;
}
