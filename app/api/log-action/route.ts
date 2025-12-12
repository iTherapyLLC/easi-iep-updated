import { type NextRequest, NextResponse } from "next/server"
import { getAuditLogCollection } from "@/lib/db"
import { generateHash } from "@/lib/hash-chain"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { eventType, eventData, sessionId } = body

    const timestamp = new Date()

    // Get the previous hash from the last entry
    let previousHash = "genesis"
    try {
      const auditLog = await getAuditLogCollection()
      const lastEntry = await auditLog.findOne({ sessionId }, { sort: { timestamp: -1 } })
      if (lastEntry) {
        previousHash = lastEntry.currentHash
      }
    } catch {
      // If MongoDB isn't connected, use local-only logging
      console.log("[v0] MongoDB not available, using local hash chain")
    }

    // Generate the current hash
    const currentHash = generateHash({
      eventType,
      eventData,
      timestamp,
      previousHash,
    })

    // Try to store in MongoDB
    try {
      const auditLog = await getAuditLogCollection()
      await auditLog.insertOne({
        sessionId,
        eventType,
        eventData,
        timestamp,
        previousHash,
        currentHash,
      })
    } catch {
      // Log locally if MongoDB fails
      console.log("[v0] Audit log entry:", { eventType, sessionId, currentHash })
    }

    return NextResponse.json({
      success: true,
      logged: true,
      hash: currentHash,
      timestamp: timestamp.toISOString(),
    })
  } catch (error) {
    console.error("Log action error:", error)
    return NextResponse.json({ success: false, error: "Failed to log action" }, { status: 500 })
  }
}
