"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Sparkles, Edit3, ArrowLeft, ArrowRight, Lightbulb } from "lucide-react"
import { parseDateFlexible, formatDateForDisplay } from "@/utils/date-utils"

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

// Clinical categories that should always be treated as suggestions
const CLINICAL_CATEGORIES = [
  'assessment_currency',
  'goal_feasibility',
  'goal_accommodation_alignment',
  'goal_zpd',
  'behaviorist_language',
  'service_intensity'
]

// Issues that require manual input from the user
const INPUT_REQUIRED_IDS = ['dob_missing', 'student_name_missing']

// Clinical categories that require acknowledgment (subset of clinical categories)
const ACKNOWLEDGMENT_CATEGORIES = [
  'assessment_currency', 
  'goal_feasibility', 
  'goal_accommodation_alignment', 
  'goal_zpd'
]

// Determine the issue type based on category and severity
const getIssueType = (issue: ComplianceIssue): 'must-fix' | 'should-fix' | 'suggestion' => {
  if (CLINICAL_CATEGORIES.includes(issue.category)) return 'suggestion'
  if (issue.severity === 'critical') return 'must-fix'
  if (issue.severity === 'high') return 'should-fix'
  return 'suggestion'
}

// Configuration for each issue type
const issueTypeConfig = {
  'must-fix': {
    label: 'Must Fix',
    sublabel: 'Required for compliance',
    icon: AlertTriangle,
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    badge: 'bg-red-100 text-red-700',
    iconColor: 'text-red-600',
    defaultExpanded: true,
    dismissable: false
  },
  'should-fix': {
    label: 'Should Fix',
    sublabel: 'Recommended before meeting',
    icon: AlertCircle,
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-800',
    badge: 'bg-orange-100 text-orange-700',
    iconColor: 'text-orange-600',
    defaultExpanded: true,
    dismissable: false
  },
  'suggestion': {
    label: 'Suggestion',
    sublabel: 'Would strengthen the IEP',
    icon: Lightbulb,
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-800',
    badge: 'bg-blue-100 text-blue-700',
    iconColor: 'text-blue-600',
    defaultExpanded: false,
    dismissable: true
  }
}

// Helper functions for issue behavior
const requiresManualInput = (issue: ComplianceIssue) => INPUT_REQUIRED_IDS.includes(issue.id)
const requiresAcknowledgment = (issue: ComplianceIssue) => ACKNOWLEDGMENT_CATEGORIES.includes(issue.category)
const canAutoFix = (issue: ComplianceIssue) => {
  return issue.auto_fixable && issue.suggested_fix && !requiresManualInput(issue) && !requiresAcknowledgment(issue)
}

