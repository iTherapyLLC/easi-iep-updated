export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { sanitizeObject } from "@/utils/strip-rtl"

const IEP_GUARDIAN_URL = process.env.IEP_GUARDIAN_URL || "https://meii3s7r6y344klxifj7bzo22m0dzkcu.lambda-url.us-east-1.on.aws/"

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const { jobId } = params
  
  if (!jobId) {
    return NextResponse.json({ error: "Job ID required" }, { status: 400 })
  }

  try {
    console.log("[extract-iep-status] Checking status for jobId:", jobId)

    // Call Lambda to check status
    const response = await fetch(IEP_GUARDIAN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "get_status",
        jobId: jobId,
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error("[extract-iep-status] Lambda error:", result.error)
      return NextResponse.json({ error: result.error || "Status check failed" }, { status: response.status })
    }

    // If complete, sanitize and return full result
    // Note: Lambda may return either status="complete" or success=true depending on implementation
    if (result.status === "complete" || result.success) {
      console.log("[extract-iep-status] Job complete:", jobId)
      return NextResponse.json(sanitizeObject({
        status: "complete",
        success: true,
        ...result,
      }))
    }

    // Still processing
    console.log("[extract-iep-status] Job still processing:", jobId)
    return NextResponse.json({
      status: "processing",
      jobId: jobId,
      progress: result.progress || null,
    })
  } catch (error) {
    console.error("[extract-iep-status] Error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
