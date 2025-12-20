import { type NextRequest, NextResponse } from "next/server"
import { sanitizeObject } from "@/utils/strip-rtl"

// This route connects the frontend to IEP Guardian's remediation capabilities
// Guardian now returns both extraction AND remediation in one call

const GUARDIAN_URL = process.env.IEP_GUARDIAN_URL

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, iep_data, issue_id, fix_text } = body

    if (!GUARDIAN_URL) {
      console.error("[iep-remediation] IEP_GUARDIAN_URL not configured")
      return NextResponse.json({ success: false, error: "Guardian service not configured" }, { status: 500 })
    }

    // =========================================================================
    // ACTION: REMEDIATE
    // Run compliance checks on already-extracted IEP data
    // =========================================================================
    if (action === "remediate") {
      console.log("[iep-remediation] Calling Guardian for remediation analysis")

      const response = await fetch(GUARDIAN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "remediate",
          iep_data: iep_data,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[iep-remediation] Guardian error:", response.status, errorText)
        return NextResponse.json(
          { success: false, error: `Guardian returned ${response.status}` },
          { status: response.status },
        )
      }

      const data = await response.json()

      // Handle Lambda response format (may have body as string)
      let result = data
      if (typeof data.body === "string") {
        result = JSON.parse(data.body)
      } else if (data.body) {
        result = data.body
      }

      console.log("[iep-remediation] Remediation complete:", {
        score: result.remediation?.original_score,
        issues: result.remediation?.issues?.length,
      })

      return NextResponse.json({
        success: true,
        remediation: sanitizeObject(result.remediation),
      })
    }

    // =========================================================================
    // ACTION: APPLY_FIX
    // Apply a single fix to the IEP
    // =========================================================================
    if (action === "apply_fix") {
      console.log("[iep-remediation] Applying fix:", issue_id)

      // For now, just acknowledge the fix
      // The actual update happens in the frontend state
      // In production, you might persist this to a database

      return NextResponse.json({
        success: true,
        message: `Fix applied for ${issue_id}`,
        fix_text: fix_text,
      })
    }

    // =========================================================================
    // ACTION: APPLY_ALL
    // Apply all auto-fixable issues
    // =========================================================================
    if (action === "apply_all") {
      console.log("[iep-remediation] Applying all fixes")

      return NextResponse.json({
        success: true,
        message: "All fixes applied",
      })
    }

    // =========================================================================
    // UNKNOWN ACTION
    // =========================================================================
    return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 })
  } catch (error) {
    console.error("[iep-remediation] Error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
