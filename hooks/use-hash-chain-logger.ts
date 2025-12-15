"use client"

import { useCallback, useEffect, useRef } from "react"

interface HashChainEvent {
  eventType: string
  metadata?: Record<string, any>
  timestamp: string
  sessionId: string
  userId?: string
  iepId?: string
}

interface UseHashChainLoggerOptions {
  sessionId: string
  userId?: string
  iepId?: string
}

interface SessionMetrics {
  totalActiveTime: number
  totalIdleTime: number
  eventCount: number
  sessionStart: string
  lastActivity: string
}

const BATCH_SIZE = 10
const BATCH_INTERVAL = 30000 // 30 seconds
const IDLE_THRESHOLD = 5 * 60 * 1000 // 5 minutes

export function useHashChainLogger({ sessionId, userId, iepId }: UseHashChainLoggerOptions) {
  const eventBatch = useRef<HashChainEvent[]>([])
  const batchTimer = useRef<NodeJS.Timeout | null>(null)
  const lastActivityTime = useRef<number>(Date.now())
  const sessionStartTime = useRef<number>(Date.now())
  const totalActiveTime = useRef<number>(0)
  const totalIdleTime = useRef<number>(0)
  const isIdle = useRef<boolean>(false)
  const idleStartTime = useRef<number | null>(null)
  const activityCheckInterval = useRef<NodeJS.Timeout | null>(null)

  // Send batch to server
  const flushBatch = useCallback(async () => {
    if (eventBatch.current.length === 0) return

    const eventsToSend = [...eventBatch.current]
    eventBatch.current = []

    try {
      await fetch("/api/hashchain-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events: eventsToSend }),
      })
    } catch (error) {
      // Re-add events to batch on failure (but don't exceed max size)
      eventBatch.current = [...eventsToSend.slice(-BATCH_SIZE), ...eventBatch.current].slice(0, BATCH_SIZE * 2)
    }
  }, [])

  // Log a single event
  const logEvent = useCallback(
    (eventType: string, metadata?: Record<string, any>) => {
      // Filter out any PII from metadata
      const safeMetadata = metadata
        ? Object.fromEntries(
            Object.entries(metadata).filter(
              ([key]) =>
                !["name", "email", "address", "phone", "ssn", "dob", "studentName", "parentName"].includes(
                  key.toLowerCase(),
                ),
            ),
          )
        : undefined

      const event: HashChainEvent = {
        eventType,
        metadata: safeMetadata,
        timestamp: new Date().toISOString(),
        sessionId,
        userId,
        iepId,
      }

      eventBatch.current.push(event)

      // Update activity tracking
      const now = Date.now()
      if (isIdle.current && idleStartTime.current) {
        totalIdleTime.current += now - idleStartTime.current
        isIdle.current = false
        idleStartTime.current = null
      }
      lastActivityTime.current = now

      // Flush if batch is full
      if (eventBatch.current.length >= BATCH_SIZE) {
        flushBatch()
      }
    },
    [sessionId, userId, iepId, flushBatch],
  )

  // Get current session metrics
  const getSessionMetrics = useCallback((): SessionMetrics => {
    const now = Date.now()
    let currentIdleTime = totalIdleTime.current
    let currentActiveTime = now - sessionStartTime.current - totalIdleTime.current

    if (isIdle.current && idleStartTime.current) {
      currentIdleTime += now - idleStartTime.current
      currentActiveTime -= now - idleStartTime.current
    }

    return {
      totalActiveTime: Math.max(0, currentActiveTime),
      totalIdleTime: currentIdleTime,
      eventCount: eventBatch.current.length,
      sessionStart: new Date(sessionStartTime.current).toISOString(),
      lastActivity: new Date(lastActivityTime.current).toISOString(),
    }
  }, [])

  // Check for idle state periodically
  useEffect(() => {
    activityCheckInterval.current = setInterval(() => {
      const now = Date.now()
      const timeSinceLastActivity = now - lastActivityTime.current

      if (!isIdle.current && timeSinceLastActivity >= IDLE_THRESHOLD) {
        isIdle.current = true
        idleStartTime.current = lastActivityTime.current + IDLE_THRESHOLD
        totalActiveTime.current = idleStartTime.current - sessionStartTime.current - totalIdleTime.current
      }
    }, 60000) // Check every minute

    return () => {
      if (activityCheckInterval.current) {
        clearInterval(activityCheckInterval.current)
      }
    }
  }, [])

  // Set up batch flush interval
  useEffect(() => {
    batchTimer.current = setInterval(flushBatch, BATCH_INTERVAL)

    return () => {
      if (batchTimer.current) {
        clearInterval(batchTimer.current)
      }
    }
  }, [flushBatch])

  // Handle page unload - send SESSION_ENDED with metrics
  useEffect(() => {
    const handleUnload = () => {
      const metrics = getSessionMetrics()

      // Add SESSION_ENDED event to batch
      eventBatch.current.push({
        eventType: "SESSION_ENDED",
        metadata: {
          activeTimeMs: metrics.totalActiveTime,
          idleTimeMs: metrics.totalIdleTime,
          activeTimeMinutes: Math.round(metrics.totalActiveTime / 60000),
          idleTimeMinutes: Math.round(metrics.totalIdleTime / 60000),
          totalEventsLogged: metrics.eventCount,
        },
        timestamp: new Date().toISOString(),
        sessionId,
        userId,
        iepId,
      })

      // Use sendBeacon for reliable delivery on page unload
      const payload = JSON.stringify({ events: eventBatch.current })
      navigator.sendBeacon("/api/hashchain-log", payload)
    }

    window.addEventListener("beforeunload", handleUnload)
    window.addEventListener("pagehide", handleUnload)

    return () => {
      window.removeEventListener("beforeunload", handleUnload)
      window.removeEventListener("pagehide", handleUnload)
    }
  }, [sessionId, userId, iepId, getSessionMetrics])

  // Log SESSION_STARTED on mount
  useEffect(() => {
    logEvent("SESSION_STARTED", {
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
      screenWidth: typeof window !== "undefined" ? window.innerWidth : 0,
      screenHeight: typeof window !== "undefined" ? window.innerHeight : 0,
    })

    // Flush any remaining events on unmount
    return () => {
      flushBatch()
    }
  }, [logEvent, flushBatch])

  return {
    logEvent,
    getSessionMetrics,
    flushBatch,
  }
}
