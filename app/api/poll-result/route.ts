import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { resultUrl } = await request.json()

    if (!resultUrl) {
      return NextResponse.json({ error: "resultUrl is required" }, { status: 400 })
    }

    const response = await fetch(resultUrl)

    if (!response.ok) {
      return NextResponse.json({ error: `Failed to fetch result: ${response.status}` }, { status: response.status })
    }

    const result = await response.json()
    return NextResponse.json(result)
  } catch (error) {
    console.error("Poll result error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to poll result" },
      { status: 500 },
    )
  }
}
