"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import {
  Upload,
  FileText,
  Mic,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Camera,
  X,
  Loader2,
  MicOff,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useHashChainLogger } from "@/hooks/use-hash-chain-logger"
import { useVoice } from "@/hooks/use-voice" // Added useVoice hook import

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
  student?: {
    id?: string // Added optional ID
    name?: string
    dob?: string // Added dob
    date_of_birth?: string // Added date_of_birth
    age?: string
    grade?: string
    school?: string
    district?: string
  }
  eligibility?: {
    primary_disability?: string
    primaryDisability?: string // Added for flexibility
    secondary_disability?: string
    secondaryDisability?: string // Added for flexibility
  }
  plaafp?: {
    strengths?: string
    concerns?: string
    academic?: string
    functional?: string
  }
  goals?: Array<{
    id: string
    area?: string // Added optional area
    goal_area?: string // Added optional goal_area
    goal_text?: string // Added optional goal_text
    description?: string // Added optional description
    text?: string // Added optional text
    baseline?: string
    target?: string
    zpd_score?: number
    zpd_analysis?: string
    clinical_flags?: string[] // Renamed to clinical_flags for consistency
    clinical_notes?: string // Added for clinical notes
    measurement_method?: string // Added for measurement method
  }>
  services?: Array<{
    type?: string // Added optional type
    service_type?: string // Added for flexibility
    name?: string // Added for flexibility
    frequency?: string
    duration?: string
    provider?: string
    setting?: string
    location?: string // Added location
    minutes_per_week?: string // Added for minutes per week
  }>
  accommodations?: (string | { description?: string; name?: string; text?: string })[] // Updated to handle strings or objects
  placement?: {
    setting: string
    percent_general_ed: string
    percent_special_ed: string
    lre_justification: string
  }
}

interface RemediationData {
  score: number
  original_score?: number // Added for clarity
  issues: Array<{
    id: string
    title: string
    description: string
    severity: "critical" | "warning" | "suggestion"
    citation?: string
    suggested_fix?: string
    auto_fixable?: boolean
    points_deducted?: number // Added for clarity
  }>
  passed_count?: number
  total_checks?: number
  checks_passed?: Array<{ name: string; citation?: string }>
  checks_failed?: Array<{ name: string; citation?: string; issue_id?: string }>
  compliance_checks?: Array<{ name: string; passed: boolean; citation?: string }>
}

