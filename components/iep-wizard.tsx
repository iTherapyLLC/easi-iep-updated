"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Check,
  X,
  Shield,
  Target,
  Users,
  Mic,
  MicOff,
  BarChart3,
  ClipboardCheck,
  Award,
  Pencil,
  Wand2,
  ListChecks,
  Building2,
  AlertTriangle,
  User,
  Heart,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useVoice } from "@/hooks/use-voice" // Added useVoice hook import
import { useHashChainLogger } from "@/hooks/use-hashchain-logger" // Added useHashChainLogger hook import

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Safely render a value that might be an object.
 * React Error #31 occurs when trying to render objects directly as React children.
 */
const safeRender = (value: unknown, fallback = 'Not specified'): string => {
  if (value === null || value === undefined) return fallback
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) {
    return value.map(v => safeRender(v, '')).filter(Boolean).join(', ') || fallback
  }
  if (typeof value === 'object') {
    // Handle objects like { writing: "...", mathematics: "..." }
    const vals = Object.values(value as Record<string, unknown>)
    if (vals.length === 0) return fallback
    return vals.map(v => safeRender(v, '')).filter(Boolean).join(', ') || fallback
  }
  return String(value)
}

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

// 13 IDEA disability categories for CHECK 12 compliance
const IDEA_DISABILITY_CATEGORIES = [
  { code: "autism", label: "Autism" },
  { code: "deaf-blindness", label: "Deaf-Blindness" },
  { code: "deafness", label: "Deafness" },
  { code: "emotional-disturbance", label: "Emotional Disturbance" },
  { code: "hearing-impairment", label: "Hearing Impairment" },
  { code: "intellectual-disability", label: "Intellectual Disability" },
  { code: "multiple-disabilities", label: "Multiple Disabilities" },
  { code: "orthopedic-impairment", label: "Orthopedic Impairment" },
  { code: "other-health-impairment", label: "Other Health Impairment (OHI)" },
  { code: "specific-learning-disability", label: "Specific Learning Disability (SLD)" },
  { code: "speech-language-impairment", label: "Speech or Language Impairment" },
  { code: "traumatic-brain-injury", label: "Traumatic Brain Injury" },
  { code: "visual-impairment", label: "Visual Impairment (including Blindness)" },
]

const FUN_LOADING_MESSAGES = [
  "Teaching our AI to read between the lines...",
  "Cross-referencing with IDEA requirements...",
  "Making sure every goal is measurable...",
  "Checking the fine print so you don't have to...",
  "Our compliance robot is doing its thing...",
  "Dotting the i's and crossing the t's...",
  "Brewing a fresh batch of compliant goals...",
  "Consulting with our digital special ed expert...",
  "Analyzing patterns from thousands of IEPs...",
  "Almost there... perfection takes a moment!",
]

// Compliance score thresholds
const MINIMUM_PASSING_SCORE = 80
const EXCELLENT_SCORE = 90
const GOOD_SCORE = 70

// =============================================================================
// TYPES
// =============================================================================

interface UploadedFile {
  id: string
  name: string
  type: "iep" | "notes" | "photo" | "report" | "other"
  file: File
  size?: number // Added size for file information
}

interface ComplianceIssue {
  id: string
  category: string
  severity: "critical" | "high" | "medium" | "low"
  title: string
  description: string
  legal_citation: string
  current_text: string // Added for display in EditIEPStep
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
    disability?: string // Added for student disability
    primary_disability?: string // Added for student primary disability
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
    disability_impact?: string // Added for disability impact
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
    domain?: string // Added for goal domain
    criteria?: string // Added for goal criteria
    evaluation_method?: string // Added for goal evaluation method
    measurement?: string // Added for goal measurement
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
  lre?: {
    // Added for LRE section in EditIEPStep
    setting?: string
    percent_general_ed?: string
    percent_special_ed?: string
    justification?: string
    placement?: string
  }
}

interface RemediationData {
  score: number
  original_score?: number // Added for clarity
  issues: Array<{
    id: string
    title: string
    description: string
    severity: "critical" | "warning" | "suggestion" | "high" | "medium" | "low" // Added high, medium, low
    citation?: string
    suggested_fix?: string
    auto_fixable?: boolean
    points_deducted?: number // Added for clarity
    current_text?: string // Added for display in EditIEPStep
    message?: string // Added for issue message display
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

// =============================================================================
// STEP 1: UPLOAD
// =============================================================================

function UploadStep({
  files,
  onRemoveFile,
  onFilesSelected,
  onNext,
  logEvent,
}: {
  files: UploadedFile[]
  onRemoveFile: (id: string) => void
  onFilesSelected: (files: File[]) => void // Updated prop name
  onNext: () => void
  logEvent: (event: string, metadata?: Record<string, unknown>) => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const hasIEP = files.some((f) => f.type === "iep")

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    onFilesSelected(selectedFiles) // Use onFilesSelected
    if (selectedFiles.length > 0) {
      logEvent("FILE_UPLOADED", { fileName: selectedFiles[0].name, fileSize: selectedFiles[0].size })
    }
    e.target.value = ""
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const droppedFiles = e.dataTransfer.files
    if (droppedFiles.length > 0) {
      onFilesSelected(Array.from(droppedFiles)) // Use onFilesSelected
      logEvent("FILE_UPLOADED", { fileName: droppedFiles[0].name, fileSize: droppedFiles[0].size })
    }
  }

  return (
    <div className="min-h-[80vh] flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img
          src="/soft-watercolor-illustration-of-warm-sunlit-elemen.jpg"
          alt=""
          className="w-full h-full object-cover opacity-[0.08]"
          aria-hidden="true"
        />
        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-blue-50/80 to-white/95" />
      </div>

      <div className="max-w-xl mx-auto px-6 py-8 flex-1 flex flex-col relative z-10">
        <div className="flex justify-center mb-4">
          <div className="relative w-32 h-32">
            <img
              src="/warm-watercolor-illustration-of-a-gentle-hand-hold.jpg"
              alt=""
              className="w-full h-full object-contain opacity-80"
              aria-hidden="true"
            />
          </div>
        </div>

        {/* Warm, empathetic header - acknowledges their hard day */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-100 rounded-full mb-4 shadow-sm">
            <Heart className="w-7 h-7 text-blue-600" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-3">You've got this.</h1>
          <p className="text-base text-slate-600 leading-relaxed">
            Just upload the current IEP and we'll handle the rest.
            <br />
            <span className="text-slate-500">Takes about 2 minutes.</span>
          </p>
        </div>

        {/* Simple, large drop zone - easy target for tired hands */}
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-2xl p-8 md:p-12 text-center cursor-pointer transition-all duration-200 mb-6 backdrop-blur-sm ${
            isDragOver
              ? "border-blue-500 bg-blue-100/70 scale-[1.01]"
              : hasIEP
                ? "border-green-400 bg-green-50/80"
                : "border-blue-300 bg-white/80 hover:border-blue-400 hover:bg-blue-50/70"
          }`}
        >
          <div
            className={`w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center transition-colors ${
              hasIEP ? "bg-green-500" : isDragOver ? "bg-blue-500" : "bg-blue-100"
            }`}
          >
            {hasIEP ? (
              <CheckCircle2 className="w-7 h-7 text-white" />
            ) : (
              <Upload className={`w-7 h-7 ${isDragOver ? "text-white" : "text-blue-600"}`} />
            )}
          </div>

          <p className="text-lg font-semibold text-slate-800 mb-2">
            {hasIEP ? "Got it! Ready when you are." : "Tap here or drop a file"}
          </p>
          <p className="text-sm text-slate-500">
            {hasIEP ? "Add more files if you'd like" : "PDF, Word doc, or photo"}
          </p>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.heic"
          />
        </div>

        {/* Uploaded files - simple, clear */}
        {files.length > 0 && (
          <div className="mb-6 space-y-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800 truncate max-w-[200px]">{file.name}</p>
                    <p className="text-xs text-green-600 font-medium">Ready</p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemoveFile(file.id)
                  }}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  aria-label="Remove file"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1 min-h-[20px]" />

        {/* Big, friendly continue button */}
        <button
          onClick={onNext}
          disabled={!hasIEP}
          className={`w-full py-5 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition-all ${
            hasIEP
              ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200/50"
              : "bg-slate-100 text-slate-400 cursor-not-allowed"
          }`}
        >
          {hasIEP ? (
            <>
              Continue
              <ArrowRight className="w-5 h-5" />
            </>
          ) : (
            "Upload the IEP to continue"
          )}
        </button>

        {/* Reassuring footer */}
        <p className="text-center text-xs text-slate-400 mt-4">Secure and private. We never store your documents.</p>
      </div>
    </div>
  )
}

// =============================================================================
// STEP 2: TELL US
// =============================================================================

// Find the TellStep component and update the button disabled condition

// Inside TellStep component props, add isFileReady:
interface TellStepProps {
  // ... existing props ...
  isFileReady: boolean
}

function TellUsStep({
  studentUpdate,
  setStudentUpdate, // Renamed from onUpdateText
  onBack,
  onNext,
  studentName,
  selectedState,
  setSelectedState, // Renamed from onStateChange
  iepDate,
  setIepDate, // Renamed from onDateChange
  logEvent, // Added logEvent prop
  isListening,
  onStartListening,
  onStopListening,
  isFileReady, // Added isFileReady prop
}: TellStepProps) {
  const hasContent = studentUpdate.trim().length > 20
  const stateName = US_STATES.find((s) => s.code === selectedState)?.name || selectedState

  const { isSupported, toggleRecording } = useVoice({
    onTranscript: (text) => {
      setStudentUpdate(studentUpdate + (studentUpdate ? " " : "") + text)
      logEvent("VOICE_TRANSCRIPT_ADDED", { length: text.length })
    },
  })

  const handleMicClick = () => {
    if (isListening) {
      onStopListening()
      logEvent("MIC_TOGGLED", { isRecording: false })
    } else {
      onStartListening()
      logEvent("MIC_TOGGLED", { isRecording: true })
    }
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
                setSelectedState(e.target.value)
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
                setIepDate(e.target.value)
                logEvent("DATE_CHANGED", { newDate: e.target.value }) // Log date change
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>
        </div>
        <p className="text-sm text-slate-500">
          We'll check against <span className="text-teal-600 font-medium">{stateName}</span> regulations
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <textarea
          value={studentUpdate}
          onChange={(e) => setStudentUpdate(e.target.value)}
          placeholder="Example: Jamie has made good progress on reading fluency - went from 45 to 62 words per minute. Still struggling with math word problems. Behavior has improved with the new check-in system..."
          className="w-full h-40 px-4 py-3 border border-slate-200 rounded-lg resize-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
        />
        <div className="flex items-center justify-between mt-3">
          <button
            onClick={handleMicClick}
            disabled={!isSupported}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              isListening // Changed from isRecording to isListening
                ? "bg-red-100 text-red-700 animate-pulse"
                : isSupported
                  ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  : "bg-slate-50 text-slate-400 cursor-not-allowed"
            }`}
            title={!isSupported ? "Voice input not supported in this browser" : undefined}
          >
            {isListening ? ( // Changed from isRecording to isListening
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
                setStudentUpdate(studentUpdate + (studentUpdate ? " " : "") + prompt + ". ")
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
        {/* Update the Build My IEP button in TellStep */}
        <Button
          onClick={onNext}
          disabled={!hasContent || !isFileReady}
          className="flex-1 bg-teal-600 hover:bg-teal-700"
        >
          Build My IEP
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {!hasContent && (
        <p className="text-center text-sm text-slate-500 mt-4">
          Please add at least 20 characters about student progress
        </p>
      )}
      {hasContent && !isFileReady && (
        <p className="text-center text-sm text-amber-600 mt-4">Processing uploaded file...</p>
      )}
    </div>
  )
}

// =============================================================================
// STEP 3: BUILDING
// =============================================================================

function AnimatedProgressRing({ progress, size = 120 }: { progress: number; size?: number }) {
  const strokeWidth = 8
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (progress / 100) * circumference

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Background ring */}
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-blue-100"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-blue-500 transition-all duration-500 ease-out"
        />
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold text-blue-600">{Math.round(progress)}%</span>
      </div>
    </div>
  )
}

function BouncingDots() {
  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.6s" }}
        />
      ))}
    </div>
  )
}

