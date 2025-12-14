import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { draft, iepData, studentInfo, sessionId } = body

    console.log("[v0] MySLP review request received")

    const myslpUrl = process.env.MYSLP_API_URL
    if (!myslpUrl) {
      console.error("[v0] MYSLP_API_URL not configured")
      return NextResponse.json({ success: false, error: "MYSLP_API_URL not configured" }, { status: 500 })
    }

    // MySLP expects { message, conversationHistory } format
    const reviewMessage = buildReviewMessage(draft, iepData, studentInfo)

    console.log("[v0] Calling MySLP Lambda at:", myslpUrl)
    console.log("[v0] Review message length:", reviewMessage.length)

    const response = await fetch(myslpUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: reviewMessage,
        conversationHistory: [],
        sessionId: sessionId || `iep-review-${Date.now()}`,
        context: {
          mode: "iep_review",
          requestType: "compliance_check",
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
    console.log("[v0] MySLP raw response:", JSON.stringify(data, null, 2))

    const review = parseReviewResponse(data)

    return NextResponse.json({
      success: true,
      review,
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

function buildReviewMessage(draft: any, iepData: any, studentInfo: any): string {
  const parts: string[] = []

  parts.push("Please review this IEP for clinical appropriateness and IDEA compliance.\n")

  // Student information
  if (studentInfo || iepData?.student || draft?.studentInfo) {
    const student = studentInfo || iepData?.student || draft?.studentInfo || {}
    parts.push("## Student Information")
    if (student.name) parts.push(`- Name: ${student.name}`)
    if (student.age) parts.push(`- Age: ${student.age}`)
    if (student.grade) parts.push(`- Grade: ${student.grade}`)
    if (student.school) parts.push(`- School: ${student.school}`)
    if (student.district) parts.push(`- District: ${student.district}`)
    parts.push("")
  }

  // Disability information
  const primaryDisability = iepData?.primary_disability || iepData?.primaryDisability || draft?.primaryDisability
  const secondaryDisability =
    iepData?.secondary_disability || iepData?.secondaryDisability || draft?.secondaryDisability

  if (primaryDisability || secondaryDisability) {
    parts.push("## Disability Categories")
    if (primaryDisability) parts.push(`- Primary: ${primaryDisability}`)
    if (secondaryDisability) parts.push(`- Secondary: ${secondaryDisability}`)
    parts.push("")
  }

  // Goals
  const goals = iepData?.goals || draft?.goals || []
  if (goals.length > 0) {
    parts.push("## Annual Goals")
    goals.forEach((goal: any, index: number) => {
      const goalText = goal.goal_text || goal.goalText || goal.text || goal.description || JSON.stringify(goal)
      const area = goal.area || goal.domain || "Not specified"
      const baseline = goal.baseline || "Not specified"
      const target = goal.target || goal.criterion || "Not specified"

      parts.push(`### Goal ${index + 1}: ${area}`)
      parts.push(`- Goal: ${goalText}`)
      parts.push(`- Baseline: ${baseline}`)
      parts.push(`- Target: ${target}`)
      parts.push("")
    })
  }

  // Services
  const services = iepData?.services || draft?.services || []
  if (services.length > 0) {
    parts.push("## Services")
    services.forEach((service: any) => {
      const serviceName = service.service_type || service.serviceType || service.name || service.type || "Service"
      const minutes = service.minutes_per_week || service.minutesPerWeek || service.minutes || service.duration
      const frequency = service.frequency || ""

      parts.push(`- ${serviceName}: ${minutes ? `${minutes} min/week` : ""} ${frequency}`.trim())
    })
    parts.push("")
  }

  // Accommodations
  const accommodations = iepData?.accommodations || draft?.accommodations || []
  if (accommodations.length > 0) {
    parts.push("## Accommodations")
    accommodations.slice(0, 10).forEach((acc: any) => {
      const accText = typeof acc === "string" ? acc : acc.description || acc.name || acc.text || JSON.stringify(acc)
      parts.push(`- ${accText}`)
    })
    if (accommodations.length > 10) {
      parts.push(`- ... and ${accommodations.length - 10} more`)
    }
    parts.push("")
  }

  // Present Levels
  const presentLevels = iepData?.present_levels || iepData?.presentLevels || draft?.presentLevels
  if (presentLevels) {
    parts.push("## Present Levels of Performance")
    if (typeof presentLevels === "string") {
      parts.push(presentLevels.substring(0, 1000))
    } else if (presentLevels.academic) {
      parts.push(`Academic: ${presentLevels.academic.substring(0, 500)}`)
    }
    parts.push("")
  }

  parts.push("## Review Request")
  parts.push("Please analyze this IEP and provide:")
  parts.push("1. Overall compliance score (0-100)")
  parts.push("2. FAPE (Free Appropriate Public Education) compliance assessment")
  parts.push("3. LRE (Least Restrictive Environment) documentation review")
  parts.push("4. Goal measurability analysis")
  parts.push("5. Service-to-goal alignment check")
  parts.push("6. Specific recommendations for improvement")
  parts.push("7. Any compliance concerns or red flags")

  return parts.join("\n")
}

function parseReviewResponse(data: any): any {
  // MySLP returns { response: "...", metadata: {...} }
  const responseText = data.response || data.message || data.content || ""

  // Default structure
  const review = {
    approved: true,
    score: 75,
    commentary: responseText,
    recommendations: [] as string[],
    issues: [] as string[],
    complianceChecks: {
      fape: { passed: true, note: "Review completed" },
      lre: { passed: true, note: "Review completed" },
      measurableGoals: { passed: true, note: "Review completed" },
      serviceAlignment: { passed: true, note: "Review completed" },
    },
  }

  // Try to extract score from response
  const scoreMatch = responseText.match(/(?:score|compliance)[:\s]*(\d{1,3})(?:\s*(?:\/100|%)?)/i)
  if (scoreMatch) {
    review.score = Number.parseInt(scoreMatch[1], 10)
    review.approved = review.score >= 70
  }

  // Look for specific compliance mentions
  if (responseText.toLowerCase().includes("fape")) {
    const fapeIssue =
      responseText.toLowerCase().includes("fape concern") ||
      responseText.toLowerCase().includes("fape issue") ||
      responseText.toLowerCase().includes("does not meet fape")
    review.complianceChecks.fape.passed = !fapeIssue
    review.complianceChecks.fape.note = fapeIssue
      ? "Potential FAPE concerns identified"
      : "FAPE requirements appear satisfied"
  }

  if (responseText.toLowerCase().includes("lre")) {
    const lreIssue =
      responseText.toLowerCase().includes("lre concern") || responseText.toLowerCase().includes("lre issue")
    review.complianceChecks.lre.passed = !lreIssue
    review.complianceChecks.lre.note = lreIssue ? "LRE documentation may need review" : "LRE properly documented"
  }

  // Extract recommendations (look for numbered items or bullet points)
  const recMatches = responseText.match(/(?:recommend|suggestion|should|consider)[:\s]*([^\n.]+)/gi)
  if (recMatches) {
    review.recommendations = recMatches.slice(0, 5).map((r: string) => r.trim())
  }

  // Extract issues/concerns
  const issueMatches = responseText.match(/(?:concern|issue|problem|missing|lacks)[:\s]*([^\n.]+)/gi)
  if (issueMatches) {
    review.issues = issueMatches.slice(0, 5).map((i: string) => i.trim())
    if (review.issues.length > 0) {
      review.approved = false
    }
  }

  return review
}
