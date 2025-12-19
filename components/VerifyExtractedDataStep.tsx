"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { 
  CheckCircle2, 
  Edit, 
  ArrowLeft, 
  ArrowRight, 
  Mic, 
  MicOff,
  User,
  FileText,
  Target,
  Users,
  ListChecks,
  ChevronDown,
  ChevronUp,
  Calculator
} from "lucide-react"
import { useVoice } from "@/hooks/use-voice"
import { 
  calculateAge, 
  calculateNextAnnualReview, 
  calculateCurrentGrade,
  calculateServiceMinutesTotals,
  formatServiceMinutes
} from "@/utils/iep-calculations"

// =============================================================================
// TYPES
// =============================================================================

interface ExtractedIEP {
  student?: {
    name?: string
    dob?: string
    date_of_birth?: string
    age?: string
    grade?: string
    school?: string
    district?: string
    disability?: string
    primary_disability?: string
  }
  eligibility?: {
    primary_disability?: string
    primaryDisability?: string
    secondary_disability?: string
    secondaryDisability?: string
  }
  plaafp?: {
    strengths?: string
    concerns?: string
    academic?: string
    functional?: string
    disability_impact?: string
    parent_input?: string
  }
  goals?: Array<{
    id: string
    area?: string
    goal_area?: string
    goal_text?: string
    description?: string
    text?: string
    baseline?: string
    target?: string
  }>
  services?: Array<{
    type?: string
    service_type?: string
    name?: string
    frequency?: string
    duration?: string
    provider?: string
    setting?: string
    location?: string
  }>
  accommodations?: (string | { description?: string; name?: string; text?: string })[]
}

interface SectionVerification {
  sectionId: string
  isVerified: boolean
  needsUpdate: boolean
  originalValue: string
  updatedValue?: string
}

interface VerifiedIEPData extends ExtractedIEP {
  verifications: SectionVerification[]
  calculatedAge?: number | null
  calculatedNextReviewDate?: string | null
  calculatedGrade?: string
  calculatedServiceMinutes?: number | null
}

