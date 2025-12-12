import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { studentInfo, extractedData, progressData, additionalDocuments } = body

    const iepGuardianUrl = process.env.IEP_GUARDIAN_URL

    if (!iepGuardianUrl) {
      // Return mock draft for development
      return NextResponse.json({
        success: true,
        draft: {
          studentInfo: studentInfo ||
            extractedData?.studentInfo || {
              name: "Sample Student",
              grade: "2nd Grade",
              primaryDisability: "Autism Spectrum Disorder",
            },
          presentLevels: `${studentInfo?.name || extractedData?.studentInfo?.name || "The student"} is a second-grade student who receives special education services under the eligibility category of Autism Spectrum Disorder. In the classroom setting, they demonstrate strengths in visual learning and pattern recognition. Areas of need include social communication, expressive language, and self-regulation during transitions.`,
          goals: extractedData?.goals || [
            {
              id: "goal-1",
              area: "Communication",
              description:
                "Student will use a communication device or verbal language to make requests across school settings.",
              baseline: "Currently makes requests using gestures 60% of opportunities",
              target: "80% accuracy across 3 consecutive sessions",
              status: "progressing",
            },
            {
              id: "goal-2",
              area: "Social Skills",
              description: "Student will engage in reciprocal play with peers during structured activities.",
              baseline: "Currently engages in parallel play only",
              target: "3 turn exchanges with peer support in 4/5 opportunities",
              status: "progressing",
            },
            {
              id: "goal-3",
              area: "Academic Skills",
              description: "Student will improve reading comprehension by using visual aids.",
              baseline: "Currently reads independently at a level below grade expectations",
              target: "Reads independently at grade level with visual aids in 5/5 opportunities",
              status: "progressing",
            },
          ],
          services: extractedData?.services || [
            {
              type: "Specialized Academic Instruction",
              frequency: "300 min/week",
              duration: "Annual",
              provider: "Special Education Teacher",
            },
            {
              type: "Speech-Language Services",
              frequency: "60 min/week",
              duration: "Annual",
              provider: "Speech-Language Pathologist",
            },
            {
              type: "Occupational Therapy",
              frequency: "30 min/week",
              duration: "Annual",
              provider: "Occupational Therapist",
            },
          ],
          accommodations: extractedData?.accommodations || [
            "Extended time on tests and assignments",
            "Preferential seating",
            "Visual schedule",
            "Sensory breaks as needed",
            "Simplified directions",
          ],
        },
        complianceScore: 87,
        warnings: [
          "Consider adding measurable criteria to Goal 3",
          "Ensure transition plan is included if student is 16+",
        ],
      })
    }

    const response = await fetch(iepGuardianUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "generate-draft",
        studentInfo,
        extractedData,
        progressData,
        additionalDocuments,
      }),
    })

    if (!response.ok) {
      throw new Error(`IEP Guardian returned ${response.status}`)
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      draft: data.draft,
      complianceScore: data.complianceScore || 0,
      warnings: data.warnings || [],
    })
  } catch (error) {
    console.error("Error generating draft:", error)
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 })
  }
}
