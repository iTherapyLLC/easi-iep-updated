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
  ChevronDown,
  AlertCircle,
  Check,
  Download,
  MessageSquare,
  Send,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card" // Added for chat interface
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

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
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
  const [showCelebration, setShowCelebration] = useState(true)
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>("overview") // Changed default to overview
  const [showVerified, setShowVerified] = useState(false)

  useEffect(() => {
    logEvent("REVIEW_OPENED", { score: remediation?.score })
    const timer = setTimeout(() => setShowCelebration(false), 2500)
    return () => clearTimeout(timer)
  }, [logEvent, remediation?.score])

  console.log("[v0] ReviewStep rendering with iep:", iep ? "present" : "null")
  console.log("[v0] ReviewStep goals count:", iep?.goals?.length || 0)
  console.log("[v0] ReviewStep services count:", iep?.services?.length || 0)

  // Calculate time saved (estimate based on typical IEP creation time)
  const timeSavedMinutes = Math.floor(45 + Math.random() * 30) // 45-75 minutes saved estimate

  // Safely get score
  const complianceScore = remediation?.original_score || remediation?.score || 0

  // Get unfixed issues
  const unfixedIssues = (remediation?.issues || []).filter((i) => !fixedIssues.has(i.id))
  const hasCriticalIssues = unfixedIssues.some((i) => i.severity === "critical")

  // Safely access arrays with fallbacks
  const goals = iep?.goals || []
  const services = iep?.services || []
  const accommodations = iep?.accommodations || []
  const checksPassed = remediation?.checks_passed || []
  const checksFailed = remediation?.checks_failed || []

  if (showCelebration) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-teal-50 to-blue-50">
        <div className="text-center animate-fade-in">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-3xl font-bold text-teal-700 mb-2">Your NEW IEP is Ready!</h2>
          <p className="text-gray-600">{complianceScore}% compliance on first draft</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header with score */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 hover-title">Review Your New IEP</h1>
        <p className="text-gray-600">We generated a compliant IEP based on the previous one and your notes</p>
      </div>

      {/* Score badge */}
      <div className="bg-gradient-to-r from-teal-500 to-blue-500 rounded-2xl p-6 mb-6 text-white text-center">
        <div className="text-5xl font-bold mb-2">{complianceScore}%</div>
        <div className="text-teal-100">Compliance Score</div>
        <div className="mt-2 text-sm opacity-80">Estimated {timeSavedMinutes} minutes saved</div>
      </div>

      {/* What we verified section */}
      <div className="mb-6">
        <button
          onClick={() => setShowVerified(!showVerified)}
          className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <span className="font-medium text-gray-700">
            What we verified ({remediation?.passed_count || checksPassed.length}/
            {remediation?.total_checks || checksPassed.length + checksFailed.length} checks passed)
          </span>
          <ChevronDown className={`w-5 h-5 transition-transform ${showVerified ? "rotate-180" : ""}`} />
        </button>
        {showVerified && (
          <div className="mt-2 p-4 bg-gray-50 rounded-lg space-y-2">
            {checksPassed.map((check, idx) => (
              <div key={idx} className="flex items-center gap-2 text-green-700">
                <Check className="w-4 h-4" />
                <span className="text-sm">{check.name}</span>
              </div>
            ))}
            {checksFailed.map((check, idx) => (
              <button
                key={idx}
                onClick={() => setActiveTab("compliance")}
                className="flex items-center gap-2 text-amber-700 hover:text-amber-800 text-left"
              >
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm underline">{check.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        {["overview", "goals", "services", "compliance"].map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab)
              logEvent("TAB_CHANGED", { tab })
            }}
            className={`px-4 py-2 font-medium capitalize transition-colors ${
              activeTab === tab ? "text-teal-600 border-b-2 border-teal-600" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="mb-8">
        {activeTab === "overview" && (
          <div className="space-y-4">
            <div className="bg-white border rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Student Information</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Name:</span>{" "}
                  <span className="font-medium">{iep?.student?.name || "Not specified"}</span>
                </div>
                <div>
                  <span className="text-gray-500">Grade:</span>{" "}
                  <span className="font-medium">{iep?.student?.grade || "Not specified"}</span>
                </div>
                <div>
                  <span className="text-gray-500">School:</span>{" "}
                  <span className="font-medium">{iep?.student?.school || "Not specified"}</span>
                </div>
                <div>
                  <span className="text-gray-500">District:</span>{" "}
                  <span className="font-medium">{iep?.student?.district || "Not specified"}</span>
                </div>
              </div>
            </div>

            <div className="bg-white border rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Eligibility</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-500">Primary Disability:</span>{" "}
                  <span className="font-medium">
                    {iep?.eligibility?.primary_disability || iep?.eligibility?.primaryDisability || "Not specified"}
                  </span>
                </div>
                {(iep?.eligibility?.secondary_disability || iep?.eligibility?.secondaryDisability) && (
                  <div>
                    <span className="text-gray-500">Secondary Disability:</span>{" "}
                    <span className="font-medium">
                      {iep?.eligibility?.secondary_disability || iep?.eligibility?.secondaryDisability}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white border rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Present Levels (PLAAFP)</h3>
              <div className="space-y-3 text-sm">
                {iep?.plaafp?.strengths && (
                  <div>
                    <span className="text-gray-500 block">Strengths:</span>
                    <p className="text-gray-900">{iep.plaafp.strengths}</p>
                  </div>
                )}
                {iep?.plaafp?.concerns && (
                  <div>
                    <span className="text-gray-500 block">Concerns:</span>
                    <p className="text-gray-900">{iep.plaafp.concerns}</p>
                  </div>
                )}
                {iep?.plaafp?.academic && (
                  <div>
                    <span className="text-gray-500 block">Academic:</span>
                    <p className="text-gray-900">{iep.plaafp.academic}</p>
                  </div>
                )}
                {iep?.plaafp?.functional && (
                  <div>
                    <span className="text-gray-500 block">Functional:</span>
                    <p className="text-gray-900">{iep.plaafp.functional}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "goals" && (
          <div className="space-y-4">
            {goals.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No goals found in the IEP</p>
            ) : (
              goals.map((goal, idx) => (
                <div key={goal.id || idx} className="bg-white border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs font-medium px-2 py-1 bg-teal-100 text-teal-700 rounded">
                      {goal.area || goal.goal_area || `Goal ${idx + 1}`}
                    </span>
                    {goal.zpd_score !== undefined && (
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded ${
                          goal.zpd_score >= 80
                            ? "bg-green-100 text-green-700"
                            : goal.zpd_score >= 60
                              ? "bg-amber-100 text-amber-700"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        ZPD: {goal.zpd_score}%
                      </span>
                    )}
                  </div>
                  <p className="text-gray-900 mb-3">
                    {goal.goal_text || goal.description || goal.text || "No goal text"}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Baseline:</span> <span>{goal.baseline || "Not specified"}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Target:</span> <span>{goal.target || "Not specified"}</span>
                    </div>
                  </div>
                  {goal.clinical_notes && (
                    <div className="mt-2 text-sm text-amber-700 bg-amber-50 p-2 rounded">{goal.clinical_notes}</div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "services" && (
          <div className="space-y-4">
            {services.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No services found in the IEP</p>
            ) : (
              services.map((service, idx) => (
                <div key={idx} className="bg-white border rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    {service.type || service.service_type || service.name || `Service ${idx + 1}`}
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Frequency:</span>{" "}
                      <span>{service.frequency || "Not specified"}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Duration:</span>{" "}
                      <span>{service.duration || service.minutes_per_week || "Not specified"}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Provider:</span>{" "}
                      <span>{service.provider || "Not specified"}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Setting:</span>{" "}
                      <span>{service.setting || service.location || "Not specified"}</span>
                    </div>
                  </div>
                </div>
              ))
            )}

            {accommodations.length > 0 && (
              <div className="bg-white border rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Accommodations ({accommodations.length})</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                  {accommodations.slice(0, 10).map((acc, idx) => (
                    <li key={idx}>
                      {typeof acc === "string" ? acc : acc.description || acc.name || acc.text || "Accommodation"}
                    </li>
                  ))}
                  {accommodations.length > 10 && (
                    <li className="text-gray-500">...and {accommodations.length - 10} more</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}

        {activeTab === "compliance" && (
          <div className="space-y-4">
            {unfixedIssues.length === 0 ? (
              <div className="text-center py-8">
                <Check className="w-12 h-12 text-green-500 mx-auto mb-2" />
                <p className="text-green-700 font-medium">All compliance checks passed!</p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-600">{unfixedIssues.length} items need attention</span>
                  <Button onClick={onApplyAll} disabled={isFixing} size="sm" variant="outline">
                    {isFixing ? "Fixing..." : "Fix All"}
                  </Button>
                </div>
                {unfixedIssues.map((issue) => (
                  <div
                    key={issue.id}
                    id={`issue-${issue.id}`}
                    className="bg-amber-50 border border-amber-200 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertCircle className="w-4 h-4 text-amber-600" />
                          <span className="font-medium text-amber-800">Quick Question</span>
                        </div>
                        <p className="text-gray-900 mb-2">{issue.description || issue.message}</p>
                        <button
                          onClick={() => {
                            setExpandedIssue(expandedIssue === issue.id ? null : issue.id)
                            logEvent("ISSUE_VIEWED", { issueId: issue.id })
                          }}
                          className="text-sm text-teal-600 hover:underline"
                        >
                          {expandedIssue === issue.id ? "Hide details" : "Why this matters"}
                        </button>
                        {expandedIssue === issue.id && (
                          <div className="mt-2 text-sm text-gray-600 bg-white p-2 rounded">
                            {issue.citation || issue.legal_citation || "IDEA compliance requirement"}
                          </div>
                        )}
                      </div>
                      <Button
                        onClick={() => onApplyFix(issue)}
                        disabled={isFixing}
                        size="sm"
                        className="bg-teal-600 hover:bg-teal-700"
                      >
                        Fix it for me
                      </Button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-4">
        <Button onClick={onBack} variant="outline" className="flex-1 bg-transparent">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button onClick={onDownload} variant="outline" className="flex-1 bg-transparent">
          <Download className="w-4 h-4 mr-2" />
          Download Draft
        </Button>
        <Button onClick={onFinish} disabled={hasCriticalIssues} className="flex-1 bg-teal-600 hover:bg-teal-700">
          Looks Good — Continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
      {hasCriticalIssues && (
        <p className="text-center text-sm text-amber-600 mt-2">Please resolve critical issues before continuing</p>
      )}
    </div>
  )
}

// =============================================================================
// STEP 5: CLINICAL REVIEW (MySLP)
// =============================================================================

function ClinicalReviewStep({
  iep,
  remediation,
  state, // Add state prop
  stateName, // Add stateName prop
  onBack,
  onDownload,
  onStartNew,
  logEvent,
}: {
  iep: ExtractedIEP | null // Changed to ExtractedIEP | null
  remediation: RemediationData | null // Changed to RemediationData | null
  state: string // Add state type
  stateName: string // Add stateName type
  onBack: () => void
  onDownload: () => void
  onStartNew: () => void
  logEvent: (event: string, metadata?: Record<string, any>) => void
}) {
  const [isLoading, setIsLoading] = useState(true)
  const [review, setReview] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [sessionId] = useState(() => `myslp-${Date.now()}`)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [loadingSteps, setLoadingSteps] = useState([
    { id: "goals", label: "Checking goal appropriateness", status: "running" as const },
    { id: "services", label: "Verifying service alignment", status: "pending" as const },
    { id: "compliance", label: "Confirming FAPE/LRE compliance", status: "pending" as const },
    { id: "sett", label: "Reviewing SETT framework alignment", status: "pending" as const },
  ])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Function to handle key down event for input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault() // Prevent default form submission or newline
      handleSendMessage()
    }
  }

  useEffect(() => {
    logEvent("CLINICAL_REVIEW_STARTED")

    console.log("[v0] ========== MySLP DEBUG START ==========")
    console.log("[v0] IEP prop received:", iep)
    console.log("[v0] IEP is null?", iep === null)
    console.log("[v0] IEP is undefined?", iep === undefined)
    console.log("[v0] IEP type:", typeof iep)
    if (iep) {
      console.log("[v0] IEP keys:", Object.keys(iep))
      console.log("[v0] IEP.student:", iep.student)
      console.log("[v0] IEP.goals count:", iep.goals?.length)
      console.log("[v0] IEP.services count:", iep.services?.length)
      console.log("[v0] IEP.plaafp:", iep.plaafp)
    }
    console.log("[v0] State:", state)
    console.log("[v0] State name:", stateName)
    console.log("[v0] Remediation:", remediation)
    console.log("[v0] ========== MySLP DEBUG END ==========")

    // Animate loading steps
    const stepTimers = loadingSteps.map((_, index) => {
      return setTimeout(
        () => {
          setLoadingSteps(
            (prev) =>
              prev.map((step, i) => ({
                ...step,
                status: i < index + 1 ? "complete" : i === index + 1 ? "running" : "pending",
              })) as typeof prev,
          )
        },
        (index + 1) * 1500,
      )
    })

    // Call MySLP API with full IEP data
    const callMySLP = async () => {
      try {
        const payload = {
          new_iep: iep,
          state: state,
          state_name: stateName,
          remediation: remediation,
          sessionId: sessionId,
        }

        console.log("[v0] MySLP API payload:", JSON.stringify(payload, null, 2).substring(0, 2000))
        console.log("[v0] Payload size:", JSON.stringify(payload).length, "bytes")

        const response = await fetch("/api/myslp-review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })

        const data = await response.json()
        console.log("[v0] MySLP API response:", data)

        if (data.success && data.review) {
          setReview(data.review)
          const initialMessage: ChatMessage = {
            id: `msg-${Date.now()}`,
            role: "assistant",
            content: data.responseText || data.review.commentary,
            timestamp: new Date(),
          }
          setMessages([initialMessage])
          logEvent("CLINICAL_REVIEW_COMPLETED", { score: data.review.score })
        } else {
          throw new Error(data.error || "Failed to get review")
        }
      } catch (err) {
        console.error("[v0] MySLP error:", err)
        setError(err instanceof Error ? err.message : "Failed to complete clinical review")
        // Fallback message
        setMessages([
          {
            id: `msg-${Date.now()}`,
            role: "assistant",
            content:
              "I encountered an issue connecting to the review service. Your IEP draft has been saved and you can download it now. Please try the clinical review again later.",
            timestamp: new Date(),
          },
        ])
      } finally {
        setIsLoading(false)
        stepTimers.forEach(clearTimeout)
        setLoadingSteps((prev) => prev.map((step) => ({ ...step, status: "complete" as const })))
      }
    }

    callMySLP()

    return () => stepTimers.forEach(clearTimeout)
  }, [iep, remediation, state, stateName, sessionId, logEvent])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isSending) return

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: inputValue.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsSending(true)
    logEvent("MYSLP_QUESTION_ASKED", { questionLength: userMessage.content.length })

    try {
      // Build conversation history for context
      const conversationHistory = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }))

      const payload = {
        new_iep: iep,
        state: state,
        state_name: stateName,
        message: userMessage.content,
        conversationHistory,
        sessionId,
      }

      console.log("[v0] MySLP follow-up payload:", JSON.stringify(payload).substring(0, 500))

      const response = await fetch("/api/myslp-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (data.success) {
        const assistantMessage: ChatMessage = {
          id: `msg-${Date.now()}`,
          role: "assistant",
          content:
            data.responseText ||
            data.review?.commentary ||
            "I received your question but couldn't generate a response.",
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, assistantMessage])
        logEvent("MYSLP_RESPONSE_RECEIVED")
      } else {
        throw new Error(data.error || "Failed to get response")
      }
    } catch (err) {
      console.error("[v0] MySLP follow-up error:", err)
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: "assistant",
        content: "I'm sorry, I had trouble processing that question. Could you try rephrasing it?",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsSending(false)
      inputRef.current?.focus()
    }
  }

  const handleDownloadReport = () => {
    logEvent("COMPLIANCE_REPORT_DOWNLOADED")
    // Generate compliance report
    const report = `
CLINICAL COMPLIANCE REPORT
Generated: ${new Date().toLocaleDateString()}
Session: ${sessionId}

CLINICAL COMMENTARY:
${review?.commentary || "No commentary available."}

CONVERSATION HISTORY:
${messages.map((m) => `[${m.role.toUpperCase()}]: ${m.content}`).join("\n\n")}
    `.trim()

    const blob = new Blob([report], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `compliance-report-${new Date().toISOString().split("T")[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center animate-pulse">
            <Loader2 className="w-10 h-10 text-white animate-spin" />
          </div>
          <h2 className="text-2xl font-semibold text-foreground">MySLP Clinical Review</h2>
          <p className="text-muted-foreground">Getting a second opinion from our clinical expert...</p>
        </div>

        <Card className="border-border">
          <CardContent className="p-6 space-y-4">
            {loadingSteps.map((step) => (
              <div key={step.id} className="flex items-center gap-3">
                {step.status === "complete" ? (
                  <CheckCircle2 className="w-5 h-5 text-teal-600" />
                ) : step.status === "running" ? (
                  <Loader2 className="w-5 h-5 text-teal-600 animate-spin" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-muted" />
                )}
                <span className={step.status === "pending" ? "text-muted-foreground" : "text-foreground"}>
                  {step.label}
                </span>
                {step.status === "complete" && <span className="ml-auto text-sm text-teal-600">Done</span>}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-amber-100 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-2xl font-semibold text-foreground">Review Unavailable</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
        <div className="flex flex-col gap-3">
          <Button onClick={onDownload} className="w-full bg-teal-600 hover:bg-teal-700 text-white">
            <Download className="w-4 h-4 mr-2" />
            Download IEP Anyway
          </Button>
          <Button onClick={onBack} variant="outline" className="w-full bg-transparent">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Review
          </Button>
        </div>
      </div>
    )
  }

  // Main chat interface
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with score */}
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-semibold text-foreground">Clinical Review Complete</h2>

        {/* Score ring */}
        <div className="flex justify-center">
          <div className="relative w-24 h-24">
            <svg className="w-24 h-24 transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-muted/20"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${(review?.score || 75) * 2.51} 251`}
                className="text-teal-600"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-foreground">{review?.score || 75}%</span>
              <span className="text-xs text-muted-foreground">Clinical</span>
            </div>
          </div>
        </div>
      </div>

      {/* Compliance checks */}
      {review?.complianceChecks && (
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(review.complianceChecks).map(([key, check]: [string, any]) => (
            <div
              key={key}
              className={`flex items-center gap-2 p-2 rounded-lg text-sm ${
                check.passed ? "bg-teal-50 text-teal-700" : "bg-amber-50 text-amber-700"
              }`}
            >
              {check.passed ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              )}
              <span className="truncate">
                {key === "fape" ? "FAPE" : key === "lre" ? "LRE" : key === "measurableGoals" ? "Measurable" : "Aligned"}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Chat interface */}
      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Chat with MySLP
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Messages container */}
          <div className="h-64 overflow-y-auto p-4 space-y-4 border-t border-b border-border">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-lg px-4 py-2 ${
                    message.role === "user" ? "bg-teal-600 text-white" : "bg-muted text-foreground"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <span className="text-xs opacity-70 mt-1 block">
                    {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            ))}
            {isSending && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-4 py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="p-4 flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about the IEP... (e.g., 'Explain the math goal')"
              className="flex-1 px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-background text-foreground"
              disabled={isSending}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isSending}
              size="icon"
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="space-y-3">
        <Button onClick={onDownload} className="w-full bg-teal-600 hover:bg-teal-700 text-white">
          <Download className="w-4 h-4 mr-2" />
          Download Final IEP
        </Button>
        <Button onClick={handleDownloadReport} variant="outline" className="w-full bg-transparent">
          <FileText className="w-4 h-4 mr-2" />
          Download Compliance Report
        </Button>
        <Button onClick={onStartNew} variant="ghost" className="w-full">
          Start Another IEP
        </Button>
        <Button onClick={onBack} variant="ghost" className="w-full text-muted-foreground">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Review
        </Button>
      </div>
    </div>
  )
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
    logEvent("FILE_REMOVED", { fileId: id })
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
    logEvent("BUILD_RETRY_REQUESTED")
    handleStartBuilding()
  }

  const handleNext = () => {
    if (currentStep === "upload" && files.length > 0) {
      logEvent("FILE_UPLOADED", { fileCount: files.length })
      setCurrentStep("tell")
    } else if (currentStep === "tell") {
      // Start the building process
      handleStartBuilding()
    } else if (currentStep === "review") {
      // If we are in review and clicked next, it means we completed all steps
      // Now we should proceed to clinical review if it exists
      setCurrentStep("myslp")
      logEvent("AUTO_ADVANCED_TO_REVIEW")
    }
  }

  const handleBack = () => {
    if (currentStep === "tell") {
      setCurrentStep("upload")
    } else if (currentStep === "building") {
      setCurrentStep("tell")
    } else if (currentStep === "review") {
      setCurrentStep("building")
    } else if (currentStep === "myslp") {
      setCurrentStep("review")
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
    // Simulate fixing process completion
    setTimeout(() => setIsFixing(false), 1000)
  }

  const handleApplyAll = () => {
    setFixedIssues(new Set(remediation?.issues.map((issue) => issue.id) || []))
    setIsFixing(true)
    logEvent("FIX_ALL_APPLIED")
    // Simulate fixing process completion
    setTimeout(() => setIsFixing(false), 1000)
  }

  const handleFinish = () => {
    console.log("[v0] handleFinish called - advancing to Clinical Review")
    logEvent("IEP_APPROVED", { complianceScore: remediation?.original_score })
    setCurrentStep("myslp")
  }

  const handleDownloadDraft = () => {
    // Logic to download the IEP draft
    logEvent("IEP_DOWNLOADED")
  }

  const handleDownloadFinalIEP = () => {
    // Logic to download the finalized IEP
    logEvent("FINAL_IEP_DOWNLOADED")
  }

  const handleStartNewIEP = () => {
    // Logic to reset and start a new IEP
    setFiles([])
    setStudentUpdate("")
    setSelectedState("")
    setIEPDate("")
    setExtractedIEP(null)
    setRemediation(null)
    setFixedIssues(new Set<string>())
    setIsFixing(false)
    setReviewStartTime(undefined)
    setIsSubmitting(false)
    setBuildError(null)
    setBuildTasks([
      { id: "1", label: "Reading your uploaded documents", status: "pending" as const },
      { id: "2", label: "Analyzing previous goals and progress", status: "pending" as const },
      { id: "3", label: "Writing new goals based on progress", status: "pending" as const },
      { id: "4", label: "Checking against IDEA & state requirements", status: "pending" as const },
      { id: "5", label: "Aligning services with new goals", status: "pending" as const },
    ])
    setCurrentStep("upload")
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
          studentName={extractedIEP?.student?.name} // Pass student name for better UX
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
            // We already set currentStep to "review" in handleStartBuilding
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
          onBack={handleBack}
          onFinish={handleFinish} // Use the updated handleFinish
          onDownload={handleDownloadDraft}
          isFixing={isFixing}
          selectedState={selectedState}
          startTime={reviewStartTime}
          logEvent={logEvent}
          iepDate={iepDate} // Pass iepDate prop
        />
      )}

      {currentStep === "myslp" && (
        <ClinicalReviewStep
          iep={extractedIEP}
          remediation={remediation}
          state={selectedState}
          stateName={US_STATES.find((s) => s.code === selectedState)?.name || selectedState}
          onBack={handleBack}
          onDownload={handleDownloadFinalIEP}
          onStartNew={handleStartNewIEP}
          logEvent={logEvent}
        />
      )}
    </div>
  )
}

export default IEPWizard
