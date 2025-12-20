/**
 * Strips ALL Unicode bidirectional and zero-width formatting characters.
 * This is an English-only platform - RTL text is NEVER valid.
 * These invisible characters cause text to display/type backwards.
 * 
 * Removed characters:
 * - \u200E, \u200F: LTR/RTL marks
 * - \u202A-\u202E: Embedding/Override characters  
 * - \u2066-\u2069: Isolate characters
 * - \u200B-\u200D: Zero-width spaces (word joiner, non-joiner, joiner)
 * - \uFEFF: Zero-width no-break space (BOM)
 */
export function stripRTL(text: string | null | undefined): string {
  if (!text) return '';
  return text.replace(/[\u200E\u200F\u202A-\u202E\u2066-\u2069\u200B-\u200D\uFEFF]/g, '');
}

/**
 * Recursively sanitize all string values in an object.
 * Use this to sanitize entire API responses.
 */
export function sanitizeObject<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') return stripRTL(obj) as T;
  if (Array.isArray(obj)) return obj.map(sanitizeObject) as T;
  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = sanitizeObject(value);
    }
    return result as T;
  }
  return obj;
}
