export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"

const IEP_GUARDIAN_URL =
  process.env.IEP_GUARDIAN_URL || "https://meii3s7r6y344klxifj7bzo22m0dzkcu.lambda-url.us-east-1.on.aws/"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    const file = formData.get("file") as File | null
    const state = (formData.get("state") as string) || "CA"
    const iepDate = (formData.get("iepDate") as string) || new Date().toISOString().split("T")[0]
    const userNotes = (formData.get("userNotes") as string) || ""

    console.log("[extract-iep] File:", file?.name, "Size:", file?.size)

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString("base64")

    console.log("[extract-iep] Base64 length:", base64.length)

    const payload = {
      action: "analyze",
      pdf_base64: base64,
      state: state,
      iep_date: iepDate,
      user_notes: userNotes,
    }

    const lambdaResponse = await fetch(IEP_GUARDIAN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    const result = await lambdaResponse.json()

    if (!lambdaResponse.ok) {
      return NextResponse.json(
        {
          error: result.error || "Lambda processing failed",
          jobId: result.jobId,
        },
        { status: lambdaResponse.status },
      )
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("[extract-iep] Error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
