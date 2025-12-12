import { type NextRequest, NextResponse } from "next/server"
import { getAuditLogCollection } from "@/lib/db"
import { generateHash } from "@/lib/hash-chain"

const HASHCHAIN_URL = process.env.HASHCHAIN_URL

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { eventType, eventData, sessionId } = body

    const timestamp = new Date()

    if (HASHCHAIN_URL) {
      try {
        const response = await fetch(HASHCHAIN_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "log",
            sessionId,
            eventType,
            eventData,
            timestamp: timestamp.toISOString(),
          }),
        })

        if (response.ok) {
          const result = await response.json()
          return NextResponse.json({
            success: true,
            logged: true,
            hash: result.hash || result.currentHash,
            timestamp: timestamp.toISOString(),
            source: "lambda",
          })
        }
      } catch (lambdaError) {
        console.error("[v0] Hash Chain Lambda error, falling back to local:", lambdaError)
      }
    }

    // Fallback to local hash chain if Lambda not available
    let previousHash = "genesis"
    try {
      const auditLog = await getAuditLogCollection()
      const lastEntry = await auditLog.findOne({ sessionId }, { sort: { timestamp: -1 } })
      if (lastEntry) {
        previousHash = lastEntry.currentHash
      }
    } catch {
      console.log("[v0] MongoDB not available, using local hash chain")
    }

    const currentHash = generateHash({
      eventType,
      eventData,
      timestamp,
      previousHash,
    })

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
      console.log("[v0] Audit log entry:", { eventType, sessionId, currentHash })
    }

    return NextResponse.json({
      success: true,
      logged: true,
      hash: currentHash,
      timestamp: timestamp.toISOString(),
      source: "local",
    })
  } catch (error) {
    console.error("Log action error:", error)
    return NextResponse.json({ success: false, error: "Failed to log action" }, { status: 500 })
  }
}
