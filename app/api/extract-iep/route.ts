import { type NextRequest, NextResponse } from "next/server"

function transformExtractedData(data: Record<string, unknown>) {
  return {
    success: true,
    studentInfo: data.studentInfo || data.student_info || {},
    eligibility: data.eligibility || {},
    goals: data.goals || [],
    services: data.services || [],
    presentLevels: data.presentLevels || data.present_levels || {},
    compliance: data.compliance || {},
  }
}

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

    // If Lambda returns processing status, client will handle polling
    return NextResponse.json(result)
  } catch (error) {
    console.error("Extract IEP error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to extract IEP data" },
      { status: 500 },
    )
  }
}
