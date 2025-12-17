"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle2, ChevronDown, ChevronUp, Sparkles, Edit3, ArrowLeft, ArrowRight } from "lucide-react"

interface ComplianceIssue {
  id: string
  category: string
  severity: "critical" | "high" | "medium" | "low"
  title: string
  description: string
  legal_citation?: string
  current_text?: string
  suggested_fix?: string
  fix_explanation?: string
  auto_fixable?: boolean
  points_deducted: number
}

interface IEPData {
  student: {
    name: string
    dob?: string
    age?: string
    grade: string
    school: string
    district: string
  }
  eligibility?: {
    primary_disability: string
    secondary_disability?: string
  }
  plaafp:
    | {
        academic: string
        functional: string
        strengths?: string
        parent_input?: string
      }
    | string
  goals: Array<{
    number?: number
    area: string
    goal_text: string
    baseline: string
    target: string
    measurement_method?: string
    due_date?: string
  }>
  services: Array<{
    type: string
    minutes_per_session?: number
    sessions_per_week?: number
    total_minutes_per_week?: number
    frequency?: string
    duration?: string
    location: string
    provider?: string
  }>
  accommodations: Array<{ category?: string; accommodation: string; setting?: string; rationale?: string } | string>
  lre?: {
    placement: string
    percent_general_ed: number
    percent_special_ed: number
    justification: string
  }
}

interface EditAndFixStepProps {
  iepData: IEPData
  remediationData: {
    original_score: number
    issues: ComplianceIssue[]
    checks_passed?: Array<{ id: string; name: string } | string>
    checks_failed?: Array<{ id: string; name: string } | string>
  }
  selectedState: string
  onIEPUpdate: (updatedIEP: IEPData) => void
  onContinue: () => void
  onBack: () => void
  onLogEvent?: (event: string, metadata?: Record<string, unknown>) => void
}

const IDEA_CATEGORIES = [
  "Autism",
  "Deaf-Blindness",
  "Deafness",
  "Emotional Disturbance",
  "Hearing Impairment",
  "Intellectual Disability",
  "Multiple Disabilities",
  "Orthopedic Impairment",
  "Other Health Impairment",
  "Specific Learning Disability",
  "Speech or Language Impairment",
  "Traumatic Brain Injury",
  "Visual Impairment",
]

// Issue Alert Component
function IssueAlert({
  issue,
  onFix,
  onMarkResolved,
  severityColors,
}: {
  issue: ComplianceIssue
  onFix: (issue: ComplianceIssue) => void
  onMarkResolved: (issueId: string) => void
  severityColors: Record<string, string>
}) {
  return (
    <div className={`p-3 rounded-lg border ${severityColors[issue.severity]} mb-2`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="w-4 h-4" />
            <span className="font-medium text-sm">{issue.title}</span>
            <Badge variant="outline" className="text-xs">
              -{issue.points_deducted} pts
            </Badge>
          </div>
          <p className="text-sm opacity-90">{issue.description}</p>
          {issue.current_text && <p className="text-xs mt-1 opacity-75">Current: "{issue.current_text}"</p>}
          {issue.suggested_fix && <p className="text-xs mt-1 font-medium">Suggested: "{issue.suggested_fix}"</p>}
        </div>
        <div className="flex flex-col gap-1">
          {issue.auto_fixable !== false && issue.suggested_fix && (
            <Button size="sm" variant="outline" className="text-xs h-7 bg-transparent" onClick={() => onFix(issue)}>
              <Sparkles className="w-3 h-3 mr-1" />
              Fix it
            </Button>
          )}
          <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => onMarkResolved(issue.id)}>
            <Edit3 className="w-3 h-3 mr-1" />
            Edit manually
          </Button>
        </div>
      </div>
    </div>
  )
}

