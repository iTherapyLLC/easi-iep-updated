export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { iep, new_iep, remediation, message, conversationHistory, sessionId, state, state_name } = body

    // Use iep or new_iep, whichever is provided
    const iepData = new_iep || iep

    console.log("[v0] ========== MYSLP ROUTE DEBUG ==========")
    console.log("[v0] Body keys received:", Object.keys(body))
    console.log("[v0] new_iep present:", !!new_iep)
    console.log("[v0] iep present:", !!iep)
    console.log("[v0] iepData resolved:", !!iepData)
    console.log("[v0] State:", state)
    console.log("[v0] State name:", state_name)
    if (iepData) {
      console.log("[v0] IEP data keys:", Object.keys(iepData))
      console.log("[v0] IEP student:", JSON.stringify(iepData.student))
      console.log("[v0] IEP goals count:", iepData.goals?.length)
      console.log("[v0] IEP services count:", iepData.services?.length)
    } else {
      console.log("[v0] WARNING: No IEP data found in request!")
    }
    console.log("[v0] Message:", message?.substring(0, 100))
    console.log("[v0] Conversation history length:", conversationHistory?.length || 0)
    console.log("[v0] ========================================")

    const myslpUrl = process.env.MYSLP_API_URL
    if (!myslpUrl) {
      console.error("[v0] MYSLP_API_URL not configured")
      return NextResponse.json({ success: false, error: "MYSLP_API_URL not configured" }, { status: 500 })
    }

    let reviewMessage: string
    if (message) {
      // Follow-up question from user - include context reminder
      reviewMessage = message
      if (iepData) {
        reviewMessage = `Context: You are reviewing an IEP for a student in ${state_name || state || "Unknown State"}.\n\nUser question: ${message}`
      }
    } else {
      // Initial review - build comprehensive message with IEP data
      reviewMessage = buildReviewMessage(iepData, state, state_name)
    }

    console.log("[v0] Review message preview:", reviewMessage.substring(0, 500))
    console.log("[v0] Review message total length:", reviewMessage.length)
    console.log("[v0] Calling MySLP Lambda at:", myslpUrl)

    const response = await fetch(myslpUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: reviewMessage,
        conversationHistory: conversationHistory || [],
        sessionId: sessionId || `iep-review-${Date.now()}`,
        context: {
          mode: "iep_review",
          state: state,
          state_name: state_name,
          requestType: message ? "follow_up" : "compliance_check",
          iep: iepData
            ? {
                student: iepData.student,
                eligibility: iepData.eligibility,
                goals: iepData.goals,
                services: iepData.services,
                plaafp: iepData.plaafp,
                accommodations: iepData.accommodations,
                lre: iepData.lre,
              }
            : null,
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
    console.log("[v0] MySLP raw response:", JSON.stringify(data).substring(0, 500))

    const review = parseReviewResponse(data)
    const responseText = data.response || data.message || data.content || review.commentary

    return NextResponse.json({
      success: true,
      review,
      responseText,
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

function buildReviewMessage(iepData: any, state?: string, stateName?: string): string {
  if (!iepData) {
    return `Please review this IEP for clinical appropriateness and IDEA compliance. The student is in ${stateName || state || "an unspecified state"}. No IEP data was provided in the request.`
  }

  const parts: string[] = []

  parts.push(
    `Please review this IEP for clinical appropriateness and compliance with ${stateName || state || "federal"} regulations and IDEA requirements.\n`,
  )

  // Student information
  const student = iepData.student || {}
  parts.push("## Student Information")
  parts.push(`- Name: ${student.name || "Not provided"}`)
  parts.push(`- DOB: ${student.dob || student.date_of_birth || "Not provided"}`)
  parts.push(`- Age: ${student.age || "Not provided"}`)
  parts.push(`- Grade: ${student.grade || "Not provided"}`)
  parts.push(`- School: ${student.school || "Not provided"}`)
  parts.push(`- District: ${student.district || "Not provided"}`)
  parts.push(`- State: ${stateName || state || "Not provided"}`)
  parts.push("")

  // Disability information
  const eligibility = iepData.eligibility || {}
  const primaryDisability = eligibility.primary_disability || eligibility.primaryDisability
  const secondaryDisability = eligibility.secondary_disability || eligibility.secondaryDisability

  parts.push("## Disability Categories")
  parts.push(`- Primary: ${primaryDisability || "Not specified"}`)
  if (secondaryDisability) parts.push(`- Secondary: ${secondaryDisability}`)
  parts.push("")

  // Present Levels (PLAAFP)
  const plaafp = iepData.plaafp || {}
  parts.push("## Present Levels of Academic Achievement and Functional Performance")
  if (plaafp.strengths) parts.push(`### Strengths\n${plaafp.strengths}`)
  if (plaafp.concerns) parts.push(`### Areas of Concern\n${plaafp.concerns}`)
  if (plaafp.academic) parts.push(`### Academic Performance\n${plaafp.academic}`)
  if (plaafp.functional) parts.push(`### Functional Performance\n${plaafp.functional}`)
  if (plaafp.summary) parts.push(`### Summary\n${plaafp.summary}`)
  if (!plaafp.strengths && !plaafp.concerns && !plaafp.academic && !plaafp.functional && !plaafp.summary) {
    parts.push("No PLAAFP information provided.")
  }
  parts.push("")

  // Goals
  const goals = iepData.goals || []
  parts.push("## Annual Goals")
  if (goals.length > 0) {
    goals.forEach((goal: any, index: number) => {
      const goalText = goal.goal_text || goal.text || goal.description || goal.goal || JSON.stringify(goal)
      const area = goal.area || goal.goal_area || goal.domain || "Not specified"
      const baseline = goal.baseline || "Not specified"
      const target = goal.target || goal.criterion || "Not specified"
      const zpdScore = goal.zpd_score

      parts.push(`### Goal ${index + 1}: ${area}`)
      parts.push(`- Goal: ${goalText}`)
      parts.push(`- Baseline: ${baseline}`)
      parts.push(`- Target: ${target}`)
      if (zpdScore !== undefined) parts.push(`- ZPD Score: ${zpdScore}`)
      if (goal.clinical_notes) parts.push(`- Clinical Notes: ${goal.clinical_notes}`)
      parts.push("")
    })
  } else {
    parts.push("No goals provided.")
    parts.push("")
  }

  // Services
  const services = iepData.services || []
  parts.push("## Services")
  if (services.length > 0) {
    services.forEach((service: any) => {
      const serviceName = service.service_type || service.type || service.name || service.service || "Service"
      const minutes = service.minutes_per_week || service.minutes || service.duration || ""
      const frequency = service.frequency || ""
      const provider = service.provider || ""
      const setting = service.setting || service.location || ""

      parts.push(`- ${serviceName}: ${minutes} ${frequency}`.trim())
      if (provider) parts.push(`  Provider: ${provider}`)
      if (setting) parts.push(`  Setting: ${setting}`)
    })
  } else {
    parts.push("No services provided.")
  }
  parts.push("")

  // Accommodations
  const accommodations = iepData.accommodations || []
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

  // LRE
  const lre = iepData.lre || {}
  if (lre.placement || lre.justification || lre.general_ed_percentage) {
    parts.push("## Least Restrictive Environment")
    if (lre.placement) parts.push(`- Placement: ${lre.placement}`)
    if (lre.general_ed_percentage) parts.push(`- General Ed %: ${lre.general_ed_percentage}`)
    if (lre.justification) parts.push(`- Justification: ${lre.justification}`)
    parts.push("")
  }

  parts.push("## Review Request")
  parts.push(`Please analyze this IEP for a student in ${stateName || state || "the specified state"} and provide:`)
  parts.push("1. Overall compliance score (0-100)")
  parts.push(`2. ${stateName || state || "State"}-specific compliance assessment`)
  parts.push("3. FAPE (Free Appropriate Public Education) compliance assessment")
  parts.push("4. LRE (Least Restrictive Environment) documentation review")
  parts.push("5. Goal measurability analysis")
  parts.push("6. Service-to-goal alignment check")
  parts.push("7. Specific recommendations for improvement")
  parts.push("8. Any compliance concerns or red flags")

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
