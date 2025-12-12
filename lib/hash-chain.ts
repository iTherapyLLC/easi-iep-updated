import crypto from "crypto"

// Generate a hash for audit logging
export function generateHash(data: {
  eventType: string
  eventData: Record<string, unknown>
  timestamp: Date
  previousHash: string
}): string {
  const payload = JSON.stringify({
    eventType: data.eventType,
    eventData: data.eventData,
    timestamp: data.timestamp.toISOString(),
    previousHash: data.previousHash,
  })

  return crypto.createHash("sha256").update(payload).digest("hex")
}

// Verify a hash chain entry
export function verifyHash(entry: {
  eventType: string
  eventData: Record<string, unknown>
  timestamp: Date
  previousHash: string
  currentHash: string
}): boolean {
  const expectedHash = generateHash({
    eventType: entry.eventType,
    eventData: entry.eventData,
    timestamp: entry.timestamp,
    previousHash: entry.previousHash,
  })

  return expectedHash === entry.currentHash
}
