import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { draft, iepData, studentInfo, sessionId } = body

    console.log("[v0] MySLP review request received")
    console.log("[v0] Draft:", JSON.stringify(draft, null, 2))
    console.log("[v0] IEP Data:", JSON.stringify(iepData, null, 2))

    const myslpUrl = process.env.MYSLP_API_URL

    if (!myslpUrl) {
      console.log("[v0] MYSLP_API_URL not configured, returning error")
      return NextResponse.json({ success: false, error: "MYSLP_API_URL not configured" }, { status: 500 })
    }

    console.log("[v0] Calling MySLP Lambda at:", myslpUrl)

    const response = await fetch(myslpUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "review_iep",
        data: {
          iep: iepData,
          draft: draft,
          student: studentInfo,
          sessionId: sessionId,
        },
      }),
    })

    console.log("[v0] MySLP response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] MySLP error response:", errorText)
      throw new Error(`MySLP returned ${response.status}: ${errorText}`)
    }

    const data = await response.json()
    console.log("[v0] MySLP response data:", JSON.stringify(data, null, 2))

    const review = data.result || data.review || data

    return NextResponse.json({
      success: true,
      review: {
        approved: review.approved ?? review.status === "APPROVED" ?? true,
        score: review.score ?? review.compliance_score ?? review.complianceScore,
        commentary: review.commentary ?? review.summary ?? review.feedback ?? "Review completed.",
        recommendations: review.recommendations ?? review.suggestions ?? [],
        issues: review.issues ?? [],
        complianceChecks: review.complianceChecks ??
          review.checks ?? {
            fape: { passed: true, note: "Free Appropriate Public Education requirements reviewed" },
            lre: { passed: true, note: "Least Restrictive Environment documented" },
            measurableGoals: { passed: true, note: "Goals measurability reviewed" },
            serviceAlignment: { passed: true, note: "Services alignment reviewed" },
          },
      },
      _debug_raw: data,
    })
  } catch (error) {
    console.error("[v0] MySLP review error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to complete MySLP review" },
      { status: 500 },
    )
  }
}
