import { type NextRequest, NextResponse } from "next/server"
import { getAuditLogCollection } from "@/lib/db"
import { generateHash } from "@/lib/hash-chain"

const HASHCHAIN_URL = process.env.HASHCHAIN_URL

interface HashChainEvent {
  eventType: string
  metadata?: Record<string, any>
  timestamp: string
  sessionId: string
  userId?: string
  iepId?: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const events: HashChainEvent[] = body.events || []

    if (events.length === 0) {
      return NextResponse.json({ success: true, logged: 0 })
    }

    const results: { eventType: string; hash: string; source: string }[] = []

    for (const event of events) {
      const { eventType, metadata, timestamp, sessionId, userId, iepId } = event

      // Try Lambda first
      if (HASHCHAIN_URL) {
        try {
          const response = await fetch(HASHCHAIN_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "log",
              sessionId,
              eventType,
              eventData: { ...metadata, userId, iepId },
              timestamp,
            }),
          })

          if (response.ok) {
            const result = await response.json()
            results.push({
              eventType,
              hash: result.hash || result.currentHash || "lambda",
              source: "lambda",
            })
            continue
          }
        } catch (lambdaError) {
          // Fall through to local logging
        }
      }

      // Fallback to local hash chain
      let previousHash = "genesis"
      try {
        const auditLog = await getAuditLogCollection()
        const lastEntry = await auditLog.findOne({ sessionId }, { sort: { timestamp: -1 } })
        if (lastEntry) {
          previousHash = lastEntry.currentHash
        }
      } catch {
        // MongoDB not available
      }

      const currentHash = generateHash({
        eventType,
        eventData: { ...metadata, userId, iepId },
        timestamp: new Date(timestamp),
        previousHash,
      })

      try {
        const auditLog = await getAuditLogCollection()
        await auditLog.insertOne({
          sessionId,
          userId,
          iepId,
          eventType,
          eventData: metadata,
          timestamp: new Date(timestamp),
          previousHash,
          currentHash,
        })
      } catch {
        // Log locally if MongoDB fails
      }

      results.push({
        eventType,
        hash: currentHash,
        source: "local",
      })
    }

    return NextResponse.json({
      success: true,
      logged: results.length,
      results,
    })
  } catch (error) {
    console.error("Hashchain log error:", error)
    return NextResponse.json({ success: false, error: "Failed to log events" }, { status: 500 })
  }
}
