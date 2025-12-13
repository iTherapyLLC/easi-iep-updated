import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const iepGuardianUrl = process.env.IEP_GUARDIAN_URL
    if (!iepGuardianUrl) {
      return NextResponse.json({ error: "IEP_GUARDIAN_URL not configured" }, { status: 500 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 })
    }

    // Convert file to base64 for Lambda
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString("base64")

    // Determine file type from extension
    const fileExtension = file.name.split(".").pop()?.toLowerCase() || "pdf"
    const fileType = ["png", "jpg", "jpeg", "heic"].includes(fileExtension) ? fileExtension : "pdf"

    const response = await fetch(iepGuardianUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "generate_iep",
        data: {
          documents: [
            {
              type: fileType,
              content: base64,
              filename: file.name,
            },
          ],
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Lambda error:", errorText)
      throw new Error(`Lambda returned ${response.status}: ${errorText}`)
    }

    const result = await response.json()

    console.log("[v0] Lambda response status:", result.status)
    console.log("[v0] Lambda response keys:", Object.keys(result))

    // Return the complete result - frontend will map result.iep fields
    return NextResponse.json({
      success: true,
      status: result.status,
      jobId: result.jobId,
      iep: result.result?.iep || result.iep,
      _debug_raw: result,
    })
  } catch (error) {
    console.error("Extract IEP error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to extract IEP data" },
      { status: 500 },
    )
  }
}