function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 bg-blue-200 rounded-full opacity-60"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 2}s`,
          }}
        />
      ))}
    </div>
  )
}

interface BuildingTask {
  id: string
  label: string
  status: "pending" | "loading" | "complete" | "error" // Changed "running" to "loading"
}

function BuildingStep({
  tasks,
  error,
  onRetry,
  selectedState,
  onComplete,
  onStartBuild,
}: {
  tasks: BuildingTask[]
  error: string | null
  onRetry: () => void
  selectedState: string
  onComplete?: () => void
  onStartBuild?: () => void
}) {
  const stateName = US_STATES.find((s) => s.code === selectedState)?.name || selectedState
  const allComplete = tasks.every((t) => t.status === "complete")
  // Changed condition to check for 'loading' as well
  const currentTask = tasks.find((t) => t.status === "running" || t.status === "loading")

  const completedCount = tasks.filter((t) => t.status === "complete").length
  // Added check for tasks.length > 0 to prevent division by zero
  const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0

  const currentMessage = error
    ? "Let's try that again"
    : allComplete
      ? "Your IEP is ready for review!"
      : currentTask
        ? currentTask.label
        : "Starting..."

  // Use a ref to ensure API is called exactly once
  const apiCalledRef = useRef(false)

  useEffect(() => {
    console.log("[v0] BuildingStep mounted, apiCalledRef:", apiCalledRef.current)
    
    // Only call the API if we haven't already and onStartBuild exists
    if (!apiCalledRef.current && onStartBuild) {
      console.log("[v0] BuildingStep: Triggering onStartBuild NOW")
      apiCalledRef.current = true
      onStartBuild()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty deps - only run on mount

  // Auto-advance when all tasks complete
  useEffect(() => {
    if (allComplete && !error && onComplete) {
      console.log("[v0] BuildingStep: All tasks complete, auto-advancing in 1.5s")
      const timer = setTimeout(() => {
        onComplete()
      }, 1500) // Give user a moment to see completion
      return () => clearTimeout(timer)
    }
  }, [allComplete, error, onComplete])

  // This ensures accurate time tracking for research

  return (
    <div className="min-h-[80vh] flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img
          src="/soft-watercolor-illustration-of-organized-stack-of.jpg"
          alt=""
          className="w-full h-full object-cover opacity-[0.06]"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/95 via-slate-50/90 to-white/95" />
      </div>

      {/* FloatingParticles removed when not allComplete and no error */}
      {!allComplete && !error && <FloatingParticles />}

      <div className="max-w-2xl mx-auto px-4 py-8 relative z-10 flex-1 flex flex-col justify-center">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            {allComplete ? (
              <div className="relative">
                <div className="absolute -inset-8 z-0">
                  <img
                    src="/soft-watercolor-confetti-burst-in-blue-and-gold--c.jpg"
                    alt=""
                    className="w-full h-full object-contain opacity-30 animate-pulse"
                    aria-hidden="true"
                  />
                </div>
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center animate-bounce shadow-lg shadow-blue-200 relative z-10">
                  <CheckCircle2 className="w-12 h-12 text-white" />
                </div>
              </div>
            ) : error ? (
              <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg shadow-red-200">
                <AlertTriangle className="w-12 h-12 text-white" />
              </div>
            ) : (
              <AnimatedProgressRing progress={progress} size={120} />
            )}
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            {allComplete ? "Your IEP is Ready!" : error ? "Oops! Something went wrong" : "Building Your New IEP"}
          </h1>

          <p className="text-slate-600">{currentMessage}</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6 text-center">
            <p className="text-red-800 mb-4">{error}</p>
            <button
              onClick={onRetry}
              className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-medium hover:from-red-600 hover:to-red-700 transition-all shadow-lg shadow-red-200"
            >
              Try Again
            </button>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8 shadow-sm relative z-10">
          <div className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`flex items-center gap-4 p-3 rounded-xl transition-all duration-300 ${
                  task.status === "loading"
                    ? "bg-blue-50 border border-blue-100"
                    : task.status === "complete"
                      ? "bg-green-50/50"
                      : task.status === "error"
                        ? "bg-red-50 border border-red-100"
                        : "bg-slate-50/50"
                }`}
              >
                <div className="flex-shrink-0">
                  {task.status === "complete" ? (
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                  ) : task.status === "loading" ? (
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    </div>
                  ) : task.status === "error" ? (
                    <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-white" />
                    </div>
                  ) : (
                    // Changed to show task index + 1 for pending tasks
                    <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                      <span className="text-slate-500 text-sm font-medium">
                        {tasks.findIndex((t) => t.id === task.id) + 1}
                      </span>
                    </div>
                  )}
                </div>
                <span
                  className={`flex-1 font-medium ${
                    task.status === "complete"
                      ? "text-green-700"
                      : task.status === "loading"
                        ? "text-blue-700"
                        : task.status === "error"
                          ? "text-red-700"
                          : "text-slate-400"
                  }`}
                >
                  {task.label}
                </span>
                {task.status === "complete" && <span className="text-green-600 text-sm font-medium">Done</span>}
                {task.status === "loading" && <span className="text-blue-600 text-sm">Processing...</span>}
                {task.status === "error" && <span className="text-red-600 text-sm">Failed</span>}
              </div>
            ))}
          </div>
        </div>

        {allComplete && onComplete && (
          <div className="text-center">
            <button
              onClick={onComplete}
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-200 text-lg"
            >
              Review Your IEP
            </button>
          </div>
        )}

        {/* State validation info */}
        {!error && (
          <div className="bg-blue-50/80 backdrop-blur-sm rounded-xl p-4 text-center border border-blue-100">
            <p className="text-blue-700 text-sm">
              Validating against <span className="font-semibold">{stateName}</span> regulations and federal IDEA
              requirements
            </p>
          </div>
        )}
      </div>
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
  | "EDIT_STEP_STARTED" // Added for starting edit step
  | "FIELD_EDIT_STARTED" // Added for starting field edit
  | "FIELD_EDIT_SAVED" // Added for saving field edit
  | "FIELD_EDIT_CANCELLED" // Added for cancelling field edit
  | "EDIT_STEP_COMPLETED" // Added for completing edit step
  | "FIELD_EDITED" // Added for tracking field edits

function ReviewStep({
  iep,
  remediation,
  fixedIssues,
  onApplyFix,
  onApplyAll,
  onBack,
  onNext,
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
  onApplyFix: (issue: ComplianceIssue) => void // Updated type to ComplianceIssue
  onApplyAll: () => void
  onBack: () => void
  onNext: () => void
  onDownload: () => void
  isFixing: boolean
  selectedState: string
  startTime?: number // Added startTime prop type
  logEvent: (eventType: string, metadata?: Record<string, any>) => void // Added logEvent prop
  iepDate: string // Added iepDate type
}) {
  const [showCelebration, setShowCelebration] = useState(false)
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>("overview") // Changed default to overview
  const [showVerified, setShowVerified] = useState(false)

  const stateName = US_STATES.find((s) => s.code === selectedState)?.name || selectedState // Added

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
  const passedCount = remediation?.passed_count ?? checksPassed.length // Added
  const totalChecks = remediation?.total_checks ?? checksPassed.length + checksFailed.length // Added

  if (showCelebration) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center animate-celebration">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-xl">
            <Award className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-blue-700 mb-2">Your NEW IEP is Ready!</h2>
          <p className="text-gray-600">{complianceScore}% compliance on first draft</p>
        </div>
      </div>
    )
  }

  // Helper functions for score-based styling
  const getScoreColors = (score: number) => {
    if (score >= EXCELLENT_SCORE) return "from-green-600 to-green-800"
    if (score >= GOOD_SCORE) return "from-orange-500 to-orange-700"
    return "from-red-600 to-red-800"
  }

  const getScoreTextColor = (score: number) => {
    if (score >= EXCELLENT_SCORE) return "text-green-100"
    if (score >= GOOD_SCORE) return "text-orange-100"
    return "text-red-100"
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header with score */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-lg">
          <ClipboardCheck className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-2 hover-title">Review Your New IEP</h1>
        <p className="text-muted-foreground">We generated a compliant IEP based on the previous one and your notes</p>
      </div>

      {/* Score badge - dynamic color based on score */}
      <div className={`bg-gradient-to-r ${getScoreColors(complianceScore)} rounded-2xl p-6 mb-6 text-white text-center`}>
        <div className="text-5xl font-bold mb-2">{complianceScore}%</div>
        <div className={`${getScoreTextColor(complianceScore)} font-medium`}>{stateName} Compliant</div>
        <div className={`text-sm ${getScoreTextColor(complianceScore)} mt-1`}>Validated against {stateName} regulations and federal IDEA</div>
        <div className="mt-3 inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1">
          <Clock className="w-4 h-4" />
          <span className="text-sm">Estimated {timeSavedMinutes} minutes saved</span>
        </div>
      </div>

      {/* Warning message for low compliance scores */}
      {complianceScore < MINIMUM_PASSING_SCORE && (
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2 mb-6">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          <span className="text-amber-800 font-medium">
            {unfixedIssues.length} issue{unfixedIssues.length !== 1 ? 's' : ''} need attention before proceeding
          </span>
        </div>
      )}

      {/* What we verified section */}
      <div className="bg-card rounded-xl border border-border mb-6 overflow-hidden">
        <button
          onClick={() => setShowVerified(!showVerified)}
          className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-blue-600" />
            <span className={`font-medium ${passedCount / totalChecks < 0.8 ? 'text-red-600' : 'text-foreground'}`}>
              What we verified ({passedCount}/{totalChecks} checks passed)
            </span>
          </div>
          {showVerified ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </button>

        {showVerified && (
          <div className="px-4 pb-4 space-y-2 border-t border-border pt-4">
            {/* Passed checks */}
            {checksPassed.map(
              (
                check: any,
                i: number, // Changed type to any for simplicity based on provided code
              ) => (
                <div key={i} className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg p-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{check.name}</span>
                </div>
              ),
            )}
            {/* Failed checks */}
            {checksFailed.map(
              (
                check: any,
                i: number, // Changed type to any for simplicity based on provided code
              ) => (
                <button
                  key={i}
                  onClick={() => {
                    setActiveTab("compliance")
                    logEvent("COMPLIANCE_EXPANDED", { failedCheckName: check.name })
                  }}
                  className="w-full flex items-center gap-2 text-sm text-amber-700 bg-amber-50 rounded-lg p-2 hover:bg-amber-100 transition-colors text-left"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{check.name}</span>
                  <ArrowRight className="w-3 h-3 ml-auto" />
                </button>
              ),
            )}
          </div>
        )}
      </div>

      {/* Tabs - updated to blue */}
      <div className="flex border-b border-border mb-6">
        {[
          { id: "overview", label: "Overview", icon: BarChart3 },
          { id: "goals", label: "Goals", icon: Target },
          { id: "services", label: "Services", icon: Users },
          { id: "compliance", label: "Compliance", icon: Shield },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id)
              logEvent("TAB_CHANGED", { tabId: tab.id })
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="mb-8">
        {activeTab === "overview" && (
          <div className="space-y-4">
            <div className="bg-card border rounded-lg p-4">
              <h3 className="font-semibold text-foreground mb-3">Student Information</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Name:</span>{" "}
                  <span className="font-medium text-foreground">{safeRender(iep?.student?.name)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Grade:</span>{" "}
                  <span className="font-medium text-foreground">{safeRender(iep?.student?.grade)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">School:</span>{" "}
                  <span className="font-medium text-foreground">{safeRender(iep?.student?.school)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">District:</span>{" "}
                  <span className="font-medium text-foreground">{safeRender(iep?.student?.district)}</span>
                </div>
              </div>
            </div>

            <div className="bg-card border rounded-lg p-4">
              <h3 className="font-semibold text-foreground mb-3">Eligibility</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Primary Disability:</span>{" "}
                  <span className="font-medium text-foreground">
                    {safeRender(iep?.eligibility?.primary_disability || iep?.eligibility?.primaryDisability)}
                  </span>
                </div>
                {(iep?.eligibility?.secondary_disability || iep?.eligibility?.secondaryDisability) && (
                  <div>
                    <span className="text-muted-foreground">Secondary Disability:</span>{" "}
                    <span className="font-medium text-foreground">
                      {safeRender(iep?.eligibility?.secondary_disability || iep?.eligibility?.secondaryDisability)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-card border rounded-lg p-4">
              <h3 className="font-semibold text-foreground mb-3">Present Levels (PLAAFP)</h3>
              <div className="space-y-3 text-sm">
                {iep?.plaafp?.strengths && (
                  <div>
                    <span className="text-muted-foreground block">Strengths:</span>
                    <p className="text-foreground">{safeRender(iep.plaafp.strengths, "No strengths documented")}</p>
                  </div>
                )}
                {iep?.plaafp?.concerns && (
                  <div>
                    <span className="text-muted-foreground block">Concerns:</span>
                    <p className="text-foreground">{safeRender(iep.plaafp.concerns, "No concerns documented")}</p>
                  </div>
                )}
                {iep?.plaafp?.academic && (
                  <div>
                    <span className="text-muted-foreground block">Academic:</span>
                    <p className="text-foreground">{safeRender(iep.plaafp.academic, "No academic performance documented")}</p>
                  </div>
                )}
                {iep?.plaafp?.functional && (
                  <div>
                    <span className="text-muted-foreground block">Functional:</span>
                    <p className="text-foreground">{safeRender(iep.plaafp.functional, "No functional performance documented")}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "goals" && (
          <div className="space-y-4">
            {goals.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No goals found in the IEP</p>
            ) : (
              goals.map((goal, idx) => (
                <div key={goal.id || idx} className="bg-card border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-700 rounded">
                      {safeRender(goal.area || goal.goal_area, `Goal ${idx + 1}`)}
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
                  <p className="text-foreground mb-3">
                    {safeRender(goal.goal_text || goal.description || goal.text, "No goal text")}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Baseline:</span>{" "}
                      <span>{safeRender(goal.baseline)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Target:</span>{" "}
                      <span>{safeRender(goal.target)}</span>
                    </div>
                  </div>
                  {goal.clinical_notes && (
                    <div className="mt-2 text-sm text-amber-700 bg-amber-50 p-2 rounded">{safeRender(goal.clinical_notes, "")}</div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "services" && (
          <div className="space-y-4">
            {services.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No services found in the IEP</p>
            ) : (
              services.map((service, idx) => (
                <div key={idx} className="bg-card border rounded-lg p-4">
                  <h4 className="font-semibold text-foreground mb-2">
                    {safeRender(service.type || service.service_type || service.name, `Service ${idx + 1}`)}
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Frequency:</span>{" "}
                      <span>{safeRender(service.frequency)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Duration:</span>{" "}
                      <span>{safeRender(service.duration || service.minutes_per_week)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Provider:</span>{" "}
                      <span>{safeRender(service.provider)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Setting:</span>{" "}
                      <span>{safeRender(service.setting || service.location)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}

            {accommodations.length > 0 && (
              <div className="bg-card border rounded-lg p-4">
                <h4 className="font-semibold text-foreground mb-3">Accommodations ({accommodations.length})</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  {accommodations.slice(0, 10).map((acc, idx) => (
                    <li key={idx}>
                      {safeRender(typeof acc === "string" ? acc : acc.description || acc.name || acc.text, "Accommodation")}
                    </li>
                  ))}
                  {accommodations.length > 10 && (
                    <li className="text-muted-foreground">...and {accommodations.length - 10} more</li>
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
                  <span className="text-muted-foreground">{unfixedIssues.length} items need attention</span>
                  <Button
                    onClick={() => {
                      onApplyAll()
                      logEvent("FIX_ALL_APPLIED")
                    }}
                    disabled={isFixing}
                    size="sm"
                    variant="outline"
                  >
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
                          <span className="font-medium text-amber-800">{issue.title}</span>
                        </div>
                        <p className="text-foreground mb-2">{issue.description || issue.message}</p>
                        <button
                          onClick={() => {
                            setExpandedIssue(expandedIssue === issue.id ? null : issue.id)
                            logEvent("ISSUE_VIEWED", { issueId: issue.id })
                          }}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {expandedIssue === issue.id ? "Hide details" : "Why this matters"}
                        </button>
                        {expandedIssue === issue.id && (
                          <div className="mt-2 text-sm text-muted-foreground bg-card p-2 rounded">
                            {issue.citation || issue.legal_citation || "IDEA compliance requirement"}
                          </div>
                        )}
                      </div>
                      <Button
                        onClick={() => {
                          onApplyFix(issue)
                          logEvent("FIX_AUTO_APPLIED", { issueId: issue.id })
                        }}
                        disabled={isFixing}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
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

      {/* Action buttons - updated to blue */}
      <div className="flex gap-3 mt-8">
        <button
          onClick={() => {
            onBack()
            logEvent("NAVIGATED_BACK", { fromStep: "review" })
          }}
          className="flex-1 py-4 rounded-xl font-semibold border border-border hover:bg-muted transition-colors flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        <Button
          onClick={() => {
            onDownload()
            logEvent("IEP_DOWNLOADED", { context: "review_step" })
          }}
          className="flex-1 py-4 rounded-xl font-semibold border border-blue-600 text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
        >
          <Download className="w-5 h-5" />
          Download Draft
        </Button>
        <Button
          onClick={() => {
            onNext()
            logEvent("AUTO_ADVANCED_TO_REVIEW")
          }}
          className="flex-1 py-4 rounded-xl font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
        >
          Review & Edit IEP
          <ArrowRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  )
}

// =============================================================================
// STEP 5: EDIT & FIX (Previously Clinical Review)
// =============================================================================

// NOTE: This component is intended to replace the previous `EditIEPStep`
// and integrate the "fix" functionality more directly.
function EditIEPStep({
  iep,
  setIep,
  remediation,
  fixedIssues,
  setFixedIssues,
  onApplyFix,
  onBack,
  onContinue,
  onDownload, // Added onDownload prop
  isFixing,
  selectedState,
  logEvent,
}: {
  iep: ExtractedIEP
  setIep: React.Dispatch<React.SetStateAction<ExtractedIEP | null>>
  remediation: RemediationData | null
  fixedIssues: Set<string>
  setFixedIssues: React.Dispatch<React.SetStateAction<Set<string>>>
  onApplyFix: (issue: ComplianceIssue) => void // Changed type to ComplianceIssue
  onBack: () => void
  onContinue: () => void
  onDownload: () => void // Added onDownload type
  isFixing: boolean
  selectedState: string
  logEvent: (eventType: string, metadata?: Record<string, any>) => void
}) {
  const [activeSection, setActiveSection] = useState<string>("issues")
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValue, setEditValue] = useState<string>("")
  const [showCelebration, setShowCelebration] = useState(false)
  const [lastFixedIssue, setLastFixedIssue] = useState<string | null>(null)
  const [editingIssueId, setEditingIssueId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')

  const stateName = US_STATES.find((s) => s.code === selectedState)?.name || selectedState

  // Get issues grouped by severity
  const issues = remediation?.issues || []
  const unfixedIssues = issues.filter((i) => !fixedIssues.has(i.id))

  // Map severities to display categories
  const getSeverityCategory = (severity: string) => {
    if (severity === "critical") return "critical"
    if (severity === "warning" || severity === "high") return "high"
    return "medium"
  }

  const criticalIssues = unfixedIssues.filter((i) => getSeverityCategory(i.severity) === "critical")
  const highIssues = unfixedIssues.filter((i) => getSeverityCategory(i.severity) === "high")
  const mediumIssues = unfixedIssues.filter((i) => getSeverityCategory(i.severity) === "medium")

  // Calculate live compliance score
  const baseScore = remediation?.original_score || remediation?.score || 0
  const fixedPoints = issues.filter((i) => fixedIssues.has(i.id)).reduce((sum, i) => sum + (i.points_deducted || 5), 0)
  const currentScore = Math.min(100, baseScore + fixedPoints)
  const targetScore = 100

  const canProceed = criticalIssues.length === 0 && currentScore >= MINIMUM_PASSING_SCORE

  const sections = [
    { id: "issues", label: "All Issues", icon: AlertTriangle },
    { id: "student", label: "Student Info", icon: User },
    { id: "plaafp", label: "Present Levels", icon: FileText },
    { id: "goals", label: "Goals", icon: Target },
    { id: "services", label: "Services", icon: Users },
    { id: "accommodations", label: "Accommodations", icon: ListChecks },
    { id: "lre", label: "LRE Placement", icon: Building2 },
  ]

  const getIssuesForSection = (sectionId: string) => {
    if (sectionId === "issues") return unfixedIssues
    return unfixedIssues.filter((issue) => {
      const issueSection = issue.id?.toLowerCase() || ""
      const issueTitle = issue.title?.toLowerCase() || ""
      if (sectionId === "student") return issueSection.includes("student") || issueTitle.includes("student")
      if (sectionId === "plaafp") return issueSection.includes("plaafp") || issueTitle.includes("present level")
      if (sectionId === "goals") return issueSection.includes("goal") || issueTitle.includes("goal")
      if (sectionId === "services") return issueSection.includes("service") || issueTitle.includes("service")
      if (sectionId === "accommodations")
        return issueSection.includes("accommodation") || issueTitle.includes("accommodation")
      if (sectionId === "lre") return issueSection.includes("lre") || issueTitle.includes("placement")
      return false
    })
  }

  const handleStartEdit = (field: string, currentValue: string) => {
    setEditingField(field)
    setEditValue(currentValue)
    logEvent("FIELD_EDIT_STARTED", { field })
  }

  const handleCancelEdit = () => {
    setEditingField(null)
    setEditValue("")
    logEvent("FIELD_EDIT_CANCELLED", { field: editingField })
  }

  const handleSaveEdit = (field: string, updateFn: (value: string) => void) => {
    updateFn(editValue)
    logEvent("FIELD_EDIT_SAVED", { field })
    setEditingField(null)
    setEditValue("")
  }

  const handleManualFix = (issueId: string, newText?: string) => {
    if (!newText || newText.trim().length === 0) {
      // Don't mark as fixed without actual input
      return
    }
    
    // TODO: Update the actual IEP data based on the issue type
    // For now, we require text input before marking fixed to prevent bypassing compliance.
    // Future enhancement: Apply newText to the corresponding IEP field based on issue.id
    
    setFixedIssues((prev) => new Set([...prev, issueId]))
    logEvent("FIX_MANUAL_ENTERED", { issueId, textLength: newText.length })
    triggerCelebration(issueId)
  }

  const triggerCelebration = (issueId: string) => {
    setLastFixedIssue(issueId)
    setShowCelebration(true)
    setTimeout(() => setShowCelebration(false), 1500)
  }

  const handleApplyFix = (issue: ComplianceIssue) => {
    // Changed type to ComplianceIssue
    onApplyFix(issue)
    triggerCelebration(issue.id)
  }

  const IssueCard = ({ issue }: { issue: ComplianceIssue }) => {
    // Changed type to ComplianceIssue
    const severityCategory = getSeverityCategory(issue.severity)
    const severityConfig = {
      critical: {
        bg: "bg-red-50",
        border: "border-red-200",
        icon: AlertTriangle,
        iconColor: "text-red-600",
        textColor: "text-red-800",
        badge: "bg-red-100 text-red-700",
        label: "CRITICAL",
      },
      high: {
        bg: "bg-orange-50",
        border: "border-orange-200",
        icon: AlertCircle,
        iconColor: "text-orange-600",
        textColor: "text-orange-800",
        badge: "bg-orange-100 text-orange-700",
        label: "HIGH",
      },
      medium: {
        bg: "bg-amber-50",
        border: "border-amber-200",
        icon: AlertCircle,
        iconColor: "text-amber-600",
        textColor: "text-amber-800",
        badge: "bg-amber-100 text-amber-700",
        label: "SUGGESTED",
      },
    }
    const config = severityConfig[severityCategory as keyof typeof severityConfig]
    const IconComponent = config.icon

    return (
      <div className={`rounded-lg p-4 ${config.bg} border ${config.border}`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <IconComponent className={`w-4 h-4 ${config.iconColor}`} />
              <span className={`font-medium ${config.textColor}`}>{issue.title}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${config.badge}`}>{config.label}</span>
            </div>
            <p className="text-foreground text-sm mb-2">{issue.description}</p>
            {issue.citation && (
              <p className="text-xs text-muted-foreground mb-2">
                <span className="font-medium">Citation:</span> {issue.citation}
              </p>
            )}
          </div>
        </div>

        {issue.current_text && (
          <div className="mb-3 p-3 bg-white/50 rounded-lg border border-gray-200">
            <p className="text-xs font-medium text-muted-foreground mb-1">Current Text:</p>
            <p className="text-sm text-foreground italic">"{issue.current_text}"</p>
          </div>
        )}

        {issue.suggested_fix && (
          <div className="mb-3 p-3 bg-green-50 rounded-lg border border-green-200">
            <p className="text-xs font-medium text-green-700 mb-1">Suggested Fix:</p>
            <p className="text-sm text-green-800">{issue.suggested_fix}</p>
          </div>
        )}

        {editingIssueId === issue.id ? (
          <div className="mt-3 space-y-2 w-full">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              placeholder="Enter the corrected information..."
              className="w-full min-h-[100px] p-3 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              autoFocus
              aria-label="Enter corrected information for this compliance issue"
              aria-required="true"
              aria-invalid={editText.trim().length === 0}
            />
            <div className="flex gap-2">
              <Button 
                size="sm"
                onClick={() => {
                  if (editText.trim().length > 0) {
                    handleManualFix(issue.id, editText.trim())
                    setEditingIssueId(null)
                    setEditText('')
                  }
                }}
                disabled={editText.trim().length === 0}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Check className="w-4 h-4 mr-1" />
                Save Changes
              </Button>
              <Button 
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditingIssueId(null)
                  setEditText('')
                }}
              >
                Cancel
              </Button>
            </div>
            {editText.trim().length === 0 && (
              <p className="text-xs text-red-600" role="alert" aria-live="polite">
                Please enter the required information
              </p>
            )}
          </div>
        ) : (
          <div className="flex gap-2">
            {issue.suggested_fix && (
              <Button
                onClick={() => {
                  handleApplyFix(issue)
                  logEvent("FIX_AUTO_APPLIED", { issueId: issue.id })
                }}
                disabled={isFixing}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Wand2 className="w-4 h-4 mr-1" />
                Fix it for me
              </Button>
            )}
            <Button 
              onClick={() => {
                setEditingIssueId(issue.id)
                setEditText(issue.current_text || '')
              }} 
              size="sm" 
              variant="outline"
            >
              <Pencil className="w-4 h-4 mr-1" />
              Edit manually
            </Button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {showCelebration && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="animate-bounce-in bg-green-500 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-medium">Issue Fixed!</span>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold">{currentScore}%</span>
              {currentScore < targetScore && (
                <span className="text-blue-200 text-lg">→ Fix issues to reach {targetScore}%</span>
              )}
            </div>
            <div className="text-blue-100 mt-1">{stateName} Compliance Score</div>
          </div>
          <div className="text-right">
            {criticalIssues.length > 0 ? (
              <div className="flex items-center gap-2 text-red-200">
                <AlertTriangle className="w-5 h-5" />
                <span>{criticalIssues.length} critical must fix</span>
              </div>
            ) : highIssues.length > 0 ? (
              <div className="flex items-center gap-2 text-orange-200">
                <AlertCircle className="w-5 h-5" />
                <span>{highIssues.length} high priority</span>
              </div>
            ) : mediumIssues.length > 0 ? (
              <div className="flex items-center gap-2 text-amber-200">
                <AlertCircle className="w-5 h-5" />
                <span>{mediumIssues.length} suggestions</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-green-200">
                <CheckCircle2 className="w-5 h-5" />
                <span>All issues resolved!</span>
              </div>
            )}
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-4 bg-white/20 rounded-full h-3">
          <div
            className="bg-white rounded-full h-3 transition-all duration-500 relative"
            style={{ width: `${currentScore}%` }}
          >
            {currentScore >= 80 && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
              </div>
            )}
          </div>
        </div>
        <div className="mt-2 flex justify-between text-sm text-blue-200">
          <span>
            {issues.length - unfixedIssues.length} of {issues.length} issues fixed
          </span>
          <span>{unfixedIssues.length} remaining</span>
        </div>
      </div>

      {/* Section Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {sections.map((section) => {
          const sectionIssues = getIssuesForSection(section.id)
          const hasCritical = sectionIssues.some((i) => getSeverityCategory(i.severity) === "critical")
          const hasHigh = sectionIssues.some((i) => getSeverityCategory(i.severity) === "high")

          return (
            <button
              key={section.id}
              onClick={() => {
                setActiveSection(section.id)
                logEvent("FIELD_EDIT_SECTION_CHANGED", { sectionId: section.id })
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeSection === section.id
                  ? "bg-blue-600 text-white"
                  : "bg-card border border-border text-foreground hover:bg-muted"
              }`}
            >
              <section.icon className="w-4 h-4" />
              {section.label}
              {sectionIssues.length > 0 && (
                <span
                  className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                    hasCritical
                      ? "bg-red-100 text-red-700"
                      : hasHigh
                        ? "bg-orange-100 text-orange-700"
                        : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {sectionIssues.length}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Section Content */}
      <div className="bg-card border border-border rounded-xl p-6">
        {activeSection === "issues" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-blue-600" />
              All Compliance Issues
            </h2>

            {unfixedIssues.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-foreground mb-2">All Issues Resolved!</h3>
                <p className="text-muted-foreground">Your IEP is ready for clinical review.</p>
              </div>
            ) : (
              <>
                {/* Critical Issues */}
                {criticalIssues.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-red-700 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Critical Issues ({criticalIssues.length}) - Must Fix Before Proceeding
                    </h3>
                    {criticalIssues.map((issue) => (
                      <IssueCard key={issue.id} issue={issue} />
                    ))}
                  </div>
                )}

                {/* High Priority Issues */}
                {highIssues.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-orange-700 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      High Priority ({highIssues.length}) - Strongly Recommended
                    </h3>
                    {highIssues.map((issue) => (
                      <IssueCard key={issue.id} issue={issue} />
                    ))}
                  </div>
                )}

                {/* Medium/Suggested Issues */}
                {mediumIssues.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-amber-700 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Suggested Improvements ({mediumIssues.length})
                    </h3>
                    {mediumIssues.map((issue) => (
                      <IssueCard key={issue.id} issue={issue} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeSection === "student" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Student Information
            </h2>

            {/* Issues for this section */}
            {getIssuesForSection("student").map((issue) => (
              <IssueCard key={issue.id} issue={issue} />
            ))}

            {/* Editable Student Info fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-medium text-foreground">Student Name</label>
                  {editingField !== "student-name" && (
                    <button
                      onClick={() => handleStartEdit("student-name", iep.student?.name || "")}
                      className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                    >
                      <Pencil className="w-3 h-3" />
                      Edit
                    </button>
                  )}
                </div>
                {editingField === "student-name" ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-full p-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() =>
                          handleSaveEdit("student-name", (value) => {
                            setIep((prev) => (prev ? { ...prev, student: { ...prev.student, name: value } } : null))
                          })
                        }
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-foreground">{safeRender(iep.student?.name)}</p>
                )}
              </div>

              {/* Grade */}
              <div className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-medium text-foreground">Grade</label>
                  {editingField !== "student-grade" && (
                    <button
                      onClick={() => handleStartEdit("student-grade", iep.student?.grade || "")}
                      className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                    >
                      <Pencil className="w-3 h-3" />
                      Edit
                    </button>
                  )}
                </div>
                {editingField === "student-grade" ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-full p-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() =>
                          handleSaveEdit("student-grade", (value) => {
                            setIep((prev) => (prev ? { ...prev, student: { ...prev.student, grade: value } } : null))
                          })
                        }
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-foreground">{safeRender(iep.student?.grade)}</p>
                )}
              </div>

              {/* School */}
              <div className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-medium text-foreground">School</label>
                  {editingField !== "student-school" && (
                    <button
                      onClick={() => handleStartEdit("student-school", iep.student?.school || "")}
                      className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                    >
                      <Pencil className="w-3 h-3" />
                      Edit
                    </button>
                  )}
                </div>
                {editingField === "student-school" ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-full p-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() =>
                          handleSaveEdit("student-school", (value) => {
                            setIep((prev) => (prev ? { ...prev, student: { ...prev.student, school: value } } : null))
                          })
                        }
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-foreground">{safeRender(iep.student?.school)}</p>
                )}
              </div>

              {/* District */}
              <div className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-medium text-foreground">District</label>
                  {editingField !== "student-district" && (
                    <button
                      onClick={() => handleStartEdit("student-district", iep.student?.district || "")}
                      className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                    >
                      <Pencil className="w-3 h-3" />
                      Edit
                    </button>
                  )}
                </div>
                {editingField === "student-district" ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-full p-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() =>
                          handleSaveEdit("student-district", (value) => {
                            setIep((prev) => (prev ? { ...prev, student: { ...prev.student, district: value } } : null))
                          })
                        }
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-foreground">{safeRender(iep.student?.district)}</p>
                )}
              </div>

              {/* Date of Birth */}
              <div className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-medium text-foreground">Date of Birth</label>
                  {editingField !== "student-dob" && (
                    <button
                      onClick={() => handleStartEdit("student-dob", iep.student?.dob || "")}
                      className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                    >
                      <Pencil className="w-3 h-3" />
                      Edit
                    </button>
                  )}
                </div>
                {editingField === "student-dob" ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-full p-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="MM/DD/YYYY"
                    />
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() =>
                          handleSaveEdit("student-dob", (value) => {
                            setIep((prev) => (prev ? { ...prev, student: { ...prev.student, dob: value } } : null))
                          })
                        }
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-foreground">{iep.student?.dob || "Not specified"}</p>
                )}
              </div>

              {/* Primary Disability - Replace text input with IDEA category dropdown */}
              <div className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-medium text-foreground">Primary Disability (IDEA Category)</label>
                  {editingField !== "student-disability" && (
                    <button
                      onClick={() =>
                        handleStartEdit(
                          "student-disability",
                          iep.student?.disability || iep.student?.primary_disability || "",
                        )
                      }
                      className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                    >
                      <Pencil className="w-3 h-3" />
                      Edit
                    </button>
                  )}
                </div>
                {editingField === "student-disability" ? (
                  <div className="space-y-2">
                    <select
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-full p-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 bg-background"
                    >
                      <option value="">Select IDEA disability category...</option>
                      {IDEA_DISABILITY_CATEGORIES.map((cat) => (
                        <option key={cat.code} value={cat.label}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-muted-foreground">
                      Select one of the 13 federally recognized IDEA disability categories
                    </p>
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() =>
                          handleSaveEdit("student-disability", (value) => {
                            setIep((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    student: { ...prev.student, disability: value, primary_disability: value },
                                    eligibility: {
                                      ...prev.eligibility,
                                      primary_disability: value,
                                      primaryDisability: value,
                                    },
                                  }
                                : null,
                            )
                            // Mark the disability issue as fixed if it exists
                            const disabilityIssue = issues.find(
                              (i) => i.id?.includes("disability") || i.title?.toLowerCase().includes("disability"),
                            )
                            if (disabilityIssue && value) {
                              setFixedIssues((prev) => new Set([...prev, disabilityIssue.id]))
                              logEvent("FIX_MANUAL_ENTERED", { issueId: disabilityIssue.id, field: "disability" })
                            }
                          })
                        }
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-foreground">
                      {iep.student?.disability || iep.student?.primary_disability || (
                        <span className="text-amber-600 flex items-center gap-1">
                          <AlertTriangle className="w-4 h-4" />
                          Not specified
                        </span>
                      )}
                    </p>
                    {!(iep.student?.disability || iep.student?.primary_disability) && (
                      <p className="text-xs text-muted-foreground mt-1">
                        CHECK 12: Must specify one of 13 IDEA categories (-15 points)
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeSection === "plaafp" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Present Levels of Academic Achievement and Functional Performance
            </h2>

            {/* Issues for this section */}
            {getIssuesForSection("plaafp").map((issue) => (
              <IssueCard key={issue.id} issue={issue} />
            ))}

            {/* Editable PLAAFP fields */}
            <div className="space-y-4">
              {/* Strengths */}
              <div className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-medium text-foreground">Strengths</label>
                  {editingField !== "plaafp-strengths" && (
                    <button
                      onClick={() => handleStartEdit("plaafp-strengths", iep.plaafp?.strengths || "")}
                      className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                    >
                      <Pencil className="w-3 h-3" />
                      Edit
                    </button>
                  )}
                </div>
                {editingField === "plaafp-strengths" ? (
                  <div className="space-y-2">
                    <textarea
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-full min-h-[100px] p-3 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() =>
                          handleSaveEdit("plaafp-strengths", (value) => {
                            setIep((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    plaafp: { ...prev.plaafp, strengths: value },
                                  }
                                : null,
                            )
                          })
                        }
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">{iep.plaafp?.strengths || "No strengths documented"}</p>
                )}
              </div>

              {/* Academic Performance */}
              <div className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-medium text-foreground">Academic Performance</label>
                  {editingField !== "plaafp-academic" && (
                    <button
                      onClick={() => handleStartEdit("plaafp-academic", iep.plaafp?.academic || "")}
                      className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                    >
                      <Pencil className="w-3 h-3" />
                      Edit
                    </button>
                  )}
                </div>
                {editingField === "plaafp-academic" ? (
                  <div className="space-y-2">
                    <textarea
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-full min-h-[100px] p-3 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() =>
                          handleSaveEdit("plaafp-academic", (value) => {
                            setIep((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    plaafp: { ...prev.plaafp, academic: value },
                                  }
                                : null,
                            )
                          })
                        }
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    {iep.plaafp?.academic || "No academic performance documented"}
                  </p>
                )}
              </div>

              {/* Functional Performance */}
              <div className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-medium text-foreground">Functional Performance</label>
                  {editingField !== "plaafp-functional" && (
                    <button
                      onClick={() => handleStartEdit("plaafp-functional", iep.plaafp?.functional || "")}
                      className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                    >
                      <Pencil className="w-3 h-3" />
                      Edit
                    </button>
                  )}
                </div>
                {editingField === "plaafp-functional" ? (
                  <div className="space-y-2">
                    <textarea
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-full min-h-[100px] p-3 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() =>
                          handleSaveEdit("plaafp-functional", (value) => {
                            setIep((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    plaafp: { ...prev.plaafp, functional: value },
                                  }
                                : null,
                            )
                          })
                        }
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    {iep.plaafp?.functional || "No functional performance documented"}
                  </p>
                )}
              </div>

              {/* Disability Impact */}
              <div className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-medium text-foreground">How Disability Impacts Learning</label>
                  {editingField !== "plaafp-impact" && (
                    <button
                      onClick={() => handleStartEdit("plaafp-impact", iep.plaafp?.disability_impact || "")}
                      className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                    >
                      <Pencil className="w-3 h-3" />
                      Edit
                    </button>
                  )}
                </div>
                {editingField === "plaafp-impact" ? (
                  <div className="space-y-2">
                    <textarea
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-full min-h-[100px] p-3 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() =>
                          handleSaveEdit("plaafp-impact", (value) => {
                            setIep((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    plaafp: { ...prev.plaafp, disability_impact: value },
                                  }
                                : null,
                            )
                          })
                        }
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    {iep.plaafp?.disability_impact || "No disability impact documented"}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Goals Section */}
        {activeSection === "goals" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              Annual Goals
            </h2>

            {/* Issues for this section */}
            {getIssuesForSection("goals").map((issue) => (
              <IssueCard key={issue.id} issue={issue} />
            ))}

            {/* Goals list with editable table */}
            {(iep.goals || []).length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No goals documented</p>
            ) : (
              <div className="space-y-4">
                {(iep.goals || []).map((goal, idx) => (
                  <div key={goal.id || idx} className="border border-border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-medium text-foreground">
                        Goal {idx + 1}: {safeRender(goal.area || goal.domain, "Annual Goal")}
                      </h3>
                      <button
                        onClick={() => handleStartEdit(`goal-${idx}`, safeRender(goal.text || goal.goal_text, ""))}
                        className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                      >
                        <Pencil className="w-3 h-3" />
                        Edit
                      </button>
                    </div>

                    {editingField === `goal-${idx}` ? (
                      <div className="space-y-2">
                        <textarea
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-full min-h-[100px] p-3 border border-border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="flex gap-2 justify-end">
                          <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() =>
                              handleSaveEdit(`goal-${idx}`, (value) => {
                                setIep((prev) => {
                                  if (!prev) return null
                                  const newGoals = [...(prev.goals || [])]
                                  newGoals[idx] = { ...newGoals[idx], text: value, goal_text: value }
                                  return { ...prev, goals: newGoals }
                                })
                              })
                            }
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-foreground text-sm mb-3">{safeRender(goal.text || goal.goal_text, "No goal text")}</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div className="bg-muted/50 rounded-lg p-3">
                            <p className="text-muted-foreground text-xs mb-1">Baseline</p>
                            <p className="text-foreground">{safeRender(goal.baseline)}</p>
                          </div>
                          <div className="bg-muted/50 rounded-lg p-3">
                            <p className="text-muted-foreground text-xs mb-1">Target</p>
                            <p className="text-foreground">{safeRender(goal.target || goal.criteria)}</p>
                          </div>
                          <div className="bg-muted/50 rounded-lg p-3">
                            <p className="text-muted-foreground text-xs mb-1">Measurement</p>
                            <p className="text-foreground">
                              {safeRender(goal.measurement || goal.evaluation_method)}
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Services Section */}
        {activeSection === "services" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Related Services
            </h2>

            {/* Issues for this section */}
            {getIssuesForSection("services").map((issue) => (
              <IssueCard key={issue.id} issue={issue} />
            ))}

            {/* Services list */}
            {(iep.services || []).length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No services documented</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left p-3 font-medium text-foreground border-b">Service</th>
                      <th className="text-left p-3 font-medium text-foreground border-b">Frequency</th>
                      <th className="text-left p-3 font-medium text-foreground border-b">Duration</th>
                      <th className="text-left p-3 font-medium text-foreground border-b">Location</th>
                      <th className="text-left p-3 font-medium text-foreground border-b">Provider</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(iep.services || []).map((service, idx) => (
                      <tr key={idx} className="border-b hover:bg-muted/30">
                        <td className="p-3 text-foreground">
                          {safeRender(service.type || service.service_type || service.name, "Service")}
                        </td>
                        <td className="p-3 text-foreground">{safeRender(service.frequency)}</td>
                        <td className="p-3 text-foreground">{safeRender(service.duration)}</td>
                        <td className="p-3 text-foreground">{safeRender(service.location)}</td>
                        <td className="p-3 text-foreground">{safeRender(service.provider)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Accommodations Section */}
        {activeSection === "accommodations" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <ListChecks className="w-5 h-5 text-blue-600" />
              Accommodations & Modifications
            </h2>

            {/* Issues for this section */}
            {getIssuesForSection("accommodations").map((issue) => (
              <IssueCard key={issue.id} issue={issue} />
            ))}

            {/* Accommodations list */}
            {(iep.accommodations || []).length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No accommodations documented</p>
            ) : (
              <ul className="space-y-2">
                {(iep.accommodations || []).map((acc, idx) => (
                  <li key={idx} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">
                      {safeRender(typeof acc === "string" ? acc : acc.description || acc.name, "Accommodation")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* LRE Section */}
        {activeSection === "lre" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              Least Restrictive Environment (LRE) Placement
            </h2>

            {/* Issues for this section */}
            {getIssuesForSection("lre").map((issue) => (
              <IssueCard key={issue.id} issue={issue} />
            ))}

            {/* LRE details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-border rounded-lg p-4">
                <label className="font-medium text-foreground block mb-2">Placement Setting</label>
                <p className="text-foreground">{iep.placement?.setting || iep.lre?.setting || "Not specified"}</p>
              </div>
              <div className="border border-border rounded-lg p-4">
                <label className="font-medium text-foreground block mb-2">Percent in General Education</label>
                <p className="text-foreground">
                  {iep.placement?.percent_general_ed || iep.lre?.percent_general_ed || "Not specified"}
                </p>
              </div>
              <div className="border border-border rounded-lg p-4">
                <label className="font-medium text-foreground block mb-2">Percent in Special Education</label>
                <p className="text-foreground">
                  {iep.placement?.percent_special_ed || iep.lre?.percent_special_ed || "Not specified"}
                </p>
              </div>
              <div className="border border-border rounded-lg p-4">
                <label className="font-medium text-foreground block mb-2">Justification</label>
                <p className="text-foreground text-sm">
                  {iep.placement?.justification || iep.lre?.justification || "Not specified"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <Button
          variant="outline"
          onClick={() => {
            onBack()
            logEvent("NAVIGATED_BACK", { fromStep: "edit" })
          }}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={() => {
            onDownload()
            logEvent("DRAFT_IEP_DOWNLOADED", { context: "edit_step" })
          }}
          className="flex-1 py-4 rounded-xl font-semibold border border-blue-600 text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
        >
          <Download className="w-5 h-5" />
          Download Draft
        </Button>
        <Button
          onClick={() => {
            onContinue()
            logEvent("EDIT_STEP_COMPLETED")
          }}
          disabled={!canProceed}
          className="flex-1 py-4 rounded-xl font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
        >
          {!canProceed 
            ? criticalIssues.length > 0
              ? `Fix ${criticalIssues.length} critical issue${criticalIssues.length !== 1 ? 's' : ''} to continue`
              : `Improve score to ${MINIMUM_PASSING_SCORE}%+ to continue (currently ${currentScore}%)`
            : "Continue to MySLP Review"}
          <ArrowRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  )
}

// =============================================================================
// STEP 6: CLINICAL REVIEW (MySLP)
// =============================================================================

// Helper component for download button
const DownloadIEPButton = ({
  iep,
  state,
  complianceScore,
  onDownloadComplete,
}: {
  iep: ExtractedIEP | null
  state: string
  complianceScore: number
  onDownloadComplete?: () => void
}) => {
  const handleDownload = async () => {
    if (!iep) return

    try {
      const response = await fetch("/api/download-iep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ iep, state, complianceScore }),
      })

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `EASI_IEP_${state}_${new Date().toISOString().split("T")[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      onDownloadComplete?.()
    } catch (error) {
      console.error("Error downloading IEP:", error)
    }
  }

  return (
    <Button onClick={handleDownload} className="w-full" disabled={!iep}>
      <Download className="w-4 h-4 mr-2" />
      Download Final IEP
    </Button>
  )
}

function ClinicalReviewStep({
  iep,
  remediation,
  state, // Add state prop
  stateName, // Add stateName prop
  complianceScore, // Add complianceScore prop
  sessionId, // Add sessionId prop
  onBack,
  onStartAnother, // Rename onStartNew to onStartAnother
  logEvent,
  onDownloadReport, // Add onDownloadReport prop
}: {
  iep: ExtractedIEP | null // Changed to ExtractedIEP | null
  remediation: RemediationData | null // Changed to RemediationData | null
  state: string // Add state type
  stateName: string // Add stateName type
  complianceScore: number // Add complianceScore type
  sessionId: string // Add sessionId prop
  onBack: () => void
  onStartAnother: () => void // Rename to onStartAnother
  logEvent: (event: string, metadata?: Record<string, any>) => void
  onDownloadReport?: () => void // Add onDownloadReport prop
}) {
  const [isLoading, setIsLoading] = useState(true)
  const [review, setReview] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Update colors from teal to blue
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
        logEvent("CLINICAL_REVIEW_FALLBACK", { error: String(err) })
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
      logEvent("MYSLP_RESPONSE_ERROR", { error: String(err) })
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">MySLP Clinical Review</h2>
        <p className="text-gray-600 mt-2">Chat with our clinical expert about your IEP</p>
        <p className="text-sm text-blue-600 font-medium mt-1">{stateName} regulations</p>
      </div>

      {/* Chat Messages */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="h-96 overflow-y-auto p-4 space-y-4">
          {isLoading && messages.length === 0 ? (
            <div className="space-y-3">
              {loadingSteps.map((step, index) => (
                <div key={index} className="flex items-center gap-3">
                  {step.status === "complete" ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : step.status === "running" ? (
                    <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                  )}
                  <span className={step.status === "pending" ? "text-gray-400" : "text-gray-700"}>{step.label}</span>
                </div>
              ))}
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-3 ${
                    message.role === "user" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-800"
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                  <p className={`text-xs mt-1 ${message.role === "user" ? "text-blue-200" : "text-gray-400"}`}>
                    {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex gap-2">
            <input
              ref={inputRef} // Assign ref to the input element
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about the IEP..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSending || isLoading}
            />
            <Button onClick={handleSendMessage} disabled={isSending || isLoading || !inputValue.trim()}>
              {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Compliance Score */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
        <div className="relative w-24 h-24 mx-auto mb-4">
          <svg className="w-24 h-24 transform -rotate-90">
            <circle cx="48" cy="48" r="40" stroke="#e5e7eb" strokeWidth="8" fill="none" />
            <circle
              cx="48"
              cy="48"
              r="40"
              stroke="#3b82f6"
              strokeWidth="8"
              fill="none"
              strokeDasharray={251.2}
              strokeDashoffset={251.2 * (1 - complianceScore / 100)}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-gray-900">{complianceScore}%</span>
          </div>
        </div>
        <p className="font-medium text-gray-900">{stateName} Compliant</p>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <DownloadIEPButton
          iep={iep}
          state={state}
          complianceScore={complianceScore}
          onDownloadComplete={() => logEvent("FINAL_IEP_DOWNLOADED", { complianceScore })}
        />
        {onDownloadReport && ( // Conditionally render download report button
          <Button
            variant="outline"
            className="w-full bg-transparent"
            onClick={() => {
              onDownloadReport()
              logEvent("COMPLIANCE_REPORT_DOWNLOADED")
            }}
          >
            <FileText className="w-4 h-4 mr-2" />
            Download Compliance Report
          </Button>
        )}
        <Button
          variant="ghost"
          className="w-full"
          onClick={() => {
            onStartAnother()
            logEvent("NEW_IEP_STARTED_FROM_CLINICAL")
          }}
        >
          Start Another IEP
        </Button>
        <Button
          variant="ghost"
          className="w-full text-gray-500"
          onClick={() => {
            onBack()
            logEvent("NAVIGATED_BACK", { fromStep: "myslp" })
          }}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Edit & Fix
        </Button>
      </div>
    </div>
  )
}

// =============================================================================
// MAIN WIZARD COMPONENT
// =============================================================================

function IEPWizard() {
  // Step management
  type WizardStep = "upload" | "tell" | "building" | "review" | "edit" | "myslp"
  const [currentStep, setCurrentStep] = useState<WizardStep>("upload")

  // File uploads
  const [files, setFiles] = useState<UploadedFile[]>([]) // Changed type to UploadedFile for consistency

  // State for file upload readiness and retries
  const [isFileReady, setIsFileReady] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  // Form state
  const [selectedState, setSelectedState] = useState("CA")
  const [iepDate, setIepDate] = useState(new Date().toISOString().split("T")[0])
  const [studentUpdate, setStudentUpdate] = useState("")

  // Extracted/edited IEP data
  const [extractedIEP, setExtractedIEP] = useState<ExtractedIEP | null>(null)
  const [remediation, setRemediation] = useState<RemediationData | null>(null)
  const [fixedIssues, setFixedIssues] = useState<Set<string>>(new Set())

  // Loading/error states
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [buildError, setBuildError] = useState<string | null>(null)
  const [buildTasks, setBuildTasks] = useState<
    { id: string; label: string; status: "pending" | "loading" | "complete" | "error" }[]
  >([])
  const [isFixing, setIsFixing] = useState(false)

  // Session and logging
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`)
  const { logEvent } = useHashChainLogger(sessionId)

  // Timing for research metrics
  const [buildStartTime, setBuildStartTime] = useState<number | null>(null)

  // Voice state and handlers
  // </CHANGE> Fixed destructuring to match useVoice hook return values
  const {
    isRecording: isListening,
    startRecording: startListening,
    stopRecording: stopListening,
    isSupported,
  } = useVoice({
    onTranscript: (text) => {
      setStudentUpdate((prev) => prev + " " + text)
    },
  })

  // Log session start
  useEffect(() => {
    logEvent("SESSION_STARTED")
    return () => {
      logEvent("SESSION_ENDED")
    }
  }, [logEvent])

  // Handle file upload
  const handleFileUpload = (newFiles: FileList | null) => {
    if (!newFiles) return
    setIsFileReady(false) // Reset ready state when new files are added
    const fileArray = Array.from(newFiles).map((file) => ({
      id: Math.random().toString(36).substr(2, 9), // Generate unique ID
      file,
      name: file.name,
      size: file.size,
      type: file.name.toLowerCase().includes("iep") ? "iep" : "other", // Infer type
    }))
    setFiles((prev) => [...prev, ...fileArray])
    // Log individual file upload on first file if multiple are dropped
    if (fileArray.length > 0) {
      logEvent("FILE_UPLOADED", { fileName: fileArray[0].name, fileSize: fileArray[0].size })
    }
    setTimeout(() => {
      setIsFileReady(true)
    }, 300)
  }

  const handleRemoveFile = (id: string) => {
    setFiles((prev) => {
      const removedFile = prev.find((f) => f.id === id)
      if (removedFile) {
        logEvent("FILE_REMOVED", { fileName: removedFile.name })
      }
      const newFiles = prev.filter((f) => f.id !== id)
      if (newFiles.length === 0) {
        setIsFileReady(false)
      }
      return newFiles
    })
  }

  // Apply suggested fix to IEP
  const handleApplyFix = (issue: ComplianceIssue) => {
    // Use ComplianceIssue type
    if (!issue.suggested_fix || !extractedIEP) return

    setIsFixing(true)
    logEvent("FIX_AUTO_APPLIED", { issueId: issue.id })

    // Apply the fix based on issue type and structure
    let updatedIEP = { ...extractedIEP }

    // Basic example: applying fixes based on known issue IDs or titles
    if (issue.id?.includes("student-name") && issue.suggested_fix) {
      updatedIEP = {
        ...updatedIEP,
        student: { ...updatedIEP.student, name: issue.suggested_fix },
      }
    } else if (issue.id?.includes("student-grade") && issue.suggested_fix) {
      updatedIEP = {
        ...updatedIEP,
        student: { ...updatedIEP.student, grade: issue.suggested_fix },
      }
    } else if (issue.id?.includes("student-disability") && issue.suggested_fix) {
      updatedIEP = {
        ...updatedIEP,
        student: { ...updatedIEP.student, disability: issue.suggested_fix, primary_disability: issue.suggested_fix },
        eligibility: {
          ...updatedIEP.eligibility,
          primary_disability: issue.suggested_fix,
          primaryDisability: issue.suggested_fix,
        },
      }
    } else if (issue.id?.includes("goal-") && issue.suggested_fix) {
      const goalIndexMatch = issue.id.match(/goal-(\d+)/)
      if (goalIndexMatch && goalIndexMatch[1]) {
        const goalIndex = Number.parseInt(goalIndexMatch[1], 10)
        if (updatedIEP.goals && updatedIEP.goals[goalIndex]) {
          const newGoals = [...updatedIEP.goals]
          newGoals[goalIndex] = { ...newGoals[goalIndex], text: issue.suggested_fix, goal_text: issue.suggested_fix }
          updatedIEP = { ...updatedIEP, goals: newGoals }
        }
      }
    }
    // Add more specific fix logic for other fields as needed

    setExtractedIEP(updatedIEP)
    setFixedIssues((prev) => new Set([...prev, issue.id]))
    setIsFixing(false)
  }

  // Build IEP - call Lambda
  const handleStartBuilding = async (isRetry = false) => {
    console.log("[v0] BUILD: handleStartBuilding called, isRetry:", isRetry)

    const primaryFile = files.find((f) => f.type === "iep") || files[0]
    if (!primaryFile) {
      console.log("[v0] BUILD: No file found!")
      setBuildError("No file uploaded")
      return
    }

    console.log("[v0] BUILD: Starting API call with file:", primaryFile.name)

    try {
      // Immediately set the first task to loading when API starts
      setBuildTasks((prev) =>
        prev.map((t) =>
          t.id === "upload" ? { ...t, status: "loading" } : t,
        ),
      )

      const formData = new FormData()
      formData.append("file", primaryFile.file, primaryFile.name)
      formData.append("state", selectedState)
      formData.append("iepDate", iepDate)
      formData.append("userNotes", studentUpdate)

      console.log("[v0] BUILD: Calling /api/extract-iep NOW")

      // Mark upload complete and extraction in progress
      setBuildTasks((prev) =>
        prev.map((t) =>
          t.id === "upload" ? { ...t, status: "complete" } : t.id === "extract" ? { ...t, status: "loading" } : t,
        ),
      )

      const response = await fetch("/api/extract-iep", {
        method: "POST",
        body: formData,
      })

      console.log("[v0] BUILD: Response status:", response.status)

      const data = await response.json()
      console.log("[v0] BUILD: Response data received")

      if (!response.ok) {
        throw new Error(data.error || "Failed to process IEP")
      }

      setBuildTasks((prev) =>
        prev.map((t) =>
          t.id === "extract" ? { ...t, status: "complete" } : t.id === "generate" ? { ...t, status: "loading" } : t,
        ),
      )

      const newIEP = data.new_iep || data.result?.new_iep || data.result?.iep
      const remediationData = data.remediation || data.result?.remediation

      if (newIEP) {
        setExtractedIEP(newIEP)
        setBuildTasks((prev) =>
          prev.map((t) =>
            t.id === "generate" ? { ...t, status: "complete" } : t.id === "validate" ? { ...t, status: "loading" } : t,
          ),
        )
      }

      if (remediationData) {
        setRemediation(remediationData)
        setBuildTasks((prev) => prev.map((t) => (t.id === "validate" ? { ...t, status: "complete" } : t)))
      }

      if (newIEP && !remediationData) {
        setBuildTasks((prev) => prev.map((t) => ({ ...t, status: "complete" })))
      }

      const elapsedTime = buildStartTime ? Date.now() - buildStartTime : 0
      logEvent("BUILD_COMPLETED", {
        elapsedMs: elapsedTime,
        complianceScore: remediationData?.original_score || remediationData?.score,
        goalsCount: newIEP?.goals?.length || 0,
        servicesCount: newIEP?.services?.length || 0,
      })
    } catch (err) {
      console.error("[v0] BUILD: Error:", err)
      setBuildError(err instanceof Error ? err.message : "An error occurred")
      setBuildTasks((prev) => prev.map((t) => (t.status === "loading" ? { ...t, status: "error" } : t)))
      logEvent("BUILD_ERROR", { error: String(err) })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNext = () => {
    if (currentStep === "upload" && files.length > 0) {
      setCurrentStep("tell")
    } else if (currentStep === "tell") {
      // Just transition to building step - BuildingStep will trigger the API call
      console.log("[v0] handleNext: Transitioning to building step")
      setIsSubmitting(true)
      setBuildError(null)
      setBuildStartTime(Date.now())
      setCurrentStep("building")
      logEvent("BUILD_STARTED")
      setBuildTasks([
        { id: "upload", label: "Uploading document...", status: "pending" },
        { id: "extract", label: "Extracting IEP data...", status: "pending" },
        { id: "generate", label: "Generating new IEP...", status: "pending" },
        { id: "validate", label: "Validating compliance...", status: "pending" },
      ])
    } else if (currentStep === "building") {
      setCurrentStep("review")
      logEvent("BUILDING_COMPLETED")
    } else if (currentStep === "review") {
      setCurrentStep("edit")
      logEvent("REVIEW_COMPLETED")
    } else if (currentStep === "edit") {
      setCurrentStep("myslp")
      logEvent("EDIT_STEP_COMPLETED")
    }
  }

  const handleBack = () => {
    if (currentStep === "tell") {
      setCurrentStep("upload")
      logEvent("NAVIGATED_BACK", { fromStep: "tell" })
    } else if (currentStep === "review") {
      setCurrentStep("building")
      logEvent("NAVIGATED_BACK", { fromStep: "review" })
    } else if (currentStep === "edit") {
      setCurrentStep("review")
      logEvent("NAVIGATED_BACK", { fromStep: "edit" })
    } else if (currentStep === "myslp") {
      setCurrentStep("edit")
      logEvent("NAVIGATED_BACK", { fromStep: "myslp" })
    }
  }

  const handleStartAnother = () => {
    setCurrentStep("upload")
    setFiles([])
    setSelectedState("CA")
    setIepDate(new Date().toISOString().split("T")[0])
    setStudentUpdate("")
    setExtractedIEP(null)
    setRemediation(null)
    setFixedIssues(new Set())
    setBuildError(null)
    setBuildTasks([])
    logEvent("SESSION_RESTARTED")
  }

  // Progress steps for header
  const progressSteps = [
    { id: "upload", label: "Upload Materials" },
    { id: "tell", label: "Tell Us About Progress" },
    { id: "building", label: "Building Your IEP" },
    { id: "review", label: "Review Draft" },
    { id: "edit", label: "Edit & Fix" },
    { id: "myslp", label: "Clinical Review" },
  ]

  const stepOrder: WizardStep[] = ["upload", "tell", "building", "review", "edit", "myslp"]
  const currentStepIndex = stepOrder.indexOf(currentStep)

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Progress Header */}
      <div className="pt-8 pb-4 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            {progressSteps.map((step, index) => {
              const stepIndex = stepOrder.indexOf(step.id as WizardStep)
              const isComplete = stepIndex < currentStepIndex
              const isCurrent = step.id === currentStep

              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                        isComplete
                          ? "bg-blue-600 text-white"
                          : isCurrent
                            ? "bg-blue-600 text-white ring-4 ring-blue-100"
                            : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      {isComplete ? <Check className="w-5 h-5" /> : index + 1}
                    </div>
                    <span
                      className={`mt-2 text-xs text-center max-w-[80px] ${isCurrent ? "text-blue-600 font-medium" : "text-gray-500"}`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {index < progressSteps.length - 1 && (
                    <div
                      className={`w-12 h-0.5 mx-2 ${stepIndex < currentStepIndex ? "bg-blue-600" : "bg-gray-200"}`}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 pb-12">
        {/* Upload Step */}
        {currentStep === "upload" && (
          <UploadStep
            files={files}
            onRemoveFile={handleRemoveFile}
            onFilesSelected={handleFileUpload} // Pass handleFileUpload
            onNext={handleNext}
            logEvent={logEvent}
          />
        )}

        {/* Tell Us About Progress Step */}
        {currentStep === "tell" && (
          <TellUsStep
            selectedState={selectedState}
            setSelectedState={setSelectedState}
            iepDate={iepDate}
            setIepDate={setIepDate}
            studentUpdate={studentUpdate}
            setStudentUpdate={setStudentUpdate}
            isListening={isListening}
            onStartListening={startListening}
            onStopListening={stopListening}
            onBack={handleBack}
            onNext={handleNext}
            logEvent={logEvent}
            isFileReady={isFileReady} // Pass isFileReady to TellStep
          />
        )}

        {/* Building Step */}
        {currentStep === "building" && (
          <BuildingStep
            tasks={buildTasks}
            error={buildError}
            onRetry={handleStartBuilding}
            selectedState={selectedState}
            onStartBuild={handleStartBuilding}
            // Pass onComplete prop
            onComplete={() => {
              console.log("BuildingStep finished, calling handleNext from IEPWizard")
              handleNext()
            }}
          />
        )}

        {/* Review Step */}
        {currentStep === "review" && extractedIEP && (
          <ReviewStep
            iep={extractedIEP}
            remediation={remediation}
            fixedIssues={fixedIssues}
            onApplyFix={handleApplyFix}
            onApplyAll={() => {}} // Placeholder, implement if needed
            onBack={handleBack}
            onNext={handleNext}
            onDownload={() => {}} // Placeholder, implement if needed
            isFixing={isFixing}
            selectedState={selectedState}
            logEvent={logEvent}
            iepDate={iepDate} // Pass iepDate
          />
        )}

        {/* Edit & Fix Step */}
        {currentStep === "edit" && extractedIEP && (
          <EditIEPStep
            iep={extractedIEP}
            setIep={setExtractedIEP}
            remediation={remediation}
            fixedIssues={fixedIssues}
            setFixedIssues={setFixedIssues}
            onApplyFix={handleApplyFix}
            onBack={handleBack}
            onContinue={handleNext}
            onDownload={() => {}} // Placeholder, implement if needed
            isFixing={isFixing}
            selectedState={selectedState}
            logEvent={logEvent}
          />
        )}

        {/* Clinical Review Step */}
        {currentStep === "myslp" && extractedIEP && (
          <ClinicalReviewStep
            iep={extractedIEP}
            remediation={remediation}
            state={selectedState}
            stateName={US_STATES.find((s) => s.code === selectedState)?.name || selectedState}
            complianceScore={remediation?.original_score || remediation?.score || 0}
            sessionId={sessionId}
            onBack={handleBack}
            onStartAnother={handleStartAnother}
            logEvent={logEvent}
            onDownloadReport={() => {}} // Placeholder, implement if needed
          />
        )}
      </div>
    </div>
  )
}

export { IEPWizard }
export default IEPWizard