export function EditAndFixStep({
  iepData,
  remediationData,
  selectedState,
  onIEPUpdate,
  onContinue,
  onBack,
  onLogEvent,
}: EditAndFixStepProps) {
  const [editedIEP, setEditedIEP] = useState<IEPData>(iepData)
  const [resolvedIssues, setResolvedIssues] = useState<Set<string>>(new Set())
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["student", "services"]))
  const [currentScore, setCurrentScore] = useState(remediationData.original_score)
  const [showCelebration, setShowCelebration] = useState(false)

  const issues = remediationData.issues || []

  // Calculate score based on resolved issues
  useEffect(() => {
    const pointsRecovered = issues
      .filter((issue) => resolvedIssues.has(issue.id))
      .reduce((sum, issue) => sum + (issue.points_deducted || 0), 0)

    const newScore = Math.min(100, remediationData.original_score + pointsRecovered)

    if (newScore > currentScore && newScore >= 90 && currentScore < 90) {
      setShowCelebration(true)
      setTimeout(() => setShowCelebration(false), 3000)
    }

    setCurrentScore(newScore)
  }, [resolvedIssues, remediationData.original_score, issues, currentScore])

  // Memoize the update callback
  const handleIEPUpdate = useCallback(
    (updated: IEPData) => {
      onIEPUpdate(updated)
    },
    [onIEPUpdate],
  )

  // Notify parent of IEP changes
  useEffect(() => {
    handleIEPUpdate(editedIEP)
  }, [editedIEP, handleIEPUpdate])

  const getIssuesForField = (category: string): ComplianceIssue[] => {
    return issues.filter((issue) => issue.category === category && !resolvedIssues.has(issue.id))
  }

  const markResolved = (issueId: string) => {
    setResolvedIssues(new Set([...resolvedIssues, issueId]))
    onLogEvent?.("FIX_MANUAL_ENTERED", { issueId })
  }

  const applyFix = (issue: ComplianceIssue) => {
    onLogEvent?.("FIX_AUTO_APPLIED", { issueId: issue.id, category: issue.category })

    switch (issue.category) {
      case "student_info":
      case "student_name":
        // Just mark as resolved, user will edit the field
        break

      case "eligibility":
      case "disability_category":
        // Just mark as resolved, user will select from dropdown
        break

      case "service_completeness": {
        const serviceMatch = issue.id.match(/service_(\d+)/)
        if (serviceMatch) {
          const serviceIndex = Number.parseInt(serviceMatch[1]) - 1
          const updatedServices = [...editedIEP.services]
          if (updatedServices[serviceIndex]) {
            updatedServices[serviceIndex] = {
              ...updatedServices[serviceIndex],
              frequency: updatedServices[serviceIndex].frequency || "2x per week",
              duration: updatedServices[serviceIndex].duration || "30 minutes",
              location: updatedServices[serviceIndex].location || "Special education classroom",
            }
            setEditedIEP({ ...editedIEP, services: updatedServices })
          }
        }
        break
      }

      case "goal_measurability":
      case "goal_baseline": {
        const goalMatch = issue.id.match(/goal_(\d+)/)
        if (goalMatch && issue.suggested_fix) {
          const goalIndex = Number.parseInt(goalMatch[1]) - 1
          const updatedGoals = [...editedIEP.goals]
          if (updatedGoals[goalIndex]) {
            if (issue.category === "goal_baseline") {
              updatedGoals[goalIndex] = {
                ...updatedGoals[goalIndex],
                baseline: issue.suggested_fix,
              }
            } else {
              updatedGoals[goalIndex] = {
                ...updatedGoals[goalIndex],
                goal_text: issue.suggested_fix,
              }
            }
            setEditedIEP({ ...editedIEP, goals: updatedGoals })
          }
        }
        break
      }

      case "plaafp": {
        if (issue.suggested_fix) {
          const currentPlaafp =
            typeof editedIEP.plaafp === "string"
              ? { academic: editedIEP.plaafp, functional: "", strengths: "" }
              : editedIEP.plaafp
          setEditedIEP({
            ...editedIEP,
            plaafp: {
              ...currentPlaafp,
              academic: issue.suggested_fix,
            },
          })
        }
        break
      }

      default:
        break
    }

    setResolvedIssues(new Set([...resolvedIssues, issue.id]))
  }

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  const severityColors: Record<string, string> = {
    critical: "bg-red-50 text-red-800 border-red-200",
    high: "bg-orange-50 text-orange-800 border-orange-200",
    medium: "bg-amber-50 text-amber-800 border-amber-200",
    low: "bg-blue-50 text-blue-800 border-blue-200",
  }

  const criticalIssuesRemaining = issues.filter((i) => i.severity === "critical" && !resolvedIssues.has(i.id)).length

  const canProceed = criticalIssuesRemaining === 0

  const updateStudentField = (field: string, value: string) => {
    setEditedIEP({
      ...editedIEP,
      student: { ...editedIEP.student, [field]: value },
    })

    // Auto-resolve related issues
    if (field === "name" && value && value.toLowerCase() !== "the student") {
      const nameIssue = issues.find((i) => i.category === "student_info" || i.category === "student_name")
      if (nameIssue) {
        setResolvedIssues(new Set([...resolvedIssues, nameIssue.id]))
      }
    }
  }

  const updateDisability = (value: string) => {
    setEditedIEP({
      ...editedIEP,
      eligibility: {
        ...editedIEP.eligibility,
        primary_disability: value,
      },
    })

    // Auto-resolve disability issue
    if (value && IDEA_CATEGORIES.includes(value)) {
      const disabilityIssue = issues.find((i) => i.category === "eligibility" || i.category === "disability_category")
      if (disabilityIssue) {
        setResolvedIssues(new Set([...resolvedIssues, disabilityIssue.id]))
      }
    }
  }

  const updateService = (index: number, field: string, value: string) => {
    const updatedServices = [...editedIEP.services]
    updatedServices[index] = { ...updatedServices[index], [field]: value }
    setEditedIEP({ ...editedIEP, services: updatedServices })

    // Check if service is now complete
    const service = updatedServices[index]
    const hasFrequency = service.frequency || service.sessions_per_week
    const hasDuration = service.duration || service.minutes_per_session
    const hasLocation = service.location

    if (hasFrequency && hasDuration && hasLocation) {
      const serviceIssue = issues.find(
        (i) => i.id === `service_${index + 1}_incomplete` || i.id.includes(`service_${index}`),
      )
      if (serviceIssue) {
        setResolvedIssues(new Set([...resolvedIssues, serviceIssue.id]))
      }
    }
  }

  const updateGoal = (index: number, field: string, value: string) => {
    const updatedGoals = [...editedIEP.goals]
    updatedGoals[index] = { ...updatedGoals[index], [field]: value }
    setEditedIEP({ ...editedIEP, goals: updatedGoals })
  }

  const plaafpData =
    typeof editedIEP.plaafp === "string"
      ? { academic: editedIEP.plaafp, functional: "", strengths: "" }
      : editedIEP.plaafp

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Celebration Animation */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 animate-fade-in">
          <div className="bg-white rounded-2xl p-8 shadow-2xl text-center animate-bounce-in">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900">Great Progress!</h3>
            <p className="text-gray-600 mt-2">Your IEP is now 90%+ compliant</p>
          </div>
        </div>
      )}

      {/* Score Header */}
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-white">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Edit & Fix Your IEP</h2>
              <p className="text-gray-600">Fix compliance issues before clinical review</p>
            </div>
            <div className="text-right">
              <div
                className="text-5xl font-bold transition-colors duration-300"
                style={{
                  color: currentScore >= 90 ? "#22c55e" : currentScore >= 70 ? "#f59e0b" : "#ef4444",
                }}
              >
                {currentScore}%
              </div>
              <p className="text-sm text-gray-500">Compliance Score</p>
              {issues.length > 0 && (
                <p className="text-xs text-gray-400 mt-1">
                  {issues.length - resolvedIssues.size} of {issues.length} issues remaining
                </p>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-500 rounded-full"
              style={{
                width: `${(resolvedIssues.size / Math.max(issues.length, 1)) * 100}%`,
                backgroundColor: currentScore >= 90 ? "#22c55e" : currentScore >= 70 ? "#f59e0b" : "#3b82f6",
              }}
            />
          </div>

          {criticalIssuesRemaining > 0 && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <span className="text-red-800 text-sm">
                {criticalIssuesRemaining} critical issue{criticalIssuesRemaining > 1 ? "s" : ""} must be fixed before
                continuing
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Student Information Section */}
      <Card>
        <CardHeader
          className="cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => toggleSection("student")}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">Student Information</CardTitle>
              {(getIssuesForField("student_info").length > 0 || getIssuesForField("student_name").length > 0) && (
                <Badge variant="destructive">
                  {getIssuesForField("student_info").length + getIssuesForField("student_name").length} issues
                </Badge>
              )}
            </div>
            {expandedSections.has("student") ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </CardHeader>

        {expandedSections.has("student") && (
          <CardContent className="space-y-4">
            {/* Student Name Issue Alert */}
            {[...getIssuesForField("student_info"), ...getIssuesForField("student_name")]
              .filter((i) => i.id.includes("name"))
              .map((issue) => (
                <IssueAlert
                  key={issue.id}
                  issue={issue}
                  onFix={applyFix}
                  onMarkResolved={markResolved}
                  severityColors={severityColors}
                />
              ))}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Student Name *</label>
                <Input
                  value={editedIEP.student.name || ""}
                  onChange={(e) => updateStudentField("name", e.target.value)}
                  placeholder="Enter student's full name"
                  className={
                    !editedIEP.student.name || editedIEP.student.name.toLowerCase() === "the student"
                      ? "border-red-300"
                      : ""
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Grade</label>
                <Input
                  value={editedIEP.student.grade || ""}
                  onChange={(e) => updateStudentField("grade", e.target.value)}
                  placeholder="e.g., 3rd Grade"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">School</label>
                <Input
                  value={editedIEP.student.school || ""}
                  onChange={(e) => updateStudentField("school", e.target.value)}
                  placeholder="School name"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">District</label>
                <Input
                  value={editedIEP.student.district || ""}
                  onChange={(e) => updateStudentField("district", e.target.value)}
                  placeholder="District name"
                />
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Eligibility/Disability Section */}
      <Card>
        <CardHeader
          className="cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => toggleSection("eligibility")}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">Eligibility & Disability</CardTitle>
              {(getIssuesForField("eligibility").length > 0 || getIssuesForField("disability_category").length > 0) && (
                <Badge variant="destructive">
                  {getIssuesForField("eligibility").length + getIssuesForField("disability_category").length} issues
                </Badge>
              )}
            </div>
            {expandedSections.has("eligibility") ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </div>
        </CardHeader>

        {expandedSections.has("eligibility") && (
          <CardContent className="space-y-4">
            {[...getIssuesForField("eligibility"), ...getIssuesForField("disability_category")].map((issue) => (
              <IssueAlert
                key={issue.id}
                issue={issue}
                onFix={applyFix}
                onMarkResolved={markResolved}
                severityColors={severityColors}
              />
            ))}

            <div className="space-y-2">
              <label className="text-sm font-medium">Primary Disability Category *</label>
              <select
                className="w-full p-2 border rounded-md bg-white"
                value={editedIEP.eligibility?.primary_disability || ""}
                onChange={(e) => updateDisability(e.target.value)}
              >
                <option value="">Select IDEA disability category...</option>
                {IDEA_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500">
                Must be one of the 13 IDEA disability categories. Deducts 15 points if missing.
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Services Section */}
      <Card>
        <CardHeader
          className="cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => toggleSection("services")}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">Services</CardTitle>
              {getIssuesForField("service_completeness").length > 0 && (
                <Badge variant="destructive">{getIssuesForField("service_completeness").length} issues</Badge>
              )}
            </div>
            {expandedSections.has("services") ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </CardHeader>

        {expandedSections.has("services") && (
          <CardContent className="space-y-4">
            {getIssuesForField("service_completeness").map((issue) => (
              <IssueAlert
                key={issue.id}
                issue={issue}
                onFix={applyFix}
                onMarkResolved={markResolved}
                severityColors={severityColors}
              />
            ))}

            {editedIEP.services.map((service, index) => {
              const hasFrequency = service.frequency || service.sessions_per_week
              const hasDuration = service.duration || service.minutes_per_session
              const hasLocation = service.location
              const isComplete = hasFrequency && hasDuration && hasLocation

              return (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${isComplete ? "border-green-200 bg-green-50" : "border-orange-200 bg-orange-50"}`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    {isComplete ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-orange-600" />
                    )}
                    <span className="font-medium">{service.type || `Service ${index + 1}`}</span>
                    {!isComplete && (
                      <Badge variant="outline" className="text-orange-700 border-orange-300">
                        Incomplete - 12 pts
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-600">Frequency *</label>
                      <Input
                        value={
                          service.frequency || (service.sessions_per_week ? `${service.sessions_per_week}x/week` : "")
                        }
                        onChange={(e) => updateService(index, "frequency", e.target.value)}
                        placeholder="e.g., 2x per week"
                        className={!hasFrequency ? "border-orange-300" : ""}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-600">Duration *</label>
                      <Input
                        value={
                          service.duration || (service.minutes_per_session ? `${service.minutes_per_session} min` : "")
                        }
                        onChange={(e) => updateService(index, "duration", e.target.value)}
                        placeholder="e.g., 30 minutes"
                        className={!hasDuration ? "border-orange-300" : ""}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-600">Location *</label>
                      <Input
                        value={service.location || ""}
                        onChange={(e) => updateService(index, "location", e.target.value)}
                        placeholder="e.g., Resource room"
                        className={!hasLocation ? "border-orange-300" : ""}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        )}
      </Card>

      {/* Goals Section */}
      <Card>
        <CardHeader
          className="cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => toggleSection("goals")}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">Goals</CardTitle>
              {(getIssuesForField("goal_measurability").length > 0 ||
                getIssuesForField("goal_baseline").length > 0) && (
                <Badge variant="destructive">
                  {getIssuesForField("goal_measurability").length + getIssuesForField("goal_baseline").length} issues
                </Badge>
              )}
            </div>
            {expandedSections.has("goals") ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </CardHeader>

        {expandedSections.has("goals") && (
          <CardContent className="space-y-4">
            {[...getIssuesForField("goal_measurability"), ...getIssuesForField("goal_baseline")].map((issue) => (
              <IssueAlert
                key={issue.id}
                issue={issue}
                onFix={applyFix}
                onMarkResolved={markResolved}
                severityColors={severityColors}
              />
            ))}

            {editedIEP.goals.map((goal, index) => (
              <div key={index} className="p-4 rounded-lg border bg-gray-50 space-y-3">
                <div className="flex items-center gap-2">
                  <Badge>{goal.area || `Goal ${index + 1}`}</Badge>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-600">Goal Text</label>
                  <Textarea
                    value={goal.goal_text || ""}
                    onChange={(e) => updateGoal(index, "goal_text", e.target.value)}
                    rows={2}
                    className="text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-600">Baseline</label>
                    <Input
                      value={goal.baseline || ""}
                      onChange={(e) => updateGoal(index, "baseline", e.target.value)}
                      placeholder="Current performance level"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-600">Target</label>
                    <Input
                      value={goal.target || ""}
                      onChange={(e) => updateGoal(index, "target", e.target.value)}
                      placeholder="Target performance"
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        )}
      </Card>

      {/* PLAAFP Section */}
      <Card>
        <CardHeader
          className="cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => toggleSection("plaafp")}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">Present Levels (PLAAFP)</CardTitle>
              {getIssuesForField("plaafp").length > 0 && (
                <Badge variant="destructive">{getIssuesForField("plaafp").length} issues</Badge>
              )}
            </div>
            {expandedSections.has("plaafp") ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </CardHeader>

        {expandedSections.has("plaafp") && (
          <CardContent className="space-y-4">
            {getIssuesForField("plaafp").map((issue) => (
              <IssueAlert
                key={issue.id}
                issue={issue}
                onFix={applyFix}
                onMarkResolved={markResolved}
                severityColors={severityColors}
              />
            ))}

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Academic Performance</label>
                <Textarea
                  value={plaafpData.academic || ""}
                  onChange={(e) => {
                    const updated =
                      typeof editedIEP.plaafp === "string"
                        ? { academic: e.target.value, functional: "", strengths: "" }
                        : { ...editedIEP.plaafp, academic: e.target.value }
                    setEditedIEP({ ...editedIEP, plaafp: updated })
                  }}
                  rows={3}
                  placeholder="Describe academic performance and achievement levels..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Functional Performance</label>
                <Textarea
                  value={plaafpData.functional || ""}
                  onChange={(e) => {
                    const updated =
                      typeof editedIEP.plaafp === "string"
                        ? { academic: editedIEP.plaafp, functional: e.target.value, strengths: "" }
                        : { ...editedIEP.plaafp, functional: e.target.value }
                    setEditedIEP({ ...editedIEP, plaafp: updated })
                  }}
                  rows={3}
                  placeholder="Describe functional performance and daily living skills..."
                />
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Review
        </Button>

        <Button
          onClick={() => {
            onLogEvent?.("EDIT_COMPLETE", {
              finalScore: currentScore,
              issuesResolved: resolvedIssues.size,
            })
            onContinue()
          }}
          disabled={!canProceed}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Continue to Clinical Review
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {!canProceed && <p className="text-center text-sm text-gray-500">Resolve all critical issues to continue</p>}
    </div>
  )
}
