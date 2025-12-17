export const runtime = "nodejs"
export const maxDuration = 300

import { type NextRequest, NextResponse } from "next/server"

const IEP_GUARDIAN_URL =
  process.env.IEP_GUARDIAN_URL || "https://meii3s7r6y344klxifj7bzo22m0dzkcu.lambda-url.us-east-1.on.aws/"

export async function POST(request: NextRequest) {
  console.log("[extract-iep] === REQUEST RECEIVED ===")
  console.log("[extract-iep] Content-Type:", request.headers.get("content-type"))

  try {
    const formData = await request.formData()

    // Log ALL FormData keys to see what was actually sent
    const allKeys = [...formData.keys()]
    console.log("[extract-iep] FormData keys:", allKeys)

    // Log each entry with its type
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(
          `[extract-iep] Entry "${key}": File - name="${value.name}", size=${value.size}, type="${value.type}"`,
        )
      } else {
        console.log(`[extract-iep] Entry "${key}": ${typeof value} - "${String(value).substring(0, 100)}"`)
      }
    }

    let file = formData.get("file") as File | null
    if (!file) {
      console.log("[extract-iep] 'file' not found, trying 'document'...")
      file = formData.get("document") as File | null
    }
    if (!file) {
      console.log("[extract-iep] 'document' not found, trying 'pdf'...")
      file = formData.get("pdf") as File | null
    }
    if (!file) {
      // Try to get first file from any field
      console.log("[extract-iep] Trying to find any File object...")
      for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`[extract-iep] Found file in field "${key}"`)
          file = value
          break
        }
      }
    }

    console.log(
      "[extract-iep] Final file result:",
      file ? `${file.name}, ${file.size} bytes, type=${file.type}` : "NO FILE FOUND",
    )

    const state = (formData.get("state") as string) || "CA"
    const iepDate = (formData.get("iepDate") as string) || new Date().toISOString().split("T")[0]
    const userNotes = (formData.get("userNotes") as string) || ""

    if (!file) {
      console.log("[extract-iep] ERROR: No file found in any field. FormData keys were:", allKeys)
      return NextResponse.json(
        {
          error: "No document content provided",
          debug: { keys: allKeys, contentType: request.headers.get("content-type") },
        },
        { status: 400 },
      )
    }

    if (file.size === 0) {
      console.log("[extract-iep] ERROR: File has zero size")
      return NextResponse.json({ error: "File is empty" }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString("base64")

    console.log("[extract-iep] ArrayBuffer size:", arrayBuffer.byteLength)
    console.log("[extract-iep] Base64 length:", base64.length)

    const payload = {
      action: "analyze",
      pdf_base64: base64,
      state: state,
      iep_date: iepDate,
      user_notes: userNotes,
    }

    console.log("[extract-iep] Sending to Lambda - base64 length:", base64.length, "state:", state)

    const lambdaResponse = await fetch(IEP_GUARDIAN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    console.log("[extract-iep] Lambda response status:", lambdaResponse.status)

    const result = await lambdaResponse.json()

    console.log("[extract-iep] Lambda response keys:", Object.keys(result))

    if (!lambdaResponse.ok) {
      return NextResponse.json(
        { error: result.error || "Lambda processing failed", jobId: result.jobId },
        { status: lambdaResponse.status },
      )
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("[extract-iep] EXCEPTION:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