// Issue Alert Component
function IssueAlert({
  issue,
  onFix,
  onMarkResolved,
  onDismiss,
  onUpdateField,
}: {
  issue: ComplianceIssue
  onFix: (issue: ComplianceIssue) => void
  onMarkResolved: (issueId: string) => void
  onDismiss?: (issueId: string) => void
  onUpdateField: (field: string, value: string) => void
}) {
  const issueType = getIssueType(issue)
  const config = issueTypeConfig[issueType]
  const IconComponent = config.icon

  return (
    <div className={`p-3 rounded-lg border ${config.bg} ${config.border} mb-2`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <IconComponent className={`w-4 h-4 ${config.iconColor}`} />
            <span className={`font-medium text-sm ${config.text}`}>{issue.title}</span>
            <Badge variant="outline" className={`text-xs ${config.badge}`}>{config.label}</Badge>
            <Badge variant="outline" className="text-xs">-{issue.points_deducted} pts</Badge>
          </div>
          <p className={`text-sm ${config.text} opacity-90`}>{issue.description}</p>

          {/* DOB Input - inline date picker */}
          {issue.id === 'dob_missing' && (
            <div className="mt-3 p-3 bg-white rounded-lg border border-red-200">
              <label className="text-sm font-medium text-gray-700 block mb-2">Enter Date of Birth:</label>
              <input
                type="date"
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                onChange={(e) => {
                  if (e.target.value) onUpdateField('dob', e.target.value)
                }}
              />
              <p className="text-xs text-gray-500 mt-1">Select date from calendar</p>
            </div>
          )}

          {/* Name Input - inline text field */}
          {issue.id === 'student_name_missing' && (
            <div className="mt-3 p-3 bg-white rounded-lg border border-red-200">
              <label className="text-sm font-medium text-gray-700 block mb-2">Enter Student's Full Legal Name:</label>
              <Input
                type="text"
                placeholder="e.g., Marcus Anthony Johnson"
                className="w-72"
                onChange={(e) => {
                  const value = e.target.value.trim()
                  if (value && value.toLowerCase() !== 'the student') onUpdateField('name', value)
                }}
              />
            </div>
          )}

          {/* Acknowledgment for clinical issues */}
          {requiresAcknowledgment(issue) && (
            <div className="mt-3">
              <p className="text-xs text-blue-700 mb-2 italic">{issue.fix_explanation}</p>
              <Button size="sm" variant="outline" className="text-blue-700 border-blue-300" onClick={() => onMarkResolved(issue.id)}>
                I'll address this
              </Button>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1">
          {canAutoFix(issue) && (
            <>
              <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => onFix(issue)}>
                <Sparkles className="w-3 h-3 mr-1" />Fix it for me
              </Button>
              <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => onMarkResolved(issue.id)}>
                <Edit3 className="w-3 h-3 mr-1" />Edit manually
              </Button>
            </>
          )}
          {config.dismissable && onDismiss && (
            <Button size="sm" variant="ghost" className="text-xs h-7 text-slate-500" onClick={() => onDismiss(issue.id)}>
              Dismiss
            </Button>
          )}
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
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [dismissedIssues, setDismissedIssues] = useState<Set<string>>(new Set())

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

  const dismissIssue = (issueId: string) => {
    setDismissedIssues(new Set([...dismissedIssues, issueId]))
    onLogEvent?.("SUGGESTION_DISMISSED", { issueId })
  }

  const getIssuesByType = () => {
    const activeIssues = issues.filter(i => !resolvedIssues.has(i.id) && !dismissedIssues.has(i.id))
    return {
      mustFix: activeIssues.filter(i => getIssueType(i) === 'must-fix'),
      shouldFix: activeIssues.filter(i => getIssueType(i) === 'should-fix'),
      suggestions: activeIssues.filter(i => getIssueType(i) === 'suggestion')
    }
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
      case "goal_baseline":
      case "goal_feasibility":
      case "goal_accommodation_alignment":
      case "goal_zpd": {
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

      case "plaafp":
      case "present_levels":
      case "assessment_currency": {
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

  const { mustFix, shouldFix, suggestions } = getIssuesByType()
  const canProceed = mustFix.length === 0

  const updateStudentField = (field: string, value: string) => {
    setEditedIEP({
      ...editedIEP,
      student: { ...editedIEP.student, [field]: value },
    })

    // Auto-resolve DOB issue
    if (field === "dob" && value) {
      const dobIssue = issues.find(i => i.id === "dob_missing" || (i.category === "student_info" && i.id.includes("dob")))
      if (dobIssue) {
        setResolvedIssues(new Set([...resolvedIssues, dobIssue.id]))
        onLogEvent?.("DOB_ENTERED", { field: "dob" })
      }
    }

    // Auto-resolve name issue
    if (field === "name" && value && value.trim().length > 0 && value.toLowerCase() !== "the student") {
      const nameIssue = issues.find(i => i.id === "student_name_missing" || (i.category === "student_info" && i.id.includes("name")))
      if (nameIssue) {
        setResolvedIssues(new Set([...resolvedIssues, nameIssue.id]))
        onLogEvent?.("NAME_ENTERED", { field: "name" })
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

          {mustFix.length > 0 && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <span className="text-red-800 text-sm">
                {mustFix.length} issue{mustFix.length > 1 ? "s" : ""} must be fixed before continuing
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Must Fix Issues Section */}
      {mustFix.length > 0 && (
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader className="py-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <CardTitle className="text-base text-red-800">Must Fix Issues</CardTitle>
              <Badge className="bg-red-100 text-red-700 border-red-200">{mustFix.length} required</Badge>
            </div>
            <p className="text-sm text-red-600 mt-1">These issues must be resolved to continue</p>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {mustFix.map((issue) => (
              <IssueAlert
                key={issue.id}
                issue={issue}
                onFix={applyFix}
                onMarkResolved={markResolved}
                onDismiss={dismissIssue}
                onUpdateField={updateStudentField}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Should Fix Issues Section */}
      {shouldFix.length > 0 && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader className="py-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              <CardTitle className="text-base text-orange-800">Should Fix Issues</CardTitle>
              <Badge className="bg-orange-100 text-orange-700 border-orange-200">{shouldFix.length} recommended</Badge>
            </div>
            <p className="text-sm text-orange-600 mt-1">Recommended to fix before the IEP meeting</p>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {shouldFix.map((issue) => (
              <IssueAlert
                key={issue.id}
                issue={issue}
                onFix={applyFix}
                onMarkResolved={markResolved}
                onDismiss={dismissIssue}
                onUpdateField={updateStudentField}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Suggestions Section - Collapsed by Default */}
      {suggestions.length > 0 && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader className="cursor-pointer hover:bg-blue-100/50 transition-colors py-3" onClick={() => setShowSuggestions(!showSuggestions)}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-blue-600" />
                <CardTitle className="text-base text-blue-800">Suggestions to Strengthen This IEP</CardTitle>
                <Badge className="bg-blue-100 text-blue-700 border-blue-200">{suggestions.length} optional</Badge>
              </div>
              {showSuggestions ? <ChevronUp className="w-5 h-5 text-blue-600" /> : <ChevronDown className="w-5 h-5 text-blue-600" />}
            </div>
            <p className="text-sm text-blue-600 mt-1">These would make the IEP stronger but won't block your progress</p>
          </CardHeader>
          {showSuggestions && (
            <CardContent className="space-y-2 pt-0">
              {suggestions.map((issue) => (
                <IssueAlert
                  key={issue.id}
                  issue={issue}
                  onFix={applyFix}
                  onMarkResolved={markResolved}
                  onDismiss={dismissIssue}
                  onUpdateField={updateStudentField}
                />
              ))}
            </CardContent>
          )}
        </Card>
      )}

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
                <label className="text-sm font-medium">Date of Birth</label>
                <Input
                  defaultValue={formatDateForDisplay(editedIEP.student.dob) || ""}
                  onBlur={(e) => {
                    const parsed = parseDateFlexible(e.target.value)
                    if (parsed) updateStudentField("dob", parsed)
                  }}
                  placeholder="MM/DD/YYYY or June 18, 2019"
                  type="text"
                  style={{ direction: 'ltr', textAlign: 'left' }}
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
                onDismiss={dismissIssue}
                onUpdateField={updateStudentField}
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
                onDismiss={dismissIssue}
                onUpdateField={updateStudentField}
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
                getIssuesForField("goal_baseline").length > 0 ||
                getIssuesForField("goal_feasibility").length > 0 ||
                getIssuesForField("goal_accommodation_alignment").length > 0 ||
                getIssuesForField("goal_zpd").length > 0) && (
                <Badge variant="destructive">
                  {getIssuesForField("goal_measurability").length +
                    getIssuesForField("goal_baseline").length +
                    getIssuesForField("goal_feasibility").length +
                    getIssuesForField("goal_accommodation_alignment").length +
                    getIssuesForField("goal_zpd").length}{" "}
                  issues
                </Badge>
              )}
            </div>
            {expandedSections.has("goals") ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </CardHeader>

        {expandedSections.has("goals") && (
          <CardContent className="space-y-4">
            {[
              ...getIssuesForField("goal_measurability"),
              ...getIssuesForField("goal_baseline"),
              ...getIssuesForField("goal_feasibility"),
              ...getIssuesForField("goal_accommodation_alignment"),
              ...getIssuesForField("goal_zpd"),
            ].map((issue) => (
              <IssueAlert
                key={issue.id}
                issue={issue}
                onFix={applyFix}
                onMarkResolved={markResolved}
                onDismiss={dismissIssue}
                onUpdateField={updateStudentField}
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
              {(getIssuesForField("plaafp").length > 0 ||
                getIssuesForField("present_levels").length > 0 ||
                getIssuesForField("assessment_currency").length > 0) && (
                <Badge variant="destructive">
                  {getIssuesForField("plaafp").length +
                    getIssuesForField("present_levels").length +
                    getIssuesForField("assessment_currency").length}{" "}
                  issues
                </Badge>
              )}
            </div>
            {expandedSections.has("plaafp") ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </CardHeader>

        {expandedSections.has("plaafp") && (
          <CardContent className="space-y-4">
            {[
              ...getIssuesForField("plaafp"),
              ...getIssuesForField("present_levels"),
              ...getIssuesForField("assessment_currency"),
            ].map((issue) => (
              <IssueAlert
                key={issue.id}
                issue={issue}
                onFix={applyFix}
                onMarkResolved={markResolved}
                onDismiss={dismissIssue}
                onUpdateField={updateStudentField}
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

      {!canProceed && <p className="text-center text-sm text-gray-500">Resolve all "Must Fix" issues to continue</p>}
    </div>
  )
}