interface VerifyExtractedDataStepProps {
  extractedIEP: ExtractedIEP | null
  iepDate: string
  onVerificationComplete: (verifiedData: VerifiedIEPData) => void
  onBack: () => void
  logEvent: (event: string, metadata?: Record<string, unknown>) => void
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

const safeRender = (value: unknown, fallback = "Not specified"): string => {
  if (value === null || value === undefined) return fallback
  if (typeof value === "string") return value
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  if (Array.isArray(value)) {
    return (
      value
        .map((v) => safeRender(v, ""))
        .filter(Boolean)
        .join(", ") || fallback
    )
  }
  if (typeof value === "object") {
    const vals = Object.values(value as Record<string, unknown>)
    if (vals.length === 0) return fallback
    return (
      vals
        .map((v) => safeRender(v, ""))
        .filter(Boolean)
        .join(", ") || fallback
    )
  }
  return String(value)
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function VerifyExtractedDataStep({
  extractedIEP,
  iepDate,
  onVerificationComplete,
  onBack,
  logEvent,
}: VerifyExtractedDataStepProps) {
  // State for section verifications
  const [verifications, setVerifications] = useState<Map<string, SectionVerification>>(new Map())
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")

  // Voice input state
  const [isListening, setIsListening] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { isSupported, toggleRecording } = useVoice({
    onTranscript: (text) => {
      setEditValue((prev) => prev + (prev ? " " : "") + text)
      logEvent("VOICE_TRANSCRIPT_ADDED_VERIFY", { length: text.length })
    },
  })

  // Calculate auto-populated fields
  const calculatedAge = calculateAge(extractedIEP?.student?.dob || extractedIEP?.student?.date_of_birth)
  const calculatedNextReviewDate = calculateNextAnnualReview(iepDate)
  const calculatedGrade = calculateCurrentGrade(extractedIEP?.student?.grade, iepDate)
  const calculatedServiceMinutes = calculateServiceMinutesTotals(extractedIEP?.services)

  // Student name for personalization
  const studentName = extractedIEP?.student?.name || "the student"

  // Toggle section expansion
  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId)
    } else {
      newExpanded.add(sectionId)
    }
    setExpandedSections(newExpanded)
  }

  // Handle "This is current" button
  const handleVerifyAsCurrent = (sectionId: string, value: string) => {
    const newVerifications = new Map(verifications)
    newVerifications.set(sectionId, {
      sectionId,
      isVerified: true,
      needsUpdate: false,
      originalValue: value,
    })
    setVerifications(newVerifications)
    logEvent("SECTION_VERIFIED_AS_CURRENT", { sectionId })
  }

  // Handle "Needs updates" button
  const handleNeedsUpdate = (sectionId: string, value: string) => {
    setEditingSection(sectionId)
    setEditValue(value)
    setExpandedSections(new Set([...expandedSections, sectionId]))
    logEvent("SECTION_NEEDS_UPDATE", { sectionId })
    
    // Focus textarea after state update
    setTimeout(() => {
      textareaRef.current?.focus()
    }, 100)
  }

  // Save edited value
  const handleSaveEdit = (sectionId: string) => {
    const newVerifications = new Map(verifications)
    const originalValue = getOriginalValue(sectionId)
    
    newVerifications.set(sectionId, {
      sectionId,
      isVerified: true,
      needsUpdate: true,
      originalValue,
      updatedValue: editValue,
    })
    setVerifications(newVerifications)
    setEditingSection(null)
    setEditValue("")
    logEvent("SECTION_UPDATE_SAVED", { sectionId })
  }

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingSection(null)
    setEditValue("")
  }

  // Toggle voice input
  const handleMicToggle = () => {
    if (isListening) {
      setIsListening(false)
      toggleRecording()
      logEvent("MIC_TOGGLED_VERIFY", { isRecording: false })
    } else {
      setIsListening(true)
      toggleRecording()
      logEvent("MIC_TOGGLED_VERIFY", { isRecording: true })
    }
  }

  // Get original value for a section
  const getOriginalValue = (sectionId: string): string => {
    if (!extractedIEP) return ""
    
    switch (sectionId) {
      case "student-name":
        return safeRender(extractedIEP.student?.name)
      case "student-dob":
        return safeRender(extractedIEP.student?.dob || extractedIEP.student?.date_of_birth)
      case "student-grade":
        return safeRender(extractedIEP.student?.grade)
      case "student-school":
        return safeRender(extractedIEP.student?.school)
      case "student-district":
        return safeRender(extractedIEP.student?.district)
      case "eligibility-primary":
        return safeRender(
          extractedIEP.eligibility?.primary_disability || 
          extractedIEP.eligibility?.primaryDisability ||
          extractedIEP.student?.disability ||
          extractedIEP.student?.primary_disability
        )
      case "plaafp-academic":
        return safeRender(extractedIEP.plaafp?.academic)
      case "plaafp-functional":
        return safeRender(extractedIEP.plaafp?.functional)
      case "plaafp-impact":
        return safeRender(extractedIEP.plaafp?.disability_impact)
      case "plaafp-strengths":
        return safeRender(extractedIEP.plaafp?.strengths)
      case "plaafp-parent":
        return safeRender(extractedIEP.plaafp?.parent_input)
      case "goals":
        return extractedIEP.goals?.map((g, i) => 
          `Goal ${i + 1}: ${safeRender(g.text || g.goal_text || g.description)}`
        ).join("\n") || ""
      case "services":
        return extractedIEP.services?.map((s, i) => 
          `${safeRender(s.type || s.service_type || s.name)} - ${safeRender(s.frequency)}, ${safeRender(s.duration)}`
        ).join("\n") || ""
      case "accommodations":
        return extractedIEP.accommodations?.map((a) => 
          safeRender(typeof a === "string" ? a : a.description || a.name || a.text)
        ).join("\n") || ""
      default:
        return ""
    }
  }

  // Get updated value for a section (either original or edited)
  const getDisplayValue = (sectionId: string): string => {
    const verification = verifications.get(sectionId)
    if (verification?.updatedValue) {
      return verification.updatedValue
    }
    return getOriginalValue(sectionId)
  }

  // Check if section is verified
  const isVerified = (sectionId: string): boolean => {
    return verifications.get(sectionId)?.isVerified || false
  }

  // Check if all required sections are verified
  const allRequiredSectionsVerified = (): boolean => {
    const requiredSections = [
      "student-name",
      "student-dob",
      "student-grade",
      "eligibility-primary",
      "plaafp-academic",
      "plaafp-functional",
      "goals",
      "services"
    ]
    
    return requiredSections.every(sectionId => isVerified(sectionId))
  }

  // Handle continue button
  const handleContinue = () => {
    if (!extractedIEP) return

    // Build verified data with all verifications and calculations
    const verifiedData: VerifiedIEPData = {
      ...extractedIEP,
      verifications: Array.from(verifications.values()),
      calculatedAge,
      calculatedNextReviewDate,
      calculatedGrade,
      calculatedServiceMinutes,
    }

    // Apply updates to the IEP data
    verifications.forEach((verification) => {
      if (verification.updatedValue) {
        const { sectionId, updatedValue } = verification
        
        // Apply the update based on section
        if (sectionId === "student-name" && verifiedData.student) {
          verifiedData.student.name = updatedValue
        } else if (sectionId === "student-grade" && verifiedData.student) {
          verifiedData.student.grade = updatedValue
        } else if (sectionId === "student-school" && verifiedData.student) {
          verifiedData.student.school = updatedValue
        } else if (sectionId === "student-district" && verifiedData.student) {
          verifiedData.student.district = updatedValue
        } else if (sectionId === "eligibility-primary") {
          if (verifiedData.eligibility) {
            verifiedData.eligibility.primary_disability = updatedValue
            verifiedData.eligibility.primaryDisability = updatedValue
          }
          if (verifiedData.student) {
            verifiedData.student.disability = updatedValue
            verifiedData.student.primary_disability = updatedValue
          }
        } else if (sectionId === "plaafp-academic" && verifiedData.plaafp) {
          verifiedData.plaafp.academic = updatedValue
        } else if (sectionId === "plaafp-functional" && verifiedData.plaafp) {
          verifiedData.plaafp.functional = updatedValue
        } else if (sectionId === "plaafp-impact" && verifiedData.plaafp) {
          verifiedData.plaafp.disability_impact = updatedValue
        } else if (sectionId === "plaafp-strengths" && verifiedData.plaafp) {
          verifiedData.plaafp.strengths = updatedValue
        } else if (sectionId === "plaafp-parent" && verifiedData.plaafp) {
          verifiedData.plaafp.parent_input = updatedValue
        }
        // Note: goals, services, and accommodations updates would need more complex handling
      }
    })

    // Apply calculated values
    if (calculatedAge !== null && verifiedData.student) {
      verifiedData.student.age = calculatedAge.toString()
    }
    if (calculatedGrade && verifiedData.student) {
      verifiedData.student.grade = calculatedGrade
    }

    logEvent("VERIFICATION_COMPLETED", { 
      sectionsVerified: verifications.size,
      sectionsUpdated: Array.from(verifications.values()).filter(v => v.needsUpdate).length
    })

    onVerificationComplete(verifiedData)
  }

  if (!extractedIEP) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 text-center">
        <p className="text-slate-600">No extracted IEP data available</p>
        <Button onClick={onBack} variant="outline" className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Back
        </Button>
      </div>
    )
  }

  // Section component
  const Section = ({ 
    id, 
    title, 
    icon: Icon, 
    content, 
    required = false 
  }: { 
    id: string
    title: string
    icon: React.ElementType
    content: string
    required?: boolean
  }) => {
    const verified = isVerified(id)
    const isExpanded = expandedSections.has(id)
    const isEditing = editingSection === id

    return (
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
        {/* Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                verified ? "bg-green-100" : "bg-blue-50"
              }`}>
                {verified ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <Icon className="w-5 h-5 text-blue-600" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  {title}
                  {required && <span className="text-red-500 text-sm">*</span>}
                </h3>
                {verified && (
                  <p className="text-xs text-green-600 font-medium">✓ Verified</p>
                )}
              </div>
            </div>
            <button
              onClick={() => toggleSection(id)}
              className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
            >
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-slate-600" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-600" />
              )}
            </button>
          </div>
        </div>

        {/* Content */}
        {isExpanded && (
          <div className="p-4 space-y-4">
            {/* Display content */}
            {!isEditing && (
              <>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">
                    {content || "No data available"}
                  </p>
                </div>

                {/* Action buttons */}
                {!verified && (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleVerifyAsCurrent(id, content)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      This is current
                    </Button>
                    <Button
                      onClick={() => handleNeedsUpdate(id, content)}
                      variant="outline"
                      className="flex-1"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Needs updates
                    </Button>
                  </div>
                )}
                
                {verified && verifications.get(id)?.needsUpdate && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      <strong>Updated:</strong> {verifications.get(id)?.updatedValue}
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Editing interface */}
            {isEditing && (
              <div className="space-y-3">
                <div className="bg-slate-100 rounded-lg p-3 mb-2">
                  <p className="text-xs text-slate-600 mb-1">Original:</p>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{content}</p>
                </div>

                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    placeholder="Type or use voice input to update..."
                    className="w-full min-h-[120px] px-4 py-3 pr-14 border border-slate-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {isSupported && (
                    <button
                      onClick={handleMicToggle}
                      className={`absolute right-3 bottom-3 p-2 rounded-lg transition-all ${
                        isListening
                          ? "bg-red-100 text-red-700 animate-pulse"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                      title={isListening ? "Stop recording" : "Start voice input"}
                    >
                      {isListening ? (
                        <MicOff className="w-5 h-5" />
                      ) : (
                        <Mic className="w-5 h-5" />
                      )}
                    </button>
                  )}
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    onClick={handleCancelEdit}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => handleSaveEdit(id)}
                    disabled={!editValue.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Verify & Update Extracted Information
        </h1>
        <p className="text-slate-600">
          Please review the information we extracted from {studentName}'s IEP and confirm it's accurate
        </p>
        <p className="text-sm text-slate-500 mt-2">
          Fields marked with <span className="text-red-500">*</span> are required
        </p>
      </div>

      {/* Auto-calculated fields */}
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Calculator className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 mb-2">Auto-Calculated Fields</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              {calculatedAge !== null && (
                <div>
                  <span className="text-blue-700 font-medium">Current Age:</span>
                  <span className="text-blue-900 ml-2">{calculatedAge} years old</span>
                </div>
              )}
              {calculatedGrade && (
                <div>
                  <span className="text-blue-700 font-medium">Current Grade:</span>
                  <span className="text-blue-900 ml-2">{calculatedGrade}</span>
                </div>
              )}
              {calculatedNextReviewDate && (
                <div>
                  <span className="text-blue-700 font-medium">Next Annual Review:</span>
                  <span className="text-blue-900 ml-2">{calculatedNextReviewDate}</span>
                </div>
              )}
              {calculatedServiceMinutes !== null && (
                <div>
                  <span className="text-blue-700 font-medium">Service Minutes/Week:</span>
                  <span className="text-blue-900 ml-2">{formatServiceMinutes(calculatedServiceMinutes)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sections to verify */}
      <div className="space-y-4">
        {/* Student Info */}
        <Section
          id="student-name"
          title="Student Name"
          icon={User}
          content={safeRender(extractedIEP.student?.name)}
          required
        />

        <Section
          id="student-dob"
          title="Date of Birth"
          icon={User}
          content={safeRender(extractedIEP.student?.dob || extractedIEP.student?.date_of_birth)}
          required
        />

        <Section
          id="student-grade"
          title="Grade Level"
          icon={User}
          content={safeRender(extractedIEP.student?.grade)}
          required
        />

        <Section
          id="student-school"
          title="School"
          icon={User}
          content={safeRender(extractedIEP.student?.school)}
        />

        <Section
          id="student-district"
          title="District"
          icon={User}
          content={safeRender(extractedIEP.student?.district)}
        />

        <Section
          id="eligibility-primary"
          title="Primary Disability"
          icon={FileText}
          content={safeRender(
            extractedIEP.eligibility?.primary_disability || 
            extractedIEP.eligibility?.primaryDisability ||
            extractedIEP.student?.disability ||
            extractedIEP.student?.primary_disability
          )}
          required
        />

        {/* Present Levels */}
        <Section
          id="plaafp-academic"
          title="Academic Performance"
          icon={FileText}
          content={safeRender(extractedIEP.plaafp?.academic)}
          required
        />

        <Section
          id="plaafp-functional"
          title="Functional Performance"
          icon={FileText}
          content={safeRender(extractedIEP.plaafp?.functional)}
          required
        />

        <Section
          id="plaafp-impact"
          title="How Disability Impacts Learning"
          icon={FileText}
          content={safeRender(extractedIEP.plaafp?.disability_impact)}
        />

        <Section
          id="plaafp-strengths"
          title="Student Strengths"
          icon={FileText}
          content={safeRender(extractedIEP.plaafp?.strengths)}
        />

        <Section
          id="plaafp-parent"
          title="Parent Input"
          icon={FileText}
          content={safeRender(extractedIEP.plaafp?.parent_input)}
        />

        {/* Goals */}
        <Section
          id="goals"
          title="Current Goals"
          icon={Target}
          content={getOriginalValue("goals")}
          required
        />

        {/* Services */}
        <Section
          id="services"
          title="Related Services"
          icon={Users}
          content={getOriginalValue("services")}
          required
        />

        {/* Accommodations */}
        <Section
          id="accommodations"
          title="Accommodations"
          icon={ListChecks}
          content={getOriginalValue("accommodations")}
        />
      </div>

      {/* Progress indicator */}
      <div className="mt-8 bg-slate-50 border border-slate-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">Verification Progress</span>
          <span className="text-sm text-slate-600">
            {verifications.size} of {extractedIEP ? "13" : "0"} sections reviewed
          </span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(verifications.size / 13) * 100}%` }}
          />
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="flex gap-3 mt-8">
        <Button
          onClick={onBack}
          variant="outline"
          className="flex-1"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!allRequiredSectionsVerified()}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
        >
          Continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {!allRequiredSectionsVerified() && (
        <p className="text-center text-sm text-amber-600 mt-4">
          Please verify all required fields (marked with *) to continue
        </p>
      )}
    </div>
  )
}
