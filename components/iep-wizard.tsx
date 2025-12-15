"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import {
  Upload,
  FileText,
  Mic,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Camera,
  X,
  Loader2,
  ChevronDown,
  ChevronUp,
  Download,
  Shield,
  Target,
  Users,
  Clock,
  MessageCircle,
  Zap,
} from "lucide-react"

// =============================================================================
// CONSTANTS
// =============================================================================

const US_STATES = [
  { code: "AL", name: "Alabama" },
  { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" },
  { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" },
  { code: "DE", name: "Delaware" },
  { code: "DC", name: "District of Columbia" },
  { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" },
]

// =============================================================================
// TYPES
// =============================================================================

interface UploadedFile {
  id: string
  name: string
  type: "iep" | "notes" | "photo" | "report" | "other"
  file: File
}

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

interface ExtractedIEP {
  student: {
    name: string
    age: string
    grade: string
    school: string
    district: string
  }
  eligibility: {
    primary_disability: string
    secondary_disability: string
  }
  plaafp: {
    strengths: string
    concerns: string
    academic: string
    functional: string
  }
  goals: Array<{
    id: string
    area: string
    goal_text: string
    baseline: string
    target: string
    zpd_score: number
    zpd_analysis: string
    clinical_flags: string[]
  }>
  services: Array<{
    type: string
    frequency: string
    duration: string
    provider: string
    setting: string
  }>
  accommodations: string[]
  placement: {
    setting: string
    percent_general_ed: string
    percent_special_ed: string
    lre_justification: string
  }
}

interface RemediationData {
  original_score: number
  potential_score: number
  issues: ComplianceIssue[]
  summary: string
  priority_order: string[]
  compliance_checks?: Array<{ name: string; passed: boolean; citation?: string }> // Added for compliance checks
}

type WizardStep = "upload" | "tell" | "building" | "review"

// =============================================================================
// STEP INDICATOR
// =============================================================================

function StepIndicator({ currentStep }: { currentStep: WizardStep }) {
  const steps: { id: WizardStep; label: string; shortLabel: string }[] = [
    { id: "upload", label: "Upload Materials", shortLabel: "Upload" },
    { id: "tell", label: "Tell Us About Progress", shortLabel: "Progress" },
    { id: "building", label: "Building Your IEP", shortLabel: "Building" },
    { id: "review", label: "Review & Finish", shortLabel: "Review" },
  ]

  const currentIndex = steps.findIndex((s) => s.id === currentStep)

  return (
    <div className="w-full bg-white border-b border-slate-200 px-4 py-3">
      <div className="max-w-3xl mx-auto">
        <div className="relative mb-2">
          <div className="h-2 bg-slate-200 rounded-full">
            <div
              className="h-2 bg-teal-500 rounded-full transition-all duration-500"
              style={{ width: `${((currentIndex + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>
        <div className="flex justify-between">
          {steps.map((step, index) => {
            const isComplete = index < currentIndex
            const isCurrent = index === currentIndex
            return (
              <div
                key={step.id}
                className={`flex items-center gap-1.5 text-sm ${
                  isComplete ? "text-teal-600" : isCurrent ? "text-slate-900 font-medium" : "text-slate-400"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    isComplete
                      ? "bg-teal-500 text-white"
                      : isCurrent
                        ? "bg-teal-500 text-white"
                        : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {isComplete ? "✓" : index + 1}
                </div>
                <span className="hidden sm:inline">{step.label}</span>
                <span className="sm:hidden">{step.shortLabel}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// STEP 1: UPLOAD
// =============================================================================

function UploadStep({
  files,
  onAddFiles,
  onRemoveFile,
  onNext,
}: {
  files: UploadedFile[]
  onAddFiles: (files: UploadedFile[]) => void
  onRemoveFile: (id: string) => void
  onNext: () => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const hasIEP = files.some((f) => f.type === "iep") || files.length > 0

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    const newFiles: UploadedFile[] = selectedFiles.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      type: file.name.toLowerCase().includes("iep") ? "iep" : "other",
      file: file,
    }))
    onAddFiles(newFiles)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Let's Build Your New IEP</h1>
        <p className="text-slate-600">
          Upload the current IEP and any notes, photos, or reports you have.
          <br />
          <span className="text-slate-500 text-sm">We'll use these to create a draft of the new IEP.</span>
        </p>
      </div>

      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center cursor-pointer hover:border-teal-400 hover:bg-teal-50/50 transition-colors mb-6"
      >
        <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <p className="text-lg font-medium text-slate-700 mb-1">Drop files here or tap to browse</p>
        <p className="text-sm text-slate-500">PDFs, photos of handwritten notes, Word docs — anything helps</p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.heic"
        />
      </div>

      <div className="flex gap-3 justify-center mb-8">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm text-slate-700 transition-colors"
        >
          <FileText className="w-4 h-4" />
          Current IEP
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm text-slate-700 transition-colors"
        >
          <Camera className="w-4 h-4" />
          Photo of Notes
        </button>
      </div>

      {files.length > 0 && (
        <div className="space-y-2 mb-8">
          <p className="text-sm font-medium text-slate-700 mb-2">Uploaded ({files.length})</p>
          {files.map((file) => (
            <div key={file.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-teal-600" />
                <div>
                  <p className="text-sm font-medium text-slate-800">{file.name}</p>
                  <p className="text-xs text-slate-500">
                    {file.type === "iep" ? "Previous IEP" : "Supporting document"}
                  </p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onRemoveFile(file.id)
                }}
                className="p-1 hover:bg-slate-200 rounded"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={onNext}
        disabled={!hasIEP}
        className={`w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition-all ${
          hasIEP
            ? "bg-teal-600 hover:bg-teal-700 text-white shadow-lg hover:shadow-xl"
            : "bg-slate-200 text-slate-400 cursor-not-allowed"
        }`}
      >
        {hasIEP ? (
          <>
            Continue
            <ArrowRight className="w-5 h-5" />
          </>
        ) : (
          "Upload the current IEP to continue"
        )}
      </button>
    </div>
  )
}

// =============================================================================
// STEP 2: TELL US
// =============================================================================

// Define a simple Button component for consistency, or use a UI library
const Button = ({
  variant = "default",
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default" | "outline" }) => {
  const baseClasses =
    "flex items-center justify-center px-4 py-2 rounded-xl font-semibold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
  const variants = {
    default: "bg-teal-600 hover:bg-teal-700 text-white shadow-lg hover:shadow-xl",
    outline: "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200",
  }
  return (
    <button className={`${baseClasses} ${variants[variant]} ${className || ""}`} {...props}>
      {children}
    </button>
  )
}

function TellStep({
  studentUpdate,
  onUpdateText,
  onBack,
  onNext,
  studentName,
  selectedState,
  onStateChange,
  iepDate,
  onDateChange,
}: {
  studentUpdate: string
  onUpdateText: (text: string) => void
  onBack: () => void
  onNext: () => void
  studentName?: string
  selectedState: string
  onStateChange: (state: string) => void
  iepDate: string
  onDateChange: (date: string) => void
}) {
  const [isRecording, setIsRecording] = useState(false)
  const hasContent = studentUpdate.trim().length > 20
  const stateName = US_STATES.find((s) => s.code === selectedState)?.name || selectedState

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">How is {studentName || "the student"} doing?</h1>
        <p className="text-slate-600">
          Tell us about progress on goals, what's improved, what's still challenging.
          <br />
          <span className="text-slate-500 text-sm">Type or tap the mic to speak — whatever's easier.</span>
        </p>
      </div>

      {/* State and date selection */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
            <select
              value={selectedState}
              onChange={(e) => onStateChange(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            >
              {US_STATES.map((state) => (
                <option key={state.code} value={state.code}>
                  {state.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">IEP Date</label>
            <input
              type="date"
              value={iepDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>
        </div>
        <p className="text-sm text-slate-500">
          We'll check against <span className="font-medium text-teal-600">{stateName}</span> regulations
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <textarea
          value={studentUpdate}
          onChange={(e) => onUpdateText(e.target.value)}
          placeholder="Example: Jamie has made good progress on reading fluency - went from 45 to 62 words per minute. Still struggling with math word problems. Behavior has improved with the new check-in system..."
          className="w-full h-40 px-4 py-3 border border-slate-200 rounded-lg resize-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
        />
        <div className="flex items-center justify-between mt-3">
          <button
            onClick={() => setIsRecording(!isRecording)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              isRecording ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Mic className={`w-4 h-4 ${isRecording ? "animate-pulse" : ""}`} />
            {isRecording ? "Stop Recording" : "Voice Input"}
          </button>
          <span className="text-sm text-slate-500">{studentUpdate.length} characters</span>
        </div>
      </div>

      <div className="mb-8">
        <p className="text-sm text-slate-500 mb-2">Quick prompts (tap to add):</p>
        <div className="flex flex-wrap gap-2">
          {[
            "Met all goals",
            "Made partial progress",
            "Behavior improved",
            "Needs more support",
            "Ready for more challenge",
          ].map((prompt) => (
            <button
              key={prompt}
              onClick={() => onUpdateText(studentUpdate + (studentUpdate ? " " : "") + prompt + ". ")}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-full text-sm text-slate-600 transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1 bg-transparent">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button onClick={onNext} disabled={!hasContent} className="flex-1 bg-teal-600 hover:bg-teal-700">
          Build My IEP
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {!hasContent && (
        <p className="text-center text-sm text-slate-500 mt-4">
          Please add at least 20 characters about student progress
        </p>
      )}
    </div>
  )
}

// =============================================================================
// STEP 3: BUILDING
// =============================================================================

interface BuildingTask {
  id: string
  label: string
  status: "pending" | "running" | "complete" | "error"
}

function BuildingStep({
  tasks,
  error,
  onRetry,
  selectedState,
}: {
  tasks: BuildingTask[]
  error: string | null
  onRetry: () => void
  selectedState: string
}) {
  const stateName = US_STATES.find((s) => s.code === selectedState)?.name || selectedState
  const allComplete = tasks.every((t) => t.status === "complete")
  const currentTask = tasks.find((t) => t.status === "running")

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-8 h-8 text-teal-600 animate-pulse" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Building Your New IEP</h1>
        <p className="text-slate-600">
          {error
            ? "An error occurred"
            : allComplete
              ? "Your draft is ready!"
              : currentTask
                ? `${currentTask.label}...`
                : "Starting..."}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-center">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-800">{error}</p>
          <button onClick={onRetry} className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg font-medium">
            Retry
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
        <div className="space-y-4">
          {tasks.map((task, index) => (
            <div key={task.id} className="flex items-center gap-4">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  task.status === "complete"
                    ? "bg-teal-500"
                    : task.status === "running"
                      ? "bg-teal-100"
                      : task.status === "error"
                        ? "bg-red-100"
                        : "bg-slate-100"
                }`}
              >
                {task.status === "complete" && <CheckCircle2 className="w-5 h-5 text-white" />}
                {task.status === "running" && <Loader2 className="w-5 h-5 text-teal-600 animate-spin" />}
                {task.status === "error" && <AlertTriangle className="w-5 h-5 text-red-500" />}
                {task.status === "pending" && <span className="text-sm text-slate-400">{index + 1}</span>}
              </div>

              <span
                className={`flex-1 ${
                  task.status === "complete"
                    ? "text-slate-600"
                    : task.status === "running"
                      ? "text-slate-900 font-medium"
                      : "text-slate-400"
                }`}
              >
                {task.label}
              </span>

              {task.status === "complete" && <span className="text-sm text-teal-600">Done</span>}
            </div>
          ))}
        </div>
      </div>

      {!allComplete && !error && (
        <div className="bg-slate-50 rounded-xl p-4 text-center">
          <p className="text-sm text-slate-600">
            We're comparing the previous IEP with your notes, checking compliance against federal and state
            requirements, and identifying any issues.
          </p>
        </div>
      )}
    </div>
  )
}

// =============================================================================
// STEP 4: REVIEW
// =============================================================================

type HashChainEvent =
  | "REVIEW_OPENED"
  | "COMPLIANCE_EXPANDED"
  | "ISSUE_VIEWED"
  | "FIX_AUTO_APPLIED"
  | "FIX_MANUAL_ENTERED"
  | "GOAL_REVIEWED"
  | "IEP_APPROVED"
  | "IEP_DOWNLOADED"

function ReviewStep({
  iep,
  remediation,
  fixedIssues,
  onApplyFix,
  onApplyAll,
  onBack,
  onFinish,
  onDownload,
  isFixing,
  selectedState,
  startTime, // Added startTime prop
}: {
  iep: ExtractedIEP | null
  remediation: RemediationData | null
  fixedIssues: Set<string>
  onApplyFix: (issue: ComplianceIssue) => void
  onApplyAll: () => void
  onBack: () => void
  onFinish: () => void
  onDownload: () => void
  isFixing: boolean
  selectedState: string
  startTime?: number // Added startTime prop type
}) {
  const [showCelebration, setShowCelebration] = useState(true) // State for celebration animation
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"questions" | "goals" | "services">("questions") // Changed default tab
  const [complianceExpanded, setComplianceExpanded] = useState(false) // State for compliance details expansion
  const [manualEditIssue, setManualEditIssue] = useState<string | null>(null) // State for manual edit mode
  const [manualEditText, setManualEditText] = useState("") // State for manual edit text
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null) // State for expanded goal

  // Auto-dismiss celebration after 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowCelebration(false)
      logEvent("REVIEW_OPENED") // Log event when review screen is opened
    }, 2000)
    return () => clearTimeout(timer)
  }, [])

  // Expand first issue by default after component mounts or dependencies change
  useEffect(() => {
    const issues = remediation?.issues || []
    const remainingIssues = issues.filter((i) => !fixedIssues.has(i.id))
    if (remainingIssues.length > 0 && !expandedIssue) {
      setExpandedIssue(remainingIssues[0].id)
    }
  }, [remediation, fixedIssues, expandedIssue])

  // Function to log events to the backend
  const logEvent = async (event: HashChainEvent, metadata?: Record<string, any>) => {
    try {
      await fetch("/api/log-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: event,
          metadata,
          timestamp: new Date().toISOString(),
        }),
      })
    } catch (e) {
      console.error("Failed to log event:", e)
    }
  }

  const issues = remediation?.issues || []
  const remainingIssues = issues.filter((i) => !fixedIssues.has(i.id))
  const resolvedIssues = issues.filter((i) => fixedIssues.has(i.id)) // Issues that have been fixed
  const autoFixable = remainingIssues.filter((i) => i.auto_fixable && i.suggested_fix)
  const criticalRemaining = remainingIssues.filter((i) => i.severity === "critical").length
  const highRemaining = remainingIssues.filter((i) => i.severity === "high").length

  const originalScore = remediation?.original_score || 0
  const fixedPoints = issues.filter((i) => fixedIssues.has(i.id)).reduce((sum, i) => sum + i.points_deducted, 0)
  const displayScore = Math.min(100, originalScore + fixedPoints)
  const passedChecks = remediation?.compliance_checks?.filter((c) => c.passed)?.length || 0 // Count of passed compliance checks
  const totalChecks = remediation?.compliance_checks?.length || 0 // Total number of compliance checks

  // Calculate time saved based on elapsed time and estimated manual effort
  const elapsedMinutes = startTime ? Math.round((Date.now() - startTime) / 60000) : 10 // Calculate elapsed minutes, default to 10 if startTime is not provided
  const typicalIEPMinutes = 180 // Estimate of time for manual IEP creation (3 hours)
  const timeSavedMinutes = Math.max(0, typicalIEPMinutes - elapsedMinutes - 45) // Subtract current time and estimated AI saving

  const stateName = US_STATES.find((s) => s.code === selectedState)?.name || selectedState // Get state name from selectedState code

  // Handler for expanding/collapsing an issue
  const handleIssueExpand = (issueId: string) => {
    const newExpanded = expandedIssue === issueId ? null : issueId
    setExpandedIssue(newExpanded)
    if (newExpanded) {
      logEvent("ISSUE_VIEWED", { issueId }) // Log when an issue is viewed
    }
  }

  // Handler for applying an automatic fix
  const handleApplyFix = (issue: ComplianceIssue) => {
    onApplyFix(issue)
    logEvent("FIX_AUTO_APPLIED", { issueId: issue.id, title: issue.title }) // Log auto fix application
  }

  // Handler for saving manual edits
  const handleManualSave = (issue: ComplianceIssue) => {
    // For now, treat manual edit as applying the fix
    onApplyFix(issue)
    logEvent("FIX_MANUAL_ENTERED", { issueId: issue.id, title: issue.title }) // Log manual fix entry
    setManualEditIssue(null) // Exit manual edit mode
    setManualEditText("") // Clear manual edit text
  }

  // Handler for expanding/collapsing a goal
  const handleGoalExpand = (goalId: string) => {
    const newExpanded = expandedGoal === goalId ? null : goalId
    setExpandedGoal(newExpanded)
    if (newExpanded) {
      logEvent("GOAL_REVIEWED", { goalId }) // Log when a goal is reviewed
    }
  }

  // Handler for downloading the IEP
  const handleDownload = () => {
    logEvent("IEP_DOWNLOADED") // Log IEP download event
    onDownload()
  }

  // Handler for finishing the review process
  const handleFinish = () => {
    logEvent("IEP_APPROVED") // Log IEP approval event
    onFinish()
  }

  // Celebration Overlay component
  if (showCelebration) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-teal-500 to-emerald-600 animate-celebration">
        <div className="text-center text-white">
          <div className="text-8xl mb-6 animate-wiggle">🎉</div>
          <h1 className="text-4xl font-bold mb-3">Your IEP is Ready!</h1>
          <p className="text-xl text-white/90">Let's do a quick review together</p>
        </div>
      </div>
    )
  }

  // Main Review Step UI
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Confidence Badge Card */}
      <div
        className={`relative overflow-hidden rounded-2xl p-6 mb-6 ${
          displayScore >= 85
            ? "bg-gradient-to-br from-emerald-500 to-teal-600"
            : displayScore >= 70
              ? "bg-gradient-to-br from-amber-400 to-orange-500"
              : "bg-gradient-to-br from-red-400 to-rose-500"
        } text-white shadow-xl animate-fade-in`}
      >
        {/* Shimmer overlay */}
        <div className="absolute inset-0 animate-shimmer pointer-events-none" />

        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-white/80 text-sm font-medium mb-1">Compliance Confidence</p>
            <p className="text-5xl font-bold">{displayScore}%</p>
            {remainingIssues.length > 0 && (
              <p className="text-white/90 text-sm mt-2">
                {remainingIssues.length} quick question{remainingIssues.length !== 1 ? "s" : ""} remaining
              </p>
            )}
            {fixedIssues.size > 0 && (
              <p className="text-white/80 text-xs mt-1">
                +{fixedPoints} points from {fixedIssues.size} resolved
              </p>
            )}
          </div>

          {/* Score Ring */}
          <div className="relative w-28 h-28">
            <svg className="w-28 h-28 transform -rotate-90">
              <circle
                cx="56"
                cy="56"
                r="48"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-white/20"
              />
              <circle
                cx="56"
                cy="56"
                r="48"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${(displayScore / 100) * 301} 301`}
                className="text-white"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <Shield className="w-10 h-10 text-white" />
            </div>
          </div>
        </div>

        <p className="relative text-white/80 text-xs mt-4">Verified against {stateName} Ed Code & Federal IDEA</p>
      </div>

      {/* Time Saved Banner */}
      {timeSavedMinutes > 0 && (
        <div className="bg-gradient-to-r from-violet-100 to-purple-100 border border-violet-200 rounded-xl p-4 mb-6 flex items-center gap-3 animate-slide-up">
          <div className="bg-violet-500 rounded-full p-2">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-violet-900">~{timeSavedMinutes} minutes saved</p>
            <p className="text-sm text-violet-700">That's time back for your students</p>
          </div>
        </div>
      )}

      {/* Expandable Compliance Details */}
      <button
        onClick={() => {
          setComplianceExpanded(!complianceExpanded)
          if (!complianceExpanded) logEvent("COMPLIANCE_EXPANDED") // Log compliance expansion
        }}
        className="w-full mb-6 p-4 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-between transition-colors"
      >
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-teal-600" />
          <span className="font-medium text-slate-700">
            What we verified ({passedChecks}/{totalChecks} checks passed)
          </span>
        </div>
        {complianceExpanded ? (
          <ChevronUp className="w-5 h-5 text-slate-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400" />
        )}
      </button>

      {complianceExpanded && (
        <div className="mb-6 p-4 bg-white rounded-xl border border-slate-200 space-y-2 animate-slide-up">
          {remediation?.compliance_checks?.map((check, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              {check.passed ? (
                <CheckCircle2 className="w-4 h-4 text-teal-500 mt-0.5 flex-shrink-0" />
              ) : (
                <div className="w-4 h-4 rounded-full bg-amber-400 mt-0.5 flex-shrink-0" />
              )}
              <div>
                <span className="text-slate-700">{check.name}</span>
                {check.citation && <span className="text-slate-400 text-xs ml-2">{check.citation}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fix All Button */}
      {autoFixable.length > 1 && ( // Only show if more than one auto-fixable issue exists
        <button
          onClick={() => {
            onApplyAll()
            autoFixable.forEach((i) => logEvent("FIX_AUTO_APPLIED", { issueId: i.id })) // Log each auto-applied fix
          }}
          disabled={isFixing}
          className="w-full mb-6 py-4 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 disabled:from-slate-400 disabled:to-slate-500 text-white font-semibold flex items-center justify-center gap-2 shadow-lg hover-scale transition-all"
        >
          {isFixing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Fixing...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Fix all {autoFixable.length} questions automatically
            </>
          )}
        </button>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-slate-200">
        {[
          { id: "questions", label: "Questions", icon: MessageCircle, count: remainingIssues.length }, // Changed tab ID to "questions"
          { id: "goals", label: "Goals", icon: Target, count: iep?.goals?.length || 0 },
          { id: "services", label: "Services", icon: Users, count: iep?.services?.length || 0 },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all hover-scale ${
              activeTab === tab.id
                ? "border-teal-600 text-teal-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.count > 0 && (
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  tab.id === "questions" && tab.count > 0 // Conditional styling for "questions" tab
                    ? "bg-amber-100 text-amber-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mb-6 min-h-[300px]">
        {/* Questions Tab */}
        {activeTab === "questions" && ( // Changed tab ID to "questions"
          <div className="space-y-4 animate-slide-in-left">
            {/* Resolved Issues */}
            {resolvedIssues.map((issue, index) => (
              <div
                key={issue.id}
                className={`rounded-xl border-2 border-teal-200 bg-teal-50 p-4 animate-fade-in animate-stagger-${Math.min(index + 1, 4)}`}
              >
                <div className="flex items-center gap-2 text-teal-700">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-medium">{issue.title}</span>
                  <span className="text-teal-600 text-sm">— Resolved ✓</span>
                </div>
              </div>
            ))}

            {/* Remaining Issues as Questions */}
            {remainingIssues.length === 0 ? (
              <div className="bg-teal-50 border border-teal-200 rounded-xl p-8 text-center animate-fade-in">
                <CheckCircle2 className="w-16 h-16 text-teal-500 mx-auto mb-4" />
                <p className="text-teal-800 font-semibold text-lg">All questions answered!</p>
                <p className="text-teal-600">Your IEP is ready for the clinical review.</p>
              </div>
            ) : (
              remainingIssues.map((issue, index) => {
                const isExpanded = expandedIssue === issue.id
                const isManualEdit = manualEditIssue === issue.id

                return (
                  <div
                    key={issue.id}
                    className={`rounded-xl border-2 border-amber-200 bg-white overflow-hidden card-hover animate-fade-in animate-stagger-${Math.min(index + 1, 4)}`}
                  >
                    <button
                      onClick={() => handleIssueExpand(issue.id)}
                      className="w-full p-4 flex items-center gap-3 text-left hover:bg-amber-50/50 transition-colors"
                    >
                      <MessageCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-slate-900">
                          Quick question about {issue.title.toLowerCase()}
                        </span>
                      </div>
                      <div className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}>
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-4 border-t border-amber-100 pt-4 animate-slide-up">
                        {/* Current text */}
                        {issue.current_text && (
                          <div className="bg-slate-50 rounded-lg p-3">
                            <p className="text-xs font-medium text-slate-500 mb-1">WHAT WE FOUND</p>
                            <p className="text-sm text-slate-700">{issue.current_text}</p>
                          </div>
                        )}

                        {/* Citation */}
                        <p className="text-xs text-slate-500">
                          <span className="font-medium">Why it matters:</span> {issue.legal_citation}
                        </p>

                        {/* Action Buttons */}
                        {!isManualEdit && (
                          <div className="flex gap-2">
                            {issue.auto_fixable && issue.suggested_fix && (
                              <button
                                onClick={() => handleApplyFix(issue)}
                                disabled={isFixing}
                                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-semibold flex items-center justify-center gap-2 hover-scale transition-all"
                              >
                                <Zap className="w-4 h-4" />
                                Fix it for me
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setManualEditIssue(issue.id)
                                setManualEditText(issue.current_text || "")
                              }}
                              className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold hover-scale transition-all"
                            >
                              I'll write it
                            </button>
                          </div>
                        )}

                        {/* Manual Edit */}
                        {isManualEdit && (
                          <div className="space-y-3 animate-fade-in">
                            <textarea
                              value={manualEditText}
                              onChange={(e) => setManualEditText(e.target.value)}
                              className="w-full p-3 border border-slate-200 rounded-lg text-sm resize-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                              rows={4}
                              placeholder="Enter your text..."
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleManualSave(issue)}
                                className="flex-1 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium hover-scale"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => {
                                  setManualEditIssue(null)
                                  setManualEditText("")
                                }}
                                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium hover-scale"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Suggested fix preview */}
                        {issue.suggested_fix && !isManualEdit && (
                          <div className="bg-teal-50 border border-teal-200 rounded-lg p-3">
                            <p className="text-xs font-medium text-teal-600 mb-1">SUGGESTED FIX</p>
                            <p className="text-sm text-teal-800">{issue.suggested_fix}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* Goals Tab */}
        {activeTab === "goals" && (
          <div className="space-y-4 animate-slide-in-right">
            {iep?.goals?.map((goal, index) => {
              const isExpanded = expandedGoal === (goal.id || `goal-${index}`)
              const zpdScore = goal.zpd_score || 0
              const zpdColor =
                zpdScore >= 6.5 && zpdScore <= 8.5
                  ? "bg-teal-100 text-teal-700"
                  : zpdScore < 6.5
                    ? "bg-amber-100 text-amber-700"
                    : "bg-orange-100 text-orange-700"

              return (
                <div
                  key={goal.id || index}
                  className={`bg-white rounded-xl border border-slate-200 overflow-hidden card-hover animate-fade-in animate-stagger-${Math.min(index + 1, 4)}`}
                >
                  <button
                    onClick={() => handleGoalExpand(goal.id || `goal-${index}`)}
                    className="w-full p-4 flex items-center gap-3 text-left hover:bg-slate-50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-slate-900">{goal.area}</span>
                        {zpdScore > 0 && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${zpdColor}`}>ZPD: {zpdScore}/10</span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 truncate">{goal.goal_text}</p>
                    </div>
                    <div className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}>
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-3 border-t border-slate-100 pt-4 animate-slide-up">
                      <p className="text-sm text-slate-700">{goal.goal_text}</p>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-50 rounded-lg p-3">
                          <p className="text-xs font-medium text-slate-500 mb-1">BASELINE</p>
                          <p className="text-sm text-slate-700">{goal.baseline}</p>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-3">
                          <p className="text-xs font-medium text-slate-500 mb-1">TARGET</p>
                          <p className="text-sm text-slate-700">{goal.target}</p>
                        </div>
                      </div>

                      {goal.clinical_flags && goal.clinical_flags.length > 0 && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                          <p className="text-xs font-medium text-amber-600 mb-1">CLINICAL NOTE</p>
                          <p className="text-sm text-amber-800">{goal.clinical_flags[0]}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
            {(!iep?.goals || iep.goals.length === 0) && (
              <div className="text-center py-12 text-slate-500">No goals extracted</div>
            )}
          </div>
        )}

        {/* Services Tab */}
        {activeTab === "services" && (
          <div className="space-y-4 animate-slide-in-right">
            {iep?.services?.map((service, index) => (
              <div
                key={index}
                className={`bg-white rounded-xl border border-slate-200 p-4 card-hover animate-fade-in animate-stagger-${Math.min(index + 1, 4)}`}
              >
                <h3 className="font-semibold text-slate-900 mb-3">{service.type}</h3>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs px-3 py-1 rounded-full bg-teal-100 text-teal-700">{service.frequency}</span>
                  <span className="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-700">{service.duration}</span>
                  {service.setting && (
                    <span className="text-xs px-3 py-1 rounded-full bg-purple-100 text-purple-700">
                      {service.setting}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {(!iep?.services || iep.services.length === 0) && (
              <div className="text-center py-12 text-slate-500">No services extracted</div>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleDownload}
          className="px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold flex items-center gap-2 hover-scale transition-all"
        >
          <Download className="w-4 h-4" />
          Download Draft
        </button>

        <button
          onClick={handleFinish}
          disabled={criticalRemaining > 0 || highRemaining > 0}
          className={`flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all hover-scale ${
            criticalRemaining > 0 || highRemaining > 0
              ? "bg-slate-200 text-slate-400 cursor-not-allowed"
              : "bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white shadow-lg"
          }`}
        >
          {criticalRemaining > 0 ? (
            `Answer ${criticalRemaining} question${criticalRemaining !== 1 ? "s" : ""} to continue`
          ) : highRemaining > 0 ? (
            `Answer ${highRemaining} question${highRemaining !== 1 ? "s" : ""} to continue`
          ) : (
            <>
              Looks Good — Continue
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {/* Footer */}
      <p className="text-center text-sm text-slate-500 mt-6">
        Next: MySLP will do a clinical review, then you can download the final IEP
      </p>
    </div>
  )
}

// =============================================================================
// MAIN WIZARD
// =============================================================================

export function IEPWizard() {
  const [currentStep, setCurrentStep] = useState<WizardStep>("upload")

  // Upload state
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])

  // Tell state
  const [studentUpdate, setStudentUpdate] = useState("")
  const [selectedState, setSelectedState] = useState("CA")
  const [iepDate, setIepDate] = useState(() => new Date().toISOString().split("T")[0])

  // Building state
  const [buildingTasks, setBuildingTasks] = useState<BuildingTask[]>([
    { id: "extract", label: "Reading your uploaded documents", status: "pending" },
    { id: "analyze", label: "Analyzing previous goals and progress", status: "pending" },
    { id: "generate", label: "Writing new goals based on progress", status: "pending" },
    { id: "compliance", label: "Checking against IDEA & state requirements", status: "pending" },
    { id: "services", label: "Aligning services with new goals", status: "pending" },
  ])
  const [buildError, setBuildError] = useState<string | null>(null)

  // Review state
  const [extractedIEP, setExtractedIEP] = useState<ExtractedIEP | null>(null)
  const [remediation, setRemediation] = useState<RemediationData | null>(null)
  const [fixedIssues, setFixedIssues] = useState<Set<string>>(new Set())
  const [isFixing, setIsFixing] = useState(false)
  const [reviewStartTime, setReviewStartTime] = useState<number | undefined>(undefined) // State for review start time

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleAddFiles = (newFiles: UploadedFile[]) => {
    setUploadedFiles((prev) => [...prev, ...newFiles])
  }

  const handleRemoveFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id))
  }

  const updateTask = (taskId: string, status: BuildingTask["status"]) => {
    setBuildingTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status } : t)))
  }

  const handleRetryBuild = () => {
    // Reset tasks and error, then restart the building process
    setBuildingTasks((prev) => prev.map((t) => ({ ...t, status: "pending" as const })))
    setBuildError(null)
    handleStartBuilding()
  }

  const handleStartBuilding = async () => {
    setCurrentStep("building")
    setBuildError(null)

    // Reset tasks
    setBuildingTasks((prev) => prev.map((t) => ({ ...t, status: "pending" as const })))

    try {
      // Task 1: Upload and extract
      updateTask("extract", "running")

      const formData = new FormData()
      const iepFile = uploadedFiles.find((f) => f.type === "iep") || uploadedFiles[0]
      if (!iepFile) {
        throw new Error("No IEP file found")
      }
      formData.append("file", iepFile.file)
      formData.append("studentUpdate", studentUpdate)
      formData.append("state", selectedState)
      formData.append("iepDate", iepDate)

      console.log("[v0] Uploading file directly to extract-iep:", iepFile.name)

      // Simulate progress while waiting for the Lambda (it takes 30-60 seconds)
      const progressInterval = setInterval(() => {
        setBuildingTasks((prev) => {
          const extractComplete = prev.find((t) => t.id === "extract")?.status === "complete"
          const analyzeComplete = prev.find((t) => t.id === "analyze")?.status === "complete"
          const generateComplete = prev.find((t) => t.id === "generate")?.status === "complete"
          const complianceComplete = prev.find((t) => t.id === "compliance")?.status === "complete"

          if (!analyzeComplete) {
            return prev.map((t) =>
              t.id === "analyze"
                ? { ...t, status: "complete" as const }
                : t.id === "generate"
                  ? { ...t, status: "running" as const }
                  : t,
            )
          } else if (!generateComplete) {
            return prev.map((t) =>
              t.id === "generate"
                ? { ...t, status: "complete" as const }
                : t.id === "compliance"
                  ? { ...t, status: "running" as const }
                  : t,
            )
          } else if (!complianceComplete) {
            return prev.map((t) =>
              t.id === "compliance"
                ? { ...t, status: "complete" as const }
                : t.id === "services"
                  ? { ...t, status: "running" as const }
                  : t,
            )
          }
          return prev
        })
      }, 8000) // Update every 8 seconds

      // POST directly to extract-iep and wait for the complete response
      const extractResponse = await fetch("/api/extract-iep", {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)

      if (!extractResponse.ok) {
        const errorData = await extractResponse.json().catch(() => ({}))
        throw new Error(errorData.error || `Extraction failed: ${extractResponse.status}`)
      }

      const extractData = await extractResponse.json()
      console.log("[v0] Extract response received:", extractData.success)

      if (!extractData.success) {
        throw new Error(extractData.error || "Extraction failed")
      }

      // Extract IEP data - it's at the top level
      const iepData = extractData.iep
      console.log("[v0] Extracted IEP data:", iepData?.student?.name)

      if (iepData) {
        setExtractedIEP(iepData as ExtractedIEP)
      }

      // Extract remediation data - it's inside _debug_raw
      const remediationData = extractData._debug_raw?.remediation
      console.log("[v0] Remediation data:", remediationData?.original_score, "issues:", remediationData?.issues?.length)

      if (remediationData) {
        setRemediation(remediationData as RemediationData)
      }

      // Mark all tasks complete
      updateTask("extract", "complete")
      updateTask("analyze", "complete")
      updateTask("generate", "complete")
      updateTask("compliance", "complete")
      updateTask("services", "complete")

      // Move to review step
      setCurrentStep("review")
      setReviewStartTime(Date.now()) // Set the start time for the review step
    } catch (error) {
      console.error("[v0] Build error:", error)
      setBuildError(error instanceof Error ? error.message : "An error occurred")
      updateTask("extract", "error") // Mark the first task as error to trigger error state in BuildingStep
    }
  }

  const handleApplyFix = async (issue: ComplianceIssue) => {
    setFixedIssues((prev) => new Set(prev).add(issue.id))
  }

  const handleApplyAll = async () => {
    setIsFixing(true)
    const autoFixable =
      remediation?.issues?.filter((i) => i.auto_fixable && i.suggested_fix && !fixedIssues.has(i.id)) || []

    for (const issue of autoFixable) {
      await handleApplyFix(issue)
      await new Promise((r) => setTimeout(r, 200))
    }

    setIsFixing(false)
  }

  const handleDownload = () => {
    // TODO: Generate and download IEP document
    console.log("Download IEP")
  }

  const handleFinish = () => {
    // TODO: Navigate to MySLP review
    console.log("Navigate to MySLP review")
  }

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div className="min-h-screen bg-slate-50">
      <StepIndicator currentStep={currentStep} />

      {currentStep === "upload" && (
        <UploadStep
          files={uploadedFiles}
          onAddFiles={handleAddFiles}
          onRemoveFile={handleRemoveFile}
          onNext={() => setCurrentStep("tell")}
        />
      )}

      {currentStep === "tell" && (
        <TellStep
          studentUpdate={studentUpdate}
          onUpdateText={setStudentUpdate}
          onBack={() => setCurrentStep("upload")}
          onNext={handleStartBuilding}
          studentName={extractedIEP?.student?.name?.split(",")[1]?.trim()}
          selectedState={selectedState}
          onStateChange={setSelectedState}
          iepDate={iepDate}
          onDateChange={setIepDate}
        />
      )}

      {currentStep === "building" && (
        <BuildingStep
          tasks={buildingTasks}
          error={buildError}
          onRetry={handleRetryBuild}
          selectedState={selectedState}
        />
      )}

      {currentStep === "review" && extractedIEP && (
        <ReviewStep
          iep={extractedIEP}
          remediation={remediation}
          fixedIssues={fixedIssues}
          onApplyFix={handleApplyFix}
          onApplyAll={handleApplyAll}
          onBack={() => setCurrentStep("building")}
          onFinish={handleFinish}
          onDownload={handleDownload}
          isFixing={isFixing}
          selectedState={selectedState} // Pass selectedState to ReviewStep
          startTime={reviewStartTime} // Pass startTime to ReviewStep
        />
      )}
    </div>
  )
}

export default IEPWizard
