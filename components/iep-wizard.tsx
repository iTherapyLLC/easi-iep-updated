"use client"

import type React from "react"

import { useState, useRef } from "react"
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
  BookOpen,
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
  selectedState, // Add selectedState prop here
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
  selectedState: string // Add selectedState prop type here
}) {
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"compliance" | "goals" | "services" | "overview">("compliance")

  const issues = remediation?.issues || []
  const remainingIssues = issues.filter((i) => !fixedIssues.has(i.id))
  const criticalRemaining = remainingIssues.filter((i) => i.severity === "critical").length
  const highRemaining = remainingIssues.filter((i) => i.severity === "high").length
  const autoFixable = remainingIssues.filter((i) => i.auto_fixable && i.suggested_fix)

  const originalScore = remediation?.original_score || 0
  const fixedPoints = issues.filter((i) => fixedIssues.has(i.id)).reduce((sum, i) => sum + i.points_deducted, 0)
  const displayScore = Math.min(100, originalScore + fixedPoints)

  const severityColors = {
    critical: { bg: "bg-red-50", border: "border-red-200", badge: "bg-red-100 text-red-700", icon: "text-red-500" },
    high: {
      bg: "bg-orange-50",
      border: "border-orange-200",
      badge: "bg-orange-100 text-orange-700",
      icon: "text-orange-500",
    },
    medium: {
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      badge: "bg-yellow-100 text-yellow-700",
      icon: "text-yellow-500",
    },
    low: { bg: "bg-blue-50", border: "border-blue-200", badge: "bg-blue-100 text-blue-700", icon: "text-blue-500" },
  }

  // Extract student name for display
  const studentName = iep?.student?.name?.split(",")[1]?.trim() || iep?.student?.name || "Student"
  const stateName = US_STATES.find((s) => s.code === selectedState)?.name || selectedState // Use selectedState here

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header with Student Info */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-2 hover-title cursor-default">Review Your IEP Draft</h1>
        <p className="text-slate-600">
          Checked against <span className="font-medium text-primary">{stateName}</span> regulations and federal IDEA
          requirements
        </p>
      </div>

      {/* Score Card */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm mb-1">Compliance Score</p>
            <p className="text-4xl font-bold">{displayScore}%</p>
            {fixedIssues.size > 0 && (
              <p className="text-teal-400 text-sm mt-1">
                +{fixedPoints} points from {fixedIssues.size} fix{fixedIssues.size !== 1 ? "es" : ""}
              </p>
            )}
            {remainingIssues.length > 0 && (
              <p className="text-slate-400 text-sm mt-1">
                {remainingIssues.length} issue{remainingIssues.length !== 1 ? "s" : ""} remaining
              </p>
            )}
          </div>

          <div className="relative w-24 h-24">
            <svg className="w-24 h-24 transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="6"
                fill="none"
                className="text-slate-700"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="6"
                fill="none"
                strokeDasharray={`${(displayScore / 100) * 251} 251`}
                className={
                  displayScore >= 85 ? "text-teal-400" : displayScore >= 70 ? "text-yellow-400" : "text-red-400"
                }
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <Shield
                className={`w-8 h-8 ${displayScore >= 85 ? "text-teal-400" : displayScore >= 70 ? "text-yellow-400" : "text-red-400"}`}
              />
            </div>
          </div>
        </div>

        {autoFixable.length > 0 && (
          <button
            onClick={onApplyAll}
            disabled={isFixing}
            className="w-full mt-4 py-3 rounded-xl bg-teal-500 hover:bg-teal-600 disabled:bg-slate-600 font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            {isFixing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Fixing...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Fix All {autoFixable.length} Issues Automatically
              </>
            )}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-slate-200">
        {[
          { id: "compliance", label: "Compliance", icon: Shield, count: remainingIssues.length },
          { id: "goals", label: "Goals", icon: Target, count: iep?.goals?.length || 0 },
          { id: "services", label: "Services", icon: Users, count: iep?.services?.length || 0 },
          { id: "overview", label: "Overview", icon: BookOpen },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
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
                    ? "bg-orange-100 text-orange-700"
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
      <div className="mb-6">
        {/* Compliance Tab */}
        {activeTab === "compliance" && (
          <div className="space-y-3">
            {remainingIssues.length === 0 ? (
              <div className="bg-teal-50 border border-teal-200 rounded-xl p-6 text-center">
                <CheckCircle2 className="w-12 h-12 text-teal-500 mx-auto mb-3" />
                <p className="text-teal-800 font-medium">All compliance issues resolved!</p>
                <p className="text-teal-600 text-sm">Your IEP is ready for final review.</p>
              </div>
            ) : (
              remainingIssues.map((issue) => {
                const colors = severityColors[issue.severity]
                const isExpanded = expandedIssue === issue.id

                return (
                  <div key={issue.id} className={`rounded-xl border-2 overflow-hidden ${colors.bg} ${colors.border}`}>
                    <button
                      onClick={() => setExpandedIssue(isExpanded ? null : issue.id)}
                      className="w-full p-4 flex items-center gap-3 text-left"
                    >
                      <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${colors.icon}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-slate-900">{issue.title}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${colors.badge}`}>
                            {issue.severity.toUpperCase()}
                          </span>
                          <span className="text-xs text-slate-500">-{issue.points_deducted} pts</span>
                        </div>
                        <p className="text-sm text-slate-600 mt-0.5 truncate">{issue.description}</p>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-3 border-t border-slate-200 pt-3">
                        <div className="bg-white/60 rounded-lg p-3">
                          <p className="text-xs font-medium text-slate-500 mb-1">LEGAL REQUIREMENT</p>
                          <p className="text-sm text-slate-700">{issue.legal_citation}</p>
                        </div>

                        {issue.current_text && (
                          <div className="bg-red-100/50 border border-red-200 rounded-lg p-3">
                            <p className="text-xs font-medium text-red-600 mb-1">CURRENT (NON-COMPLIANT)</p>
                            <p className="text-sm text-red-800">{issue.current_text}</p>
                          </div>
                        )}

                        {issue.suggested_fix && (
                          <div className="bg-teal-50 border border-teal-200 rounded-lg p-3">
                            <p className="text-xs font-medium text-teal-600 mb-1">SUGGESTED FIX</p>
                            <p className="text-sm text-teal-800">{issue.suggested_fix}</p>
                          </div>
                        )}

                        {issue.fix_explanation && (
                          <p className="text-xs text-slate-500 italic">{issue.fix_explanation}</p>
                        )}

                        {issue.auto_fixable && issue.suggested_fix ? (
                          <button
                            onClick={() => onApplyFix(issue)}
                            className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium text-sm transition-colors"
                          >
                            Apply This Fix
                          </button>
                        ) : (
                          <div className="text-xs text-amber-700 bg-amber-50 p-2 rounded-lg">
                            ⚠️ Requires manual review
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
          <div className="space-y-4">
            {iep?.goals?.map((goal, index) => (
              <div key={goal.id || index} className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-slate-900">
                    Goal {index + 1}: {goal.area}
                  </h3>
                  {goal.zpd_score && (
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        goal.zpd_score >= 7
                          ? "bg-teal-100 text-teal-700"
                          : goal.zpd_score >= 5
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                      }`}
                    >
                      ZPD: {goal.zpd_score}/10
                    </span>
                  )}
                </div>
                <p className="text-slate-700 text-sm mb-3">{goal.goal_text}</p>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-50 rounded-lg p-2">
                    <span className="text-slate-500 block mb-1">Baseline</span>
                    <span className="text-slate-700">{goal.baseline?.substring(0, 100)}...</span>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2">
                    <span className="text-slate-500 block mb-1">Target</span>
                    <span className="text-slate-700">{goal.target}</span>
                  </div>
                </div>
                {goal.clinical_flags?.length > 0 && (
                  <div className="mt-3 text-xs text-amber-700 bg-amber-50 p-2 rounded-lg">
                    ⚠️ {goal.clinical_flags[0]}
                  </div>
                )}
              </div>
            ))}
            {(!iep?.goals || iep.goals.length === 0) && (
              <div className="text-center py-8 text-slate-500">No goals extracted</div>
            )}
          </div>
        )}

        {/* Services Tab */}
        {activeTab === "services" && (
          <div className="space-y-4">
            {iep?.services?.map((service, index) => (
              <div key={index} className="bg-white rounded-xl border border-slate-200 p-4">
                <h3 className="font-semibold text-slate-900 mb-2">{service.type}</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-slate-500">Frequency:</span>
                    <span className="text-slate-700 ml-2">{service.frequency}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Duration:</span>
                    <span className="text-slate-700 ml-2">{service.duration}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Setting:</span>
                    <span className="text-slate-700 ml-2">{service.setting}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Provider:</span>
                    <span className="text-slate-700 ml-2">{service.provider}</span>
                  </div>
                </div>
              </div>
            ))}
            {(!iep?.services || iep.services.length === 0) && (
              <div className="text-center py-8 text-slate-500">No services extracted</div>
            )}
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-4">
            {/* Student Info */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="font-semibold text-slate-900 mb-3">Student Information</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-slate-500">Name:</span>{" "}
                  <span className="text-slate-700">{iep?.student?.name}</span>
                </div>
                <div>
                  <span className="text-slate-500">Age:</span>{" "}
                  <span className="text-slate-700">{iep?.student?.age}</span>
                </div>
                <div>
                  <span className="text-slate-500">Grade:</span>{" "}
                  <span className="text-slate-700">{iep?.student?.grade}</span>
                </div>
                <div>
                  <span className="text-slate-500">School:</span>{" "}
                  <span className="text-slate-700">{iep?.student?.school}</span>
                </div>
                <div>
                  <span className="text-slate-500">Primary Disability:</span>{" "}
                  <span className="text-slate-700">{iep?.eligibility?.primary_disability}</span>
                </div>
                <div>
                  <span className="text-slate-500">Secondary:</span>{" "}
                  <span className="text-slate-700">{iep?.eligibility?.secondary_disability || "None"}</span>
                </div>
              </div>
            </div>

            {/* Placement */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="font-semibold text-slate-900 mb-3">Placement (LRE)</h3>
              <p className="text-sm text-slate-700 mb-2">{iep?.placement?.setting}</p>
              <div className="flex gap-4 text-sm">
                <span className="text-teal-600">{iep?.placement?.percent_general_ed} General Ed</span>
                <span className="text-orange-600">{iep?.placement?.percent_special_ed} Special Ed</span>
              </div>
            </div>

            {/* Accommodations */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="font-semibold text-slate-900 mb-3">Accommodations ({iep?.accommodations?.length || 0})</h3>
              <div className="flex flex-wrap gap-2">
                {iep?.accommodations?.slice(0, 10).map((acc, i) => (
                  <span key={i} className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-full">
                    {acc}
                  </span>
                ))}
                {(iep?.accommodations?.length || 0) > 10 && (
                  <span className="text-xs text-slate-500">+{(iep?.accommodations?.length || 0) - 10} more</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1 bg-transparent">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Button variant="outline" onClick={onDownload} className="flex-1 bg-transparent">
          <Download className="w-4 h-4 mr-2" />
          Download
        </Button>

        <Button
          onClick={onFinish}
          disabled={criticalRemaining > 0 || highRemaining > 0}
          className={`flex-1 ${
            criticalRemaining > 0 || highRemaining > 0
              ? "bg-slate-200 text-slate-400 cursor-not-allowed border-slate-200"
              : "bg-teal-600 hover:bg-teal-700 text-white shadow-lg hover:shadow-xl"
          }`}
        >
          {criticalRemaining > 0 ? (
            `Fix ${criticalRemaining} critical issue${criticalRemaining !== 1 ? "s" : ""} to continue`
          ) : highRemaining > 0 ? (
            `Fix ${highRemaining} high priority issue${highRemaining !== 1 ? "s" : ""} to continue`
          ) : (
            <>
              Get Second Look from MySLP
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>

      <div className="mt-4 text-center">
        <p className="text-sm text-slate-500">After MySLP review: Download IEP → Schedule meeting → Done!</p>
      </div>
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
        />
      )}
    </div>
  )
}

export default IEPWizard
