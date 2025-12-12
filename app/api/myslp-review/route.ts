import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { draft, studentInfo, sessionId } = body

    const myslpUrl = process.env.MYSLP_API_URL

    if (!myslpUrl) {
      // Return mock review for development
      return NextResponse.json({
        success: true,
        review: {
          approved: true,
          score: 92,
          commentary: `This IEP meets federal and state compliance requirements. Goals are appropriately challenging within ${studentInfo?.name || "the student"}'s zone of proximal development. The present levels accurately reflect current performance and provide a clear baseline for measuring progress.`,
          recommendations: [
            "Consider adding visual supports to Goal 2 accommodation list based on student's learning profile",
            "Ensure progress monitoring schedule aligns with goal measurement criteria",
          ],
          issues: [],
          complianceChecks: {
            fape: { passed: true, note: "Free Appropriate Public Education requirements met" },
            lre: { passed: true, note: "Least Restrictive Environment documented appropriately" },
            measurableGoals: { passed: true, note: "All goals contain measurable criteria" },
            baselineData: { passed: true, note: "Present levels include baseline data for each goal area" },
            serviceAlignment: { passed: true, note: "Services match identified areas of need" },
          },
        },
      })
    }

    const response = await fetch(myslpUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "review",
        draft,
        studentInfo,
        sessionId,
      }),
    })

    if (!response.ok) {
      throw new Error(`MySLP returned ${response.status}`)
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      review: data,
    })
  } catch (error) {
    console.error("MySLP review error:", error)
    return NextResponse.json({ success: false, error: "Failed to complete MySLP review" }, { status: 500 })
  }
}
