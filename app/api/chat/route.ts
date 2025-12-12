import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages, studentContext, sessionId } = body

    const iepGuardianUrl = process.env.IEP_GUARDIAN_URL

    if (!iepGuardianUrl) {
      // Return mock response for development
      const lastMessage = messages[messages.length - 1]?.content || ""

      return NextResponse.json({
        success: true,
        response: `Thank you for sharing that about the student. Based on what you've told me, I can see that there are some important areas we should focus on in the IEP. Would you like to tell me more about their progress on specific goals, or shall we proceed to generate a draft?`,
      })
    }

    const response = await fetch(iepGuardianUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "chat",
        messages,
        studentContext,
        sessionId,
      }),
    })

    if (!response.ok) {
      throw new Error(`IEP Guardian returned ${response.status}`)
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      response: data.response || data.message,
    })
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json({ success: false, error: "Failed to process chat message" }, { status: 500 })
  }
}
