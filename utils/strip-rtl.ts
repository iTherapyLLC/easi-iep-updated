/**
 * Strips ALL Unicode directional formatting characters from text.
 * This platform is English-only - there is no legitimate use for RTL.
 * These invisible characters cause text to display backwards.
 */
export function stripRTL(str: string | null | undefined): string {
  if (!str) return '';
  // Remove ALL Unicode directional formatting characters
  // \u200E - LTR Mark, \u200F - RTL Mark
  // \u202A-\u202E - Embedding/Override characters
  // \u2066-\u2069 - Isolate characters
  return str.replace(/[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, '');
}
