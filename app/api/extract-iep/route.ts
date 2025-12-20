export const runtime = "nodejs"
export const maxDuration = 60 // Reduced - we return quickly now

import { type NextRequest, NextResponse } from "next/server"

const IEP_GUARDIAN_URL =
  process.env.IEP_GUARDIAN_URL || "https://meii3s7r6y344klxifj7bzo22m0dzkcu.lambda-url.us-east-1.on.aws/"

export async function POST(request: NextRequest) {
  const requestStartTime = Date.now()
  console.log("[extract-iep] === REQUEST RECEIVED ===")

  try {
    const formData = await request.formData()
    
    let file = formData.get("file") as File | null
    if (!file) file = formData.get("document") as File | null
    if (!file) file = formData.get("pdf") as File | null
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString("base64")

    const state = (formData.get("state") as string) || "CA"
    const iepDate = (formData.get("iepDate") as string) || new Date().toISOString().split("T")[0]
    const userNotes = (formData.get("userNotes") as string) || ""

    // Call Lambda with async flag - it should return jobId immediately
    const payload = {
      action: "analyze_async", // New action that returns immediately
      pdf_base64: base64,
      state: state,
      iep_date: iepDate,
      user_notes: userNotes,
      filename: file.name,
      filesize: file.size,
    }

    console.log("[extract-iep] Starting async job for:", file.name)

    const lambdaResponse = await fetch(IEP_GUARDIAN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    const result = await lambdaResponse.json()
    
    if (!lambdaResponse.ok) {
      return NextResponse.json({ error: result.error || "Failed to start processing" }, { status: lambdaResponse.status })
    }

    console.log(`[extract-iep] Job started in ${Date.now() - requestStartTime}ms, jobId:`, result.jobId || result.job_id)

    // Return job ID for polling
    return NextResponse.json({
      status: "processing",
      jobId: result.jobId || result.job_id,
      message: "Document processing started. Poll for status.",
    })
  } catch (error) {
    console.error("[extract-iep] Error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
