"use client"

import { useState, useEffect } from "react"
import { useIEP } from "@/lib/iep-context"
import {
  ArrowLeft,
  ArrowRight,
  Save,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  FileCheck,
  Clock,
  Shield,
  Loader2,
  FileText,
  Users,
  Target,
} from "lucide-react"
import { stripRTL } from "@/utils/strip-rtl"

// ============================================================================
// TYPES
// ============================================================================

interface ComplianceIssue {
  id: string
  category: string
  severity: "critical" | "high" | "medium" | "low"
  title: string
  description: string
  legal_citation: string
  current_text: string
  suggested_fix: string
  fix_explanation: string
  auto_fixable: boolean
  points_deducted: number
}

interface RemediationData {
  original_score: number
  potential_score: number
  issues: ComplianceIssue[]
  summary: string
  priority_order: string[]
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Sanitize text by stripping RTL/bidi markers and trimming whitespace.
 * Use this for all compliance issue text displays to prevent reverse rendering.
 */
const sanitizeText = (text: string | null | undefined): string => {
  if (!text) return ""
  return stripRTL(text).trim()
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function DraftReviewPage() {
  const { draft, extractedData, setCurrentStep, updateDraft, addSessionLog } = useIEP()

  // Remediation state
  const [remediation, setRemediation] = useState<RemediationData | null>(null)
  const [loadingRemediation, setLoadingRemediation] = useState(true)
  const [remediationError, setRemediationError] = useState<string | null>(null)

  // Issue interaction state
  const [expandedIssues, setExpandedIssues] = useState<Set<string>>(new Set())
  const [fixingIssues, setFixingIssues] = useState<Set<string>>(new Set())
  const [fixedIssues, setFixedIssues] = useState<Set<string>>(new Set())
  const [isFixingAll, setIsFixingAll] = useState(false)

  // UI state
  const [activeTab, setActiveTab] = useState<"overview" | "goals" | "services" | "compliance">("compliance")
  const [saveStatus, setSaveStatus] = useState<string | null>(null)

  // Fetch remediation on mount
  useEffect(() => {
    fetchRemediation()
  }, [])

  const fetchRemediation = async () => {
    setLoadingRemediation(true)
    setRemediationError(null)

    try {
      const iepData = {
        ...extractedData?.rawIEP,
        student: draft?.studentInfo || extractedData?.rawIEP?.student,
        goals: draft?.goals || extractedData?.rawIEP?.goals || [],
        services: draft?.services || extractedData?.rawIEP?.services || [],
        accommodations: draft?.accommodations || extractedData?.rawIEP?.accommodations || [],
        present_levels: draft?.presentLevels || extractedData?.rawIEP?.plaafp,
        primary_disability:
          draft?.studentInfo?.primaryDisability || extractedData?.rawIEP?.eligibility?.primary_disability,
        secondary_disability:
          draft?.studentInfo?.secondaryDisability || extractedData?.rawIEP?.eligibility?.secondary_disability,
      }

      const response = await fetch("/api/iep-remediation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remediate", iep_data: iepData }),
      })

      if (!response.ok) {
        throw new Error(`Remediation failed: ${response.status}`)
      }

      const data = await response.json()

      if (data.success && data.remediation) {
        setRemediation(data.remediation)
        addSessionLog("Compliance analysis completed")
      } else {
        throw new Error(data.error || "Failed to analyze compliance")
      }
    } catch (error) {
      console.error("Remediation error:", error)
      setRemediationError(error instanceof Error ? error.message : "Failed to analyze compliance")
    } finally {
      setLoadingRemediation(false)
    }
  }

  const toggleExpand = (id: string) => {
    setExpandedIssues((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleApplyFix = async (issue: ComplianceIssue) => {
    if (!issue.auto_fixable || !issue.suggested_fix) return

    setFixingIssues((prev) => new Set(prev).add(issue.id))

    try {
      const response = await fetch("/api/iep-remediation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "apply_fix",
          issue_id: issue.id,
          fix_text: issue.suggested_fix,
        }),
      })

      if (response.ok) {
        setFixedIssues((prev) => new Set(prev).add(issue.id))
        applyFixToDraft(issue)
        addSessionLog(`Applied fix: ${issue.title}`)
      }
    } catch (error) {
      console.error("Failed to apply fix:", error)
    } finally {
      setFixingIssues((prev) => {
        const next = new Set(prev)
        next.delete(issue.id)
        return next
      })
    }
  }

  const handleFixAll = async () => {
    if (!remediation) return

    setIsFixingAll(true)
    addSessionLog("Applying all auto-fixes")

    try {
      const autoFixable = remediation.issues.filter((i) => i.auto_fixable && i.suggested_fix && !fixedIssues.has(i.id))

      for (const issue of autoFixable) {
        await handleApplyFix(issue)
      }
    } finally {
      setIsFixingAll(false)
    }
  }

  const applyFixToDraft = (issue: ComplianceIssue) => {
    if (!draft) return

    if (issue.category === "goal_measurability" || issue.category === "goal_baseline") {
      const match = issue.id.match(/goal_(\d+)/)
      if (match) {
        const goalIndex = Number.parseInt(match[1], 10) - 1
        const updatedGoals = [...(draft.goals || [])]
        if (updatedGoals[goalIndex]) {
          if (issue.category === "goal_measurability") {
            updatedGoals[goalIndex] = {
              ...updatedGoals[goalIndex],
              description: issue.suggested_fix,
              goal_text: issue.suggested_fix,
            }
          } else {
            updatedGoals[goalIndex] = {
              ...updatedGoals[goalIndex],
              baseline: issue.suggested_fix,
            }
          }
          updateDraft({ goals: updatedGoals })
        }
      }
    }

    if (issue.category === "present_levels" || issue.category === "disability_impact") {
      const currentLevels = draft.presentLevels || ""
      updateDraft({ presentLevels: currentLevels + "\n\n" + issue.suggested_fix })
    }
  }

  const handleSave = () => {
    addSessionLog("Draft saved")
    setSaveStatus("Saved!")
    setTimeout(() => setSaveStatus(null), 2000)
  }

  const handleBack = () => {
    addSessionLog("Returned to generating page")
    setCurrentStep("generating")
  }

  // Calculate current score based on fixed issues
  const calculateCurrentScore = () => {
    if (!remediation) return draft?.complianceScore || 0
    const fixedPoints = remediation.issues
      .filter((i) => fixedIssues.has(i.id))
      .reduce((sum, i) => sum + i.points_deducted, 0)
    return Math.min(100, remediation.original_score + fixedPoints)
  }

  const currentScore = calculateCurrentScore()
  const autoFixableCount =
    remediation?.issues.filter((i) => i.auto_fixable && i.suggested_fix && !fixedIssues.has(i.id)).length || 0
  const criticalCount =
    remediation?.issues.filter((i) => i.severity === "critical" && !fixedIssues.has(i.id)).length || 0
  const remainingIssueCount = remediation?.issues.filter((i) => !fixedIssues.has(i.id)).length || 0

  // Helper function to identify clinical categories
  const isClinicalCategory = (category: string): boolean => {
    const clinicalCategories = [
      "assessment_currency",
      "goal_feasibility",
      "goal_accommodation_alignment",
      "behaviorist_language",
      "goal_zpd",
      "service_intensity",
    ]
    return clinicalCategories.includes(category)
  }

  // Severity styling
  const severityConfig = {
    critical: {
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-700",
      badge: "bg-red-100 text-red-800",
      icon: "text-red-500",
    },
    high: {
      bg: "bg-orange-50",
      border: "border-orange-200",
      text: "text-orange-700",
      badge: "bg-orange-100 text-orange-800",
      icon: "text-orange-500",
    },
    medium: {
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      text: "text-yellow-700",
      badge: "bg-yellow-100 text-yellow-800",
      icon: "text-yellow-500",
    },
    low: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-700",
      badge: "bg-blue-100 text-blue-800",
      icon: "text-blue-500",
    },
  }

  if (!draft) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <p className="text-lg text-slate-700">No draft data available</p>
          <button
            onClick={() => setCurrentStep("welcome")}
            className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            Start Over
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={handleBack} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-slate-900 hover-title">
                  Draft IEP: {draft.studentInfo?.name || "Student"}
                </h1>
                <p className="text-sm text-slate-500">Review and fix compliance issues before second look</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <Save className="w-4 h-4" />
                {saveStatus || "Save Draft"}
              </button>
              <button
                onClick={() => setCurrentStep("myslp-review")}
                disabled={criticalCount > 0}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                Ready for Second Look
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4 -mb-px">
            {[
              { id: "compliance", label: "Compliance", icon: Shield, count: remainingIssueCount },
              { id: "overview", label: "Overview", icon: FileText },
              { id: "goals", label: "Goals", icon: Target, count: draft.goals?.length },
              { id: "services", label: "Services", icon: Users, count: draft.services?.length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-teal-600 text-teal-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full ${
                      tab.id === "compliance" && tab.count > 0
                        ? "bg-red-100 text-red-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {activeTab === "compliance" && (
          <div className="space-y-6">
            {/* Loading State */}
            {loadingRemediation && (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="w-10 h-10 text-teal-600 animate-spin mb-4" />
                <p className="text-lg text-slate-600">Analyzing compliance...</p>
                <p className="text-sm text-slate-400">Checking against IDEA regulations and state requirements</p>
              </div>
            )}

            {/* Error State */}
            {remediationError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                <p className="text-red-800 font-medium">{remediationError}</p>
                <button
                  onClick={fetchRemediation}
                  className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Success - No Issues */}
            {remediation && remediation.issues.length === 0 && (
              <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-4">
                  <Shield className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold text-emerald-900 mb-2">IEP Meets Compliance Requirements</h3>
                <p className="text-emerald-700">No issues found. This IEP is ready for the team meeting.</p>
              </div>
            )}

            {/* Issues Found */}
            {remediation && remediation.issues.length > 0 && (
              <>
                {/* Score Header */}
                <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white">
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold mb-2">
                        {remainingIssueCount} Issue{remainingIssueCount !== 1 ? "s" : ""}{" "}
                        {fixedIssues.size > 0 ? "Remaining" : "Found"}
                      </h2>
                      <p className="text-slate-300 text-lg">{remediation.summary}</p>
                      {criticalCount > 0 && (
                        <p className="text-red-400 mt-2 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          Fix critical issues before proceeding to Second Look
                        </p>
                      )}
                    </div>

                    {/* Score Ring */}
                    <div className="text-center flex-shrink-0">
                      <div className="relative w-24 h-24">
                        <svg className="w-24 h-24 transform -rotate-90">
                          <circle
                            cx="48"
                            cy="48"
                            r="40"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="none"
                            className="text-slate-700"
                          />
                          <circle
                            cx="48"
                            cy="48"
                            r="40"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="none"
                            strokeDasharray={`${(currentScore / 100) * 251.2} 251.2`}
                            className={
                              currentScore >= 80
                                ? "text-emerald-400"
                                : currentScore >= 60
                                  ? "text-yellow-400"
                                  : "text-red-400"
                            }
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-2xl font-bold">{currentScore}%</span>
                        </div>
                      </div>
                      <p className="text-sm text-slate-400 mt-2">
                        {fixedIssues.size > 0 ? `${fixedIssues.size} fixed` : "Compliance"}
                      </p>
                    </div>
                  </div>

                  {/* Fix All Button */}
                  {autoFixableCount > 0 && (
                    <button
                      onClick={handleFixAll}
                      disabled={isFixingAll}
                      className="mt-6 w-full py-4 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:from-slate-600 disabled:to-slate-600 text-white font-semibold text-lg flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
                    >
                      {isFixingAll ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Fixing Issues...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          Fix All {autoFixableCount} Issues
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Issues List */}
                <div className="space-y-3">
                  {remediation.issues.map((issue) => {
                    const config = severityConfig[issue.severity]
                    const isExpanded = expandedIssues.has(issue.id)
                    const isFixing = fixingIssues.has(issue.id)
                    const isFixed = fixedIssues.has(issue.id)

                    return (
                      <div
                        key={issue.id}
                        className={`rounded-xl border-2 overflow-hidden transition-all ${
                          isFixed ? "bg-emerald-50 border-emerald-200" : `${config.bg} ${config.border}`
                        }`}
                      >
                        {/* Issue Header */}
                        <button
                          onClick={() => toggleExpand(issue.id)}
                          className="w-full p-4 flex items-center gap-4 text-left"
                        >
                          <div className={`flex-shrink-0 ${isFixed ? "text-emerald-500" : config.icon}`}>
                            {isFixed ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3
                                className={`font-semibold ${isFixed ? "text-emerald-800 line-through" : "text-slate-900"}`}
                              >
                                {issue.title}
                              </h3>
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full font-medium ${isFixed ? "bg-emerald-100 text-emerald-700" : config.badge}`}
                              >
                                {isFixed ? "Fixed" : issue.severity.toUpperCase()}
                              </span>
                              {!isFixed && isClinicalCategory(issue.category) && (
                                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-purple-100 text-purple-700 border border-purple-200">
                                  CLINICAL
                                </span>
                              )}
                              {!isFixed && !isClinicalCategory(issue.category) && (
                                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700 border border-blue-200">
                                  COMPLIANCE
                                </span>
                              )}
                              {!isFixed && (
                                <span className="text-xs text-slate-500">-{issue.points_deducted} points</span>
                              )}
                            </div>
                            <p className={`text-sm mt-1 ${isFixed ? "text-emerald-600" : "text-slate-600"}`}>
                              {issue.description}
                            </p>
                          </div>

                          <div className="flex-shrink-0 text-slate-400">
                            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                          </div>
                        </button>

                        {/* Expanded Details */}
                        {isExpanded && (
                          <div className="px-4 pb-4 pt-0 space-y-4 border-t border-slate-200">
                            {/* Legal Citation */}
                            <div className="mt-4 p-3 rounded-lg bg-white/60">
                              <div className="flex items-start gap-2">
                                <FileCheck className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                                    Legal Requirement
                                  </p>
                                  <p className="text-sm text-slate-700 mt-1">{issue.legal_citation}</p>
                                </div>
                              </div>
                            </div>

                            {/* Current Text */}
                            <div className="p-3 rounded-lg bg-red-100/50 border border-red-200">
                              <p className="text-xs font-medium text-red-600 uppercase tracking-wide mb-1">
                                Current (Non-Compliant)
                              </p>
                              <p className="text-sm text-red-800 font-mono" dir="ltr">{sanitizeText(issue.current_text)}</p>
                            </div>

                            {/* Suggested Fix */}
                            {issue.suggested_fix && (
                              <div className="p-3 rounded-lg bg-emerald-100/50 border border-emerald-200">
                                <p className="text-xs font-medium text-emerald-600 uppercase tracking-wide mb-1">
                                  Suggested Fix
                                </p>
                                <p className="text-sm text-emerald-800" dir="ltr">{sanitizeText(issue.suggested_fix)}</p>
                                <p className="text-xs text-emerald-600 mt-2 italic">{issue.fix_explanation}</p>
                              </div>
                            )}

                            {/* Action Button */}
                            {!isFixed && issue.auto_fixable && issue.suggested_fix && (
                              <button
                                onClick={() => handleApplyFix(issue)}
                                disabled={isFixing}
                                className="w-full py-3 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white font-medium flex items-center justify-center gap-2 transition-colors"
                              >
                                {isFixing ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Applying Fix...
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="w-4 h-4" />
                                    Apply This Fix
                                  </>
                                )}
                              </button>
                            )}

                            {!issue.auto_fixable && (
                              <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 p-3 rounded-lg">
                                <Clock className="w-4 h-4 flex-shrink-0" />
                                <span>This issue requires manual review. {issue.fix_explanation}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Present Levels of Performance</h2>
            <div className="prose prose-slate max-w-none whitespace-pre-wrap">
              {draft.presentLevels || extractedData?.rawIEP?.plaafp?.academic || "No present levels data available."}
            </div>
          </div>
        )}

        {/* Goals Tab */}
        {activeTab === "goals" && (
          <div className="space-y-4">
            {(draft.goals || []).map((goal, index) => (
              <div
                key={goal.id || index}
                className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-slate-900">
                    Goal {index + 1}: {goal.area || "Annual Goal"}
                  </h3>
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                    {goal.area || "General"}
                  </span>
                </div>
                <p className="text-slate-700 mb-4">{goal.goal_text || goal.description || "No goal text"}</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">Baseline:</span>
                    <p className="text-slate-700">{goal.baseline || "Not specified"}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Target:</span>
                    <p className="text-slate-700">{goal.target || "Not specified"}</p>
                  </div>
                </div>
              </div>
            ))}
            {(!draft.goals || draft.goals.length === 0) && (
              <div className="bg-white rounded-xl border border-slate-200 p-6 text-center text-slate-500">
                No goals found in the IEP
              </div>
            )}
          </div>
        )}

        {/* Services Tab */}
        {activeTab === "services" && (
          <div className="space-y-4">
            {(draft.services || []).map((service, index) => (
              <div
                key={service.id || index}
                className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow"
              >
                <h3 className="font-semibold text-slate-900 mb-2">{service.type || "Service"}</h3>
                <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                  {service.frequency && <span>Frequency: {service.frequency}</span>}
                  {service.duration && <span>Duration: {service.duration}</span>}
                  {service.provider && <span>Provider: {service.provider}</span>}
                  {service.location && <span>Location: {service.location}</span>}
                </div>
              </div>
            ))}
            {(!draft.services || draft.services.length === 0) && (
              <div className="bg-white rounded-xl border border-slate-200 p-6 text-center text-slate-500">
                No services found in the IEP
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

export default DraftReviewPage
