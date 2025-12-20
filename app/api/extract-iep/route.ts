export const runtime = "nodejs"
export const maxDuration = 300

import { type NextRequest, NextResponse } from "next/server"
import { sanitizeObject } from "@/utils/strip-rtl"

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
      file = formData.get("document") as File | null
    }
    if (!file) {
      file = formData.get("pdf") as File | null
    }
    if (!file) {
      // Try to get first file from any field
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
          error: "No file provided",
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
    console.log("[extract-iep] Base64 first 100 chars:", base64.substring(0, 100))

    const payload = {
      action: "analyze",
      // Primary field names
      pdf_base64: base64,
      document: base64,
      content: base64,
      file: base64,
      pdf: base64,
      // Metadata
      state: state,
      iep_date: iepDate,
      user_notes: userNotes,
      // Additional context
      filename: file.name,
      filetype: file.type,
      filesize: file.size,
    }

    console.log("[extract-iep] Sending to Lambda:")
    console.log("[extract-iep] - action:", payload.action)
    console.log("[extract-iep] - base64 length:", base64.length)
    console.log("[extract-iep] - state:", payload.state)
    console.log("[extract-iep] - iep_date:", payload.iep_date)
    console.log("[extract-iep] - user_notes length:", userNotes.length)
    console.log("[extract-iep] - filename:", payload.filename)

    const lambdaResponse = await fetch(IEP_GUARDIAN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    console.log("[extract-iep] Lambda response status:", lambdaResponse.status)

    const result = await lambdaResponse.json()

    console.log("[extract-iep] Lambda response keys:", Object.keys(result))
    if (result.error) {
      console.log("[extract-iep] Lambda error:", result.error)
    }

    if (!lambdaResponse.ok) {
      return NextResponse.json(
        { error: result.error || "Lambda processing failed", jobId: result.jobId },
        { status: lambdaResponse.status },
      )
    }

    return NextResponse.json(sanitizeObject(result))
  } catch (error) {
    console.error("[extract-iep] EXCEPTION:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
