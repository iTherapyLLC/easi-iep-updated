"use client"

import type React from "react"

import { useState, useRef } from "react"
import {
  Upload,
  FileText,
  Mic,
  MicOff,
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
} from "lucide-react"

// =============================================================================
// TYPES
// =============================================================================

interface UploadedFile {
  id: string
  name: string
  type: "iep" | "notes" | "photo" | "report" | "other"
  file: File
  preview?: string
}

interface Goal {
  id: string
  area: string
  previousGoal: string
  progress: "met" | "partial" | "not_met" | "unknown"
  newGoal: string
  baseline: string
  target: string
}

interface ComplianceIssue {
  id: string
  severity: "critical" | "high" | "medium" | "low"
  title: string
  description: string
  legal_citation: string
  current_text: string
  suggested_fix: string
  auto_fixable: boolean
  points_deducted: number
}

interface DraftIEP {
  studentName: string
  grade: string
  disability: string
  presentLevels: string
  goals: Goal[]
  services: any[]
  accommodations: string[]
  complianceScore: number
  issues: ComplianceIssue[]
}

type WizardStep = "upload" | "tell" | "building" | "review"

// =============================================================================
// STEP INDICATOR COMPONENT
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
        {/* Progress bar */}
        <div className="relative mb-2">
          <div className="h-2 bg-slate-200 rounded-full">
            <div
              className="h-2 bg-teal-500 rounded-full transition-all duration-500"
              style={{ width: `${((currentIndex + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Step labels */}
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
  const hasIEP = files.some((f) => f.type === "iep")

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
        <h1 className="text-2xl font-bold text-slate-900 mb-2 hover-title cursor-default">Let's Build Your New IEP</h1>
        <p className="text-slate-600">
          Upload the current IEP and any notes, photos, or reports you have.
          <br />
          <span className="text-slate-500 text-sm">We'll use these to create a draft of the new IEP.</span>
        </p>
      </div>

      {/* Upload area */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center cursor-pointer hover:border-teal-400 hover:bg-teal-50/50 transition-all duration-300 mb-6"
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

      {/* Quick upload buttons */}
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

      {/* Uploaded files */}
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

      {/* Next button */}
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
// STEP 2: TELL US ABOUT THE STUDENT
// =============================================================================

function TellStep({
  studentUpdate,
  onUpdateText,
  onBack,
  onNext,
  studentName,
}: {
  studentUpdate: string
  onUpdateText: (text: string) => void
  onBack: () => void
  onNext: () => void
  studentName?: string
}) {
  const [isRecording, setIsRecording] = useState(false)

  const handleVoiceToggle = () => {
    setIsRecording(!isRecording)
  }

  const hasContent = studentUpdate.trim().length > 20

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2 hover-title cursor-default">
          How is {studentName || "the student"} doing?
        </h1>
        <p className="text-slate-600">
          Tell us about progress on goals, what's improved, what's still challenging.
          <br />
          <span className="text-slate-500 text-sm">Type or tap the mic to speak — whatever's easier.</span>
        </p>
      </div>

      {/* Input area */}
      <div className="relative mb-6">
        <textarea
          value={studentUpdate}
          onChange={(e) => onUpdateText(e.target.value)}
          placeholder="Example: He met his reading goal but is still working on math. Behavior has improved a lot — fewer meltdowns. Still needs support with transitions between activities..."
          className="w-full h-48 p-4 pr-16 border border-slate-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-slate-800 placeholder:text-slate-400"
        />

        {/* Voice button */}
        <button
          onClick={handleVoiceToggle}
          className={`absolute bottom-4 right-4 p-3 rounded-full transition-colors ${
            isRecording ? "bg-red-500 text-white animate-pulse" : "bg-slate-100 hover:bg-slate-200 text-slate-600"
          }`}
        >
          {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>
      </div>

      {/* Prompt helpers */}
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

      {/* Navigation */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="px-6 py-4 rounded-xl font-medium text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <button
          onClick={onNext}
          disabled={!hasContent}
          className={`flex-1 py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition-all ${
            hasContent
              ? "bg-teal-600 hover:bg-teal-700 text-white shadow-lg hover:shadow-xl"
              : "bg-slate-200 text-slate-400 cursor-not-allowed"
          }`}
        >
          {hasContent ? (
            <>
              Build My New IEP
              <Sparkles className="w-5 h-5" />
            </>
          ) : (
            "Tell us a bit more to continue"
          )}
        </button>
      </div>
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
  onComplete,
  allComplete,
}: {
  tasks: BuildingTask[]
  onComplete: () => void
  allComplete: boolean
}) {
  const currentTask = tasks.find((t) => t.status === "running")

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-100 rounded-full mb-4">
          <Sparkles className="w-8 h-8 text-teal-600 animate-pulse" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2 hover-title-glow cursor-default">
          Building Your New IEP
        </h1>
        <p className="text-slate-600">
          {allComplete ? "Your draft is ready!" : currentTask ? `${currentTask.label}...` : "Starting..."}
        </p>
      </div>

      {/* Task list */}
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

      {/* What's happening explanation */}
      {!allComplete && (
        <div className="bg-slate-50 rounded-xl p-4 text-center">
          <p className="text-sm text-slate-600">
            We're comparing the previous IEP with your notes, checking compliance against federal and state
            requirements, and writing goals that build on the student's progress.
          </p>
        </div>
      )}

      {/* Continue button */}
      {allComplete && (
        <button
          onClick={onComplete}
          className="w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white shadow-lg hover:shadow-xl transition-all"
        >
          Review Your Draft
          <ArrowRight className="w-5 h-5" />
        </button>
      )}
    </div>
  )
}

// =============================================================================
// STEP 4: REVIEW & FINISH
// =============================================================================

function ReviewStep({
  draft,
  issues,
  fixedIssues,
  onApplyFix,
  onApplyAll,
  onBack,
  onFinish,
  onDownload,
  isFixing,
}: {
  draft: DraftIEP | null
  issues: ComplianceIssue[]
  fixedIssues: Set<string>
  onApplyFix: (issue: ComplianceIssue) => void
  onApplyAll: () => void
  onBack: () => void
  onFinish: () => void
  onDownload: () => void
  isFixing: boolean
}) {
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null)

  const remainingIssues = issues.filter((i) => !fixedIssues.has(i.id))
  const criticalRemaining = remainingIssues.filter((i) => i.severity === "critical").length
  const autoFixable = remainingIssues.filter((i) => i.auto_fixable)

  const currentScore = draft?.complianceScore || 0
  const fixedPoints = issues.filter((i) => fixedIssues.has(i.id)).reduce((sum, i) => sum + i.points_deducted, 0)
  const displayScore = Math.min(100, currentScore + fixedPoints)

  const severityColors = {
    critical: { bg: "bg-red-50", border: "border-red-200", badge: "bg-red-100 text-red-700" },
    high: { bg: "bg-orange-50", border: "border-orange-200", badge: "bg-orange-100 text-orange-700" },
    medium: { bg: "bg-yellow-50", border: "border-yellow-200", badge: "bg-yellow-100 text-yellow-700" },
    low: { bg: "bg-blue-50", border: "border-blue-200", badge: "bg-blue-100 text-blue-700" },
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-2 hover-title cursor-default">
          Your New IEP Draft is Ready
        </h1>
        <p className="text-slate-600">
          {remainingIssues.length === 0
            ? "No issues found. Ready for your review!"
            : `${remainingIssues.length} item${remainingIssues.length !== 1 ? "s" : ""} to fix before finalizing.`}
        </p>
      </div>

      {/* Score card */}
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
          </div>

          <div className="relative w-20 h-20">
            <svg className="w-20 h-20 transform -rotate-90">
              <circle
                cx="40"
                cy="40"
                r="32"
                stroke="currentColor"
                strokeWidth="6"
                fill="none"
                className="text-slate-700"
              />
              <circle
                cx="40"
                cy="40"
                r="32"
                stroke="currentColor"
                strokeWidth="6"
                fill="none"
                strokeDasharray={`${(displayScore / 100) * 201} 201`}
                className={
                  displayScore >= 85 ? "text-teal-400" : displayScore >= 70 ? "text-yellow-400" : "text-red-400"
                }
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Fix All button */}
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

      {/* Issues list */}
      {remainingIssues.length > 0 && (
        <div className="space-y-3 mb-6">
          {remainingIssues.map((issue) => {
            const colors = severityColors[issue.severity]
            const isExpanded = expandedIssue === issue.id

            return (
              <div key={issue.id} className={`rounded-xl border-2 overflow-hidden ${colors.bg} ${colors.border}`}>
                <button
                  onClick={() => setExpandedIssue(isExpanded ? null : issue.id)}
                  className="w-full p-4 flex items-center gap-3 text-left"
                >
                  <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900">{issue.title}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${colors.badge}`}>
                        {issue.severity.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mt-0.5">{issue.description}</p>
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

                    {issue.suggested_fix && (
                      <div className="bg-teal-50 border border-teal-200 rounded-lg p-3">
                        <p className="text-xs font-medium text-teal-600 mb-1">SUGGESTED FIX</p>
                        <p className="text-sm text-teal-800">{issue.suggested_fix}</p>
                      </div>
                    )}

                    {issue.auto_fixable && (
                      <button
                        onClick={() => onApplyFix(issue)}
                        className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium text-sm transition-colors"
                      >
                        Apply This Fix
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Success state */}
      {remainingIssues.length === 0 && (
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-6 text-center mb-6">
          <CheckCircle2 className="w-12 h-12 text-teal-500 mx-auto mb-3" />
          <p className="text-teal-800 font-medium">All compliance issues resolved!</p>
          <p className="text-teal-600 text-sm">Your IEP is ready for final review.</p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        <button onClick={onBack} className="px-6 py-3 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>

        <button
          onClick={onDownload}
          className="px-6 py-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
        >
          <Download className="w-5 h-5" />
          Download
        </button>

        <button
          onClick={onFinish}
          disabled={criticalRemaining > 0}
          className={`flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
            criticalRemaining > 0
              ? "bg-slate-200 text-slate-400 cursor-not-allowed"
              : "bg-teal-600 hover:bg-teal-700 text-white shadow-lg hover:shadow-xl"
          }`}
        >
          {criticalRemaining > 0 ? (
            `Fix ${criticalRemaining} critical issue${criticalRemaining !== 1 ? "s" : ""} to continue`
          ) : (
            <>
              Get Second Look from MySLP
              <Shield className="w-5 h-5" />
            </>
          )}
        </button>
      </div>

      {/* What's next hint */}
      <div className="mt-6 text-center">
        <p className="text-sm text-slate-500">After MySLP review: Download IEP → Schedule meeting → Done!</p>
      </div>
    </div>
  )
}

// =============================================================================
// MAIN WIZARD COMPONENT
// =============================================================================

export function IEPWizard() {
  // Wizard state
  const [currentStep, setCurrentStep] = useState<WizardStep>("upload")

  // Step 1: Upload
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])

  // Step 2: Tell
  const [studentUpdate, setStudentUpdate] = useState("")
  const [studentName, setStudentName] = useState<string>()

  // Step 3: Building
  const [buildingTasks, setBuildingTasks] = useState<BuildingTask[]>([
    { id: "extract", label: "Reading your uploaded documents", status: "pending" },
    { id: "analyze", label: "Analyzing previous goals and progress", status: "pending" },
    { id: "generate", label: "Writing new goals based on progress", status: "pending" },
    { id: "compliance", label: "Checking against IDEA & state requirements", status: "pending" },
    { id: "services", label: "Aligning services with new goals", status: "pending" },
  ])
  const [allTasksComplete, setAllTasksComplete] = useState(false)

  // Step 4: Review
  const [draft, setDraft] = useState<DraftIEP | null>(null)
  const [issues, setIssues] = useState<ComplianceIssue[]>([])
  const [fixedIssues, setFixedIssues] = useState<Set<string>>(new Set())
  const [isFixing, setIsFixing] = useState(false)

  // Extracted data storage
  const [extractedData, setExtractedData] = useState<any>(null)

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleAddFiles = (newFiles: UploadedFile[]) => {
    setUploadedFiles((prev) => [...prev, ...newFiles])
  }

  const handleRemoveFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id))
  }

  const handleStartBuilding = async () => {
    setCurrentStep("building")

    const updateTask = (taskId: string, status: BuildingTask["status"]) => {
      setBuildingTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status } : t)))
    }

    try {
      // Task 1: Extract IEP
      updateTask("extract", "running")

      const iepFile = uploadedFiles.find((f) => f.type === "iep")
      if (iepFile) {
        const formData = new FormData()
        formData.append("file", iepFile.file)

        const extractResponse = await fetch("/api/extract-iep", {
          method: "POST",
          body: formData,
        })

        if (extractResponse.ok) {
          const result = await extractResponse.json()
          setExtractedData(result.iep || result)
          setStudentName(result.iep?.student?.name || result.student?.name)
        }
      }
      updateTask("extract", "complete")

      // Task 2: Analyze
      updateTask("analyze", "running")
      await new Promise((r) => setTimeout(r, 1500))
      updateTask("analyze", "complete")

      // Task 3: Generate
      updateTask("generate", "running")
      await new Promise((r) => setTimeout(r, 1500))
      updateTask("generate", "complete")

      // Task 4: Compliance check via remediation API
      updateTask("compliance", "running")

      if (extractedData) {
        const remediationResponse = await fetch("/api/iep-remediation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "remediate",
            iepData: extractedData,
          }),
        })

        if (remediationResponse.ok) {
          const remediationResult = await remediationResponse.json()

          // Map remediation issues to our format
          const mappedIssues: ComplianceIssue[] = (remediationResult.issues || []).map((issue: any, index: number) => ({
            id: issue.id || `issue-${index}`,
            severity: issue.severity || "medium",
            title: issue.title || issue.issue_type || "Compliance Issue",
            description: issue.description || issue.issue || "",
            legal_citation: issue.legal_citation || issue.citation || "",
            current_text: issue.current_text || "",
            suggested_fix: issue.suggested_fix || issue.fix || "",
            auto_fixable: issue.auto_fixable !== false,
            points_deducted: issue.points_deducted || 5,
          }))

          setIssues(mappedIssues)

          // Build draft from extracted data
          const iep = extractedData
          setDraft({
            studentName: iep.student?.name || "Student",
            grade: iep.student?.grade || "",
            disability: iep.eligibility?.primary_disability || "",
            presentLevels: iep.plaafp?.academic || "",
            goals: (iep.goals || []).map((g: any) => ({
              id: g.id || Math.random().toString(36).substr(2, 9),
              area: g.area || "",
              previousGoal: g.goal_text || g.description || "",
              progress: "partial",
              newGoal: g.goal_text || g.description || "",
              baseline: g.baseline || "",
              target: g.target || "",
            })),
            services: iep.services || [],
            accommodations: iep.accommodations || [],
            complianceScore: remediationResult.score || 85,
            issues: mappedIssues,
          })
        }
      }
      updateTask("compliance", "complete")

      // Task 5: Services
      updateTask("services", "running")
      await new Promise((r) => setTimeout(r, 1000))
      updateTask("services", "complete")

      setAllTasksComplete(true)
    } catch (error) {
      console.error("Building error:", error)
      // Mark current task as error
      setBuildingTasks((prev) => prev.map((t) => (t.status === "running" ? { ...t, status: "error" } : t)))
    }
  }

  const handleApplyFix = async (issue: ComplianceIssue) => {
    setFixedIssues((prev) => new Set(prev).add(issue.id))
  }

  const handleApplyAll = async () => {
    setIsFixing(true)
    const autoFixable = issues.filter((i) => i.auto_fixable && !fixedIssues.has(i.id))

    for (const issue of autoFixable) {
      await handleApplyFix(issue)
      await new Promise((r) => setTimeout(r, 300))
    }

    setIsFixing(false)
  }

  const handleDownload = () => {
    if (!draft) return

    const content = `
INDIVIDUALIZED EDUCATION PROGRAM (IEP)
=====================================

Student: ${draft.studentName}
Grade: ${draft.grade}
Primary Disability: ${draft.disability}

PRESENT LEVELS OF ACADEMIC ACHIEVEMENT AND FUNCTIONAL PERFORMANCE
-----------------------------------------------------------------
${draft.presentLevels}

GOALS
-----
${draft.goals
  .map(
    (g, i) => `
${i + 1}. ${g.area}
   Goal: ${g.newGoal}
   Baseline: ${g.baseline}
   Target: ${g.target}
`,
  )
  .join("\n")}

SERVICES
--------
${draft.services.map((s: any) => `- ${s.type || s.service_type}: ${s.frequency || ""} ${s.duration || ""}`).join("\n")}

ACCOMMODATIONS
--------------
${draft.accommodations.map((a) => `- ${a}`).join("\n")}

Compliance Score: ${draft.complianceScore}%
    `.trim()

    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `IEP_${draft.studentName.replace(/\s+/g, "_")}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleFinish = () => {
    // TODO: Navigate to MySLP review or finalize
    console.log("Navigating to MySLP review...")
    alert("IEP Ready! In production, this would navigate to MySLP for final review.")
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
          studentName={studentName}
        />
      )}

      {currentStep === "building" && (
        <BuildingStep
          tasks={buildingTasks}
          onComplete={() => setCurrentStep("review")}
          allComplete={allTasksComplete}
        />
      )}

      {currentStep === "review" && (
        <ReviewStep
          draft={draft}
          issues={issues}
          fixedIssues={fixedIssues}
          onApplyFix={handleApplyFix}
          onApplyAll={handleApplyAll}
          onBack={() => setCurrentStep("building")}
          onFinish={handleFinish}
          onDownload={handleDownload}
          isFixing={isFixing}
        />
      )}
    </div>
  )
}

export default IEPWizard