type WizardStep = "upload" | "tell" | "building" | "review" | "myslp"

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
  logEvent, // Added logEvent prop
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
  logEvent: (eventType: string, metadata?: Record<string, any>) => void // Added logEvent prop
}) {
  const hasContent = studentUpdate.trim().length > 20
  const stateName = US_STATES.find((s) => s.code === selectedState)?.name || selectedState

  const { isRecording, isSupported, toggleRecording } = useVoice({
    onTranscript: (text) => {
      onUpdateText(studentUpdate + (studentUpdate ? " " : "") + text)
      logEvent("VOICE_TRANSCRIPT_ADDED", { length: text.length })
    },
  })

  const handleMicClick = () => {
    toggleRecording()
    logEvent("MIC_TOGGLED", { isRecording: !isRecording })
  }

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
              onChange={(e) => {
                onStateChange(e.target.value)
                logEvent("STATE_CHANGED", { newState: e.target.value }) // Log state change
              }}
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
              onChange={(e) => {
                onDateChange(e.target.value)
                logEvent("DATE_CHANGED", { newDate: e.target.value }) // Log date change
              }}
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
            onClick={handleMicClick}
            disabled={!isSupported}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              isRecording
                ? "bg-red-100 text-red-700 animate-pulse"
                : isSupported
                  ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  : "bg-slate-50 text-slate-400 cursor-not-allowed"
            }`}
            title={!isSupported ? "Voice input not supported in this browser" : undefined}
          >
            {isRecording ? (
              <>
                <MicOff className="w-4 h-4" />
                <span className="flex items-center gap-2">
                  Stop Recording
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                </span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                Voice Input
              </>
            )}
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
              onClick={() => {
                onUpdateText(studentUpdate + (studentUpdate ? " " : "") + prompt + ". ")
                logEvent("PROMPT_ADDED", { prompt }) // Log prompt addition
              }}
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
  onComplete,
}: {
  tasks: BuildingTask[]
  error: string | null
  onRetry: () => void
  selectedState: string
  onComplete?: () => void
}) {
  const stateName = US_STATES.find((s) => s.code === selectedState)?.name || selectedState
  const allComplete = tasks.every((t) => t.status === "complete")
  const currentTask = tasks.find((t) => t.status === "running")

  useEffect(() => {
    if (allComplete && onComplete) {
      const timer = setTimeout(() => {
        onComplete()
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [allComplete, onComplete])

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <div className="w-20 h-20 mx-auto mb-4">
          <img src="/images/easi-iep-logo.webp" alt="EASI IEP" className="w-full h-full object-contain animate-pulse" />
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

      {allComplete && !error && (
        <div className="text-center mt-6 animate-fade-in">
          <p className="text-sm text-slate-500 mb-3">Advancing to review in a moment...</p>
          {onComplete && (
            <button
              onClick={onComplete}
              className="px-6 py-3 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 transition-colors"
            >
              Continue to Review
              <ArrowRight className="w-4 h-4 inline ml-2" />
            </button>
          )}
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
  | "TAB_CHANGED" // Added for tab changes
  | "FIX_MANUAL_STARTED" // Added for manual fix initiation
  | "FIX_ALL_APPLIED" // Added for fixing all issues at once
  | "FILE_UPLOADED" // Added for file upload logging
  | "FILE_REMOVED" // Added for file removal logging
  | "STATE_CHANGED" // Added for state change logging
  | "DATE_CHANGED" // Added for date change logging
  | "PROMPT_ADDED" // Added for prompt addition logging
  | "VOICE_TRANSCRIPT_ADDED" // Added for voice transcript logging
  | "MIC_TOGGLED" // Added for mic toggle logging
  | "BUILD_RETRY_REQUESTED" // Added for build retry logging
  | "EXTRACTION_STARTED" // Added for extraction start logging
  | "EXTRACTION_COMPLETED" // Added for extraction completed logging
  | "EXTRACTION_ERROR" // Added for extraction error logging
  | "REMEDIATION_COMPLETED" // Added for remediation completion logging
  | "BUILD_COMPLETED" // Added for build completion logging
  | "BUILDING_COMPLETED" // Added for building completion logging
  | "CLINICAL_REVIEW_STARTED" // Added for clinical review start
  | "CLINICAL_REVIEW_COMPLETED" // Added for clinical review completion
  | "CLINICAL_REVIEW_FALLBACK" // Added for clinical review fallback
  | "FINAL_IEP_DOWNLOADED" // Added for final IEP download
  | "COMPLIANCE_REPORT_DOWNLOADED" // Added for compliance report download
  | "NEW_IEP_STARTED_FROM_CLINICAL" // Added for starting a new IEP from clinical review
  | "FIX_INITIATED" // Added for initiating a fix
  | "AUTO_ADVANCED_TO_REVIEW" // Added for auto-advance log

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
  logEvent, // Added logEvent prop
  iepDate, // Added iepDate type
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
  logEvent: (eventType: string, metadata?: Record<string, any>) => void // Added logEvent prop
  iepDate: string // Added iepDate type
}) {
  const [showCelebration, setShowCelebration] = useState(true) // State for celebration animation
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>("compliance") // Added activeTab state

  // Additional code can be added here if needed

  return <div className="max-w-2xl mx-auto px-4 py-8">{/* Review step content */}</div>
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function IEPWizard() {
  const [currentStep, setCurrentStep] = useState<WizardStep>("upload")
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [studentUpdate, setStudentUpdate] = useState("")
  const [selectedState, setSelectedState] = useState("")
  const [iepDate, setIEPDate] = useState("")
  const [extractedIEP, setExtractedIEP] = useState<ExtractedIEP | null>(null)
  const [remediation, setRemediation] = useState<RemediationData | null>(null)
  const [fixedIssues, setFixedIssues] = useState(new Set<string>())
  const [isFixing, setIsFixing] = useState(false)
  const [reviewStartTime, setReviewStartTime] = useState<number | undefined>(undefined)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [buildError, setBuildError] = useState<string | null>(null)
  const [buildTasks, setBuildTasks] = useState([
    { id: "1", label: "Reading your uploaded documents", status: "pending" as const },
    { id: "2", label: "Analyzing previous goals and progress", status: "pending" as const },
    { id: "3", label: "Writing new goals based on progress", status: "pending" as const },
    { id: "4", label: "Checking against IDEA & state requirements", status: "pending" as const },
    { id: "5", label: "Aligning services with new goals", status: "pending" as const },
  ])
  const sessionId = "dummySessionId" // Dummy sessionId for illustration
  const { logEvent } = useHashChainLogger({ sessionId })

  const handleAddFiles = (newFiles: UploadedFile[]) => {
    setFiles((prevFiles) => [...prevFiles, ...newFiles])
  }

  const handleRemoveFile = (id: string) => {
    setFiles((prevFiles) => prevFiles.filter((file) => file.id !== id))
  }

  const handleStartBuilding = async () => {
    if (isSubmitting) {
      console.log("[v0] Already submitting, skipping duplicate call")
      return
    }

    if (files.length === 0) {
      setBuildError("Please upload at least one file")
      return
    }

    setIsSubmitting(true)
    setBuildError(null)
    setCurrentStep("building")

    // Reset tasks
    setBuildTasks((tasks) => tasks.map((t) => ({ ...t, status: "pending" as const })))

    logEvent("BUILD_STARTED", { fileCount: files.length, state: selectedState })

    try {
      // Update task 1: Reading documents
      setBuildTasks((tasks) => tasks.map((t) => (t.id === "1" ? { ...t, status: "running" as const } : t)))

      const formData = new FormData()
      // Get the actual file from the first uploaded file
      if (files[0]?.file) {
        formData.append("file", files[0].file)
      } else {
        throw new Error("No file data available")
      }
      formData.append("state", selectedState || "CA")
      formData.append("iepDate", iepDate || new Date().toISOString().split("T")[0])
      formData.append("userNotes", studentUpdate || "")

      console.log("[v0] Calling /api/extract-iep...")

      const response = await fetch("/api/extract-iep", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      console.log("[v0] Extract response keys:", Object.keys(data))
      console.log("[v0] Full response:", JSON.stringify(data).substring(0, 1000))

      if (!response.ok) {
        throw new Error(data.error || "Failed to extract IEP")
      }

      // Update tasks progressively
      setBuildTasks((tasks) => tasks.map((t) => (t.id === "1" ? { ...t, status: "complete" as const } : t)))
      setBuildTasks((tasks) => tasks.map((t) => (t.id === "2" ? { ...t, status: "running" as const } : t)))

      // Extract the NEW IEP data from response.new_iep (per project rules)
      const newIEP = data.new_iep || data.iep || data.result?.new_iep || data.result?.iep
      const remediationData = data.remediation || data.result?.remediation

      console.log("[v0] new_iep found:", !!newIEP)
      console.log("[v0] remediation found:", !!remediationData)

      if (!newIEP) {
        console.error("[v0] No new_iep in response. Full data:", data)
        throw new Error("No IEP data in response")
      }

      // Update remaining tasks
      setBuildTasks((tasks) =>
        tasks.map((t) => (t.id === "2" || t.id === "3" ? { ...t, status: "complete" as const } : t)),
      )
      setBuildTasks((tasks) => tasks.map((t) => (t.id === "4" ? { ...t, status: "running" as const } : t)))

      // Set the extracted IEP data (this is the NEW IEP, not the old one)
      setExtractedIEP({
        student: newIEP.student,
        eligibility: newIEP.eligibility,
        plaafp: newIEP.plaafp,
        goals: newIEP.goals,
        services: newIEP.services,
        accommodations: newIEP.accommodations,
        placement: newIEP.placement,
      })

      // Set remediation data with score from remediation.original_score
      setRemediation({
        score: remediationData?.original_score || remediationData?.score || 0,
        original_score: remediationData?.original_score,
        issues: remediationData?.issues || [],
        passed_count: remediationData?.passed_count,
        total_checks: remediationData?.total_checks,
        checks_passed: remediationData?.checks_passed || [],
        checks_failed: remediationData?.checks_failed || [],
      })

      // Complete all tasks
      setBuildTasks((tasks) => tasks.map((t) => ({ ...t, status: "complete" as const })))

      logEvent("EXTRACTION_COMPLETED", {
        score: remediationData?.original_score || remediationData?.score,
        goalsCount: newIEP.goals?.length,
        servicesCount: newIEP.services?.length,
      })

      logEvent("BUILD_COMPLETED", {
        score: remediationData?.original_score || remediationData?.score,
        goalsCount: newIEP.goals?.length,
        servicesCount: newIEP.services?.length,
        elapsedMs: Date.now() - (reviewStartTime || Date.now()),
      })

      // Auto-advance to review after short delay
      setTimeout(() => {
        setReviewStartTime(Date.now())
        setCurrentStep("review")
      }, 1500)
    } catch (error) {
      console.error("[v0] Build error:", error)
      setBuildError(error instanceof Error ? error.message : "Unknown error")
      logEvent("BUILD_FAILED", { error: error instanceof Error ? error.message : "Unknown" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRetryBuild = () => {
    setBuildError(null)
    handleStartBuilding()
  }

  const handleNext = () => {
    if (currentStep === "upload" && files.length > 0) {
      logEvent("FILE_UPLOADED", { fileCount: files.length })
      setCurrentStep("tell")
    } else if (currentStep === "tell") {
      // Start the building process
      handleStartBuilding()
    }
  }

  const handleBack = () => {
    if (currentStep === "tell") {
      setCurrentStep("upload")
    } else if (currentStep === "building") {
      setCurrentStep("tell")
    }
  }

  const handleUpdateText = (text: string) => {
    setStudentUpdate(text)
  }

  const handleStateChange = (state: string) => {
    setSelectedState(state)
  }

  const handleDateChange = (date: string) => {
    setIEPDate(date)
  }

  const handleApplyFix = (issue: ComplianceIssue) => {
    setFixedIssues((prevIssues) => new Set([...prevIssues, issue.id]))
    setIsFixing(true)
    logEvent("FIX_AUTO_APPLIED", { issueId: issue.id })
  }

  const handleApplyAll = () => {
    setFixedIssues(new Set(remediation?.issues.map((issue) => issue.id) || []))
    setIsFixing(true)
    logEvent("FIX_ALL_APPLIED")
  }

  const handleFinish = () => {
    // Logic to finalize the IEP
    logEvent("IEP_APPROVED")
  }

  const handleDownload = () => {
    // Logic to download the IEP
    logEvent("FINAL_IEP_DOWNLOADED")
  }

  return (
    <div>
      {currentStep === "upload" && (
        <UploadStep files={files} onAddFiles={handleAddFiles} onRemoveFile={handleRemoveFile} onNext={handleNext} />
      )}

      {currentStep === "tell" && (
        <TellStep
          studentUpdate={studentUpdate}
          onUpdateText={handleUpdateText}
          onBack={handleBack}
          onNext={handleNext}
          selectedState={selectedState}
          onStateChange={handleStateChange}
          iepDate={iepDate}
          onDateChange={handleDateChange}
          logEvent={logEvent}
        />
      )}

      {currentStep === "building" && (
        <BuildingStep
          tasks={buildTasks}
          error={buildError}
          onRetry={handleRetryBuild}
          selectedState={selectedState}
          onComplete={() => {
            setCurrentStep("review")
            logEvent("BUILDING_COMPLETED")
          }}
        />
      )}

      {currentStep === "review" && extractedIEP && remediation && (
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
          selectedState={selectedState}
          startTime={reviewStartTime}
          logEvent={logEvent}
          iepDate={iepDate} // Pass iepDate prop
        />
      )}
    </div>
  )
}

export default IEPWizard
