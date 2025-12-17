"use client"

import { useCallback, useEffect, useRef } from "react"

interface HashChainEvent {
  eventType: string
  timestamp: string
  sessionId: string
  metadata?: Record<string, any>
}

export function useHashChainLogger(sessionId: string) {
  const eventsRef = useRef<HashChainEvent[]>([])
  const lastEventTimeRef = useRef<number>(Date.now())

  const logEvent = useCallback(
    (eventType: string, metadata?: Record<string, any>) => {
      const now = Date.now()
      const elapsedSinceLastEvent = now - lastEventTimeRef.current
      lastEventTimeRef.current = now

      const event: HashChainEvent = {
        eventType,
        timestamp: new Date().toISOString(),
        sessionId,
        metadata: {
          ...metadata,
          elapsedMs: elapsedSinceLastEvent,
        },
      }

      eventsRef.current.push(event)
      console.log(`[HashChain] ${eventType}`, metadata || "")

      // Send to hash chain API (fire and forget)
      if (process.env.NEXT_PUBLIC_HASHCHAIN_URL || process.env.HASHCHAIN_URL) {
        fetch("/api/hashchain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(event),
        }).catch((err) => {
          console.warn("[HashChain] Failed to log event:", err)
        })
      }
    },
    [sessionId],
  )

  // Log session end on unmount
  useEffect(() => {
    return () => {
      logEvent("SESSION_ENDED", {
        totalEvents: eventsRef.current.length,
      })
    }
  }, [logEvent])

  return { logEvent, events: eventsRef.current }
}

// Also export as default for flexibility
export default useHashChainLogger
