import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Convert file to base64 for Lambda
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString("base64")

    // Call IEP Guardian Lambda
    const iepGuardianUrl = process.env.IEP_GUARDIAN_URL

    if (!iepGuardianUrl) {
      // Return mock data for development
      return NextResponse.json({
        success: true,
        data: {
          studentInfo: {
            name: "Sample Student",
            grade: "2nd Grade",
            primaryDisability: "Autism Spectrum Disorder",
            dateOfBirth: "2017-03-15",
            school: "Sample Elementary School",
          },
          goals: [
            {
              id: "goal-1",
              area: "Communication",
              description:
                "Student will use a communication device or verbal language to make requests across school settings.",
              baseline: "Currently makes requests using gestures 60% of opportunities",
              target: "80% accuracy across 3 consecutive sessions",
            },
            {
              id: "goal-2",
              area: "Social Skills",
              description: "Student will engage in reciprocal play with peers during structured activities.",
              baseline: "Currently engages in parallel play only",
              target: "3 turn exchanges with peer support in 4/5 opportunities",
            },
            {
              id: "goal-3",
              area: "Self-Regulation",
              description: "Student will use calming strategies when presented with challenging tasks.",
              baseline: "Requires adult prompting 90% of the time",
              target: "Independent use 60% of opportunities",
            },
            {
              id: "goal-4",
              area: "Academic - Reading",
              description: "Student will identify sight words from grade-level word list.",
              baseline: "Currently identifies 15 sight words",
              target: "50 sight words with 90% accuracy",
            },
            {
              id: "goal-5",
              area: "Motor Skills",
              description: "Student will demonstrate improved fine motor control for writing tasks.",
              baseline: "Currently writes with oversized grip, letters inconsistent in size",
              target: "Legible letter formation with appropriate sizing",
            },
          ],
          presentLevels: "The student is currently enrolled in a special day class setting...",
          services: [],
          accommodations: [],
        },
      })
    }

    const response = await fetch(iepGuardianUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "parse",
        file: {
          name: file.name,
          type: file.type,
          content: base64,
        },
      }),
    })

    if (!response.ok) {
      throw new Error(`Lambda returned ${response.status}`)
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error("Upload IEP error:", error)
    return NextResponse.json({ error: "Failed to process document" }, { status: 500 })
  }
}
