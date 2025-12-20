"use client"

import React, { useState, useRef, useEffect } from "react"
import { Mic, MicOff, Calendar, Check, X, Wand2, Edit3, Loader2, AlertCircle, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { stripRTL } from "@/utils/strip-rtl"

// =============================================================================
// TYPES
// =============================================================================

interface ComplianceFixInputProps {
  /** The type of input - 'date' for DOB fields, 'text' for other corrections */
  type: "date" | "text"
  /** Current value */
  value: string
  /** Callback when value changes (after validation) */
  onChange: (value: string) => void
  /** Placeholder text */
  placeholder?: string
  /** The suggested fix from IEP Guardian (for text fields) */
  suggestedFix?: string
  /** Label for the field */
  label?: string
  /** Whether the field is required */
  required?: boolean
  /** Error message to display */
  error?: string
  /** Whether auto-fix is available */
  hasAutoFix?: boolean
  /** The issue ID for Lambda calls */
  issueId?: string
  /** The issue type (e.g., 'disability_impact_missing', 'dob_missing') */
  issueType?: string
  /** Current IEP data for context */
  iepData?: any
  /** Student's state for compliance checking */
  state?: string
  /** The field being fixed (e.g., 'plaafp.disability_impact') */
  field?: string
}

// =============================================================================
// LAMBDA API FUNCTIONS
// =============================================================================

const IEP_GUARDIAN_URL = process.env.NEXT_PUBLIC_IEP_GUARDIAN_URL || ""

interface AutoFixResponse {
  success: boolean
  fixedText: string
  explanation?: string
  complianceScore?: number
  citations?: string[]
  error?: string
}

interface ValidateFixResponse {
  success: boolean
  isCompliant: boolean
  issues?: string[]
  suggestions?: string[]
  improvedText?: string
  complianceScore?: number
  error?: string
}

async function requestAutoFix(params: {
  issueId: string
  issueType: string
  currentText: string
  field: string
  state: string
  iepContext: any
}): Promise<AutoFixResponse> {
  try {
    const response = await fetch(IEP_GUARDIAN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "auto_fix",
        issue_id: params.issueId,
        issue_type: params.issueType,
        current_text: params.currentText,
        field: params.field,
        state: params.state,
        iep_context: params.iepContext,
      }),
    })

    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.error || "Auto-fix request failed")
    }

    return {
      success: true,
      fixedText: result.fixed_text || result.fixedText,
      explanation: result.explanation,
      complianceScore: result.compliance_score,
      citations: result.citations,
    }
  } catch (error) {
    console.error("[ComplianceFixInput] Auto-fix error:", error)
    return {
      success: false,
      fixedText: "",
      error: error instanceof Error ? error.message : "Auto-fix failed",
    }
  }
}

async function validateFix(params: {
  issueId: string
  issueType: string
  proposedFix: string
  field: string
  state: string
  iepContext: any
}): Promise<ValidateFixResponse> {
  try {
    const response = await fetch(IEP_GUARDIAN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "validate_fix",
        issue_id: params.issueId,
        issue_type: params.issueType,
        proposed_fix: params.proposedFix,
        field: params.field,
        state: params.state,
        iep_context: params.iepContext,
      }),
    })

    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.error || "Validation request failed")
    }

    return {
      success: true,
      isCompliant: result.is_compliant || result.isCompliant,
      issues: result.issues,
      suggestions: result.suggestions,
      improvedText: result.improved_text || result.improvedText,
      complianceScore: result.compliance_score,
    }
  } catch (error) {
    console.error("[ComplianceFixInput] Validation error:", error)
    return {
      success: false,
      isCompliant: false,
      error: error instanceof Error ? error.message : "Validation failed",
    }
  }
}

// =============================================================================
// VOICE DICTATION HOOK
// =============================================================================

function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<any>(null)

  const isSupported = typeof window !== "undefined" && 
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)

  useEffect(() => {
    if (!isSupported) return

    const windowWithSpeech = window as any
    const SpeechRecognition = windowWithSpeech.SpeechRecognition || windowWithSpeech.webkitSpeechRecognition
    recognitionRef.current = new SpeechRecognition()
    recognitionRef.current.continuous = true
    recognitionRef.current.interimResults = true
    recognitionRef.current.lang = "en-US"

    recognitionRef.current.onresult = (event: any) => {
      let finalTranscript = ""
      let interimTranscript = ""

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript
        } else {
          interimTranscript += transcript
        }
      }

      setTranscript(finalTranscript || interimTranscript)
    }

    recognitionRef.current.onerror = (event: any) => {
      setError(`Speech recognition error: ${event.error}`)
      setIsListening(false)
    }

    recognitionRef.current.onend = () => {
      setIsListening(false)
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [isSupported])

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setError(null)
      setTranscript("")
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }

  return { isListening, transcript, startListening, stopListening, isSupported, error }
}

// =============================================================================
// DATE INPUT COMPONENT
// =============================================================================

function DateInput({ value, onChange, placeholder, label, required, error }: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  label?: string
  required?: boolean
  error?: string
}) {
  const [selectedDate, setSelectedDate] = useState(value)

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value
    setSelectedDate(newDate)
    onChange(newDate)
  }

  // Format date for preview (if date is valid)
  const formatDatePreview = (dateStr: string): string => {
    if (!dateStr) return ""
    try {
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) return ""
      return date.toLocaleDateString("en-US", { 
        year: "numeric", 
        month: "long", 
        day: "numeric" 
      })
    } catch {
      return ""
    }
  }

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-slate-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="flex items-center gap-2">
        <Calendar className="w-5 h-5 text-slate-400" />
        <Input
          type="date"
          value={selectedDate}
          onChange={handleDateChange}
          className="flex-1"
          placeholder={placeholder}
          required={required}
          aria-label={label || "Date input"}
        />
      </div>

      {selectedDate && (
        <p className="text-sm text-slate-600 flex items-center gap-1">
          <CheckCircle className="w-4 h-4 text-green-600" />
          Selected: {formatDatePreview(selectedDate)}
        </p>
      )}

      {error && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {error}
        </p>
      )}
    </div>
  )
}

// =============================================================================
// TEXT INPUT COMPONENT
// =============================================================================

function TextInput({ 
  value, 
  onChange, 
  placeholder, 
  label, 
  required, 
  error,
  suggestedFix,
  hasAutoFix,
  issueId,
  issueType,
  field,
  state,
  iepData,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  label?: string
  required?: boolean
  error?: string
  suggestedFix?: string
  hasAutoFix?: boolean
  issueId?: string
  issueType?: string
  field?: string
  state?: string
  iepData?: any
}) {
  const [mode, setMode] = useState<"select" | "auto_fix" | "dictate" | "manual">("select")
  const [editText, setEditText] = useState(value)
  const [isLoading, setIsLoading] = useState(false)
  const [validationResult, setValidationResult] = useState<ValidateFixResponse | null>(null)
  const [showValidation, setShowValidation] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  
  const { isListening, transcript, startListening, stopListening, isSupported: voiceSupported } = useSpeechRecognition()

  // Update editText when transcript changes
  useEffect(() => {
    if (transcript && mode === "dictate") {
      setEditText(stripRTL(transcript))
    }
  }, [transcript, mode])

  const handleAutoFix = async () => {
    if (!issueId || !issueType || !field || !state) {
      console.error("[ComplianceFixInput] Missing required params for auto-fix")
      setErrorMessage("Unable to auto-fix: missing required parameters")
      return
    }

    setIsLoading(true)
    setMode("auto_fix")
    setErrorMessage(null)

    const result = await requestAutoFix({
      issueId,
      issueType,
      currentText: value,
      field,
      state,
      iepContext: iepData,
    })

    setIsLoading(false)

    if (result.success && result.fixedText) {
      setEditText(stripRTL(result.fixedText))
    } else {
      console.error("[ComplianceFixInput] Auto-fix failed:", result.error)
      setErrorMessage(`Auto-fix failed: ${result.error || "Unknown error"}`)
      setMode("select")
    }
  }

  const handleDictate = () => {
    setMode("dictate")
    setEditText(value)
  }

  const handleManual = () => {
    setMode("manual")
    setEditText(value)
  }

  const handleSave = async () => {
    const finalText = stripRTL(editText.trim())
    
    if (!finalText) {
      setErrorMessage("Please enter some text before saving")
      return
    }

    setErrorMessage(null)

    // Validate the fix if we have the required params
    if (issueId && issueType && field && state) {
      setIsLoading(true)
      const result = await validateFix({
        issueId,
        issueType,
        proposedFix: finalText,
        field,
        state,
        iepContext: iepData,
      })
      setIsLoading(false)

      setValidationResult(result)
      setShowValidation(true)

      // If validation passed or there's an improved version, let user decide
      if (!result.isCompliant && result.improvedText) {
        // Show validation result, don't save yet
        return
      }
    }

    // Save the text
    onChange(finalText)
    setMode("select")
  }

  const handleAcceptImproved = () => {
    if (validationResult?.improvedText) {
      onChange(stripRTL(validationResult.improvedText))
      setMode("select")
      setShowValidation(false)
    }
  }

  const handleSaveAnyway = () => {
    onChange(stripRTL(editText.trim()))
    setMode("select")
    setShowValidation(false)
  }

  const handleCancel = () => {
    setMode("select")
    setEditText(value)
    setShowValidation(false)
    if (isListening) {
      stopListening()
    }
  }

  // Mode selection view
  if (mode === "select") {
    return (
      <div className="space-y-2">
        {label && (
          <label className="text-sm font-medium text-slate-700">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        <div className="flex flex-col gap-2">
          {hasAutoFix && (
            <Button
              onClick={handleAutoFix}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              size="sm"
            >
              <Wand2 className="w-4 h-4 mr-2" />
              Fix it for me
            </Button>
          )}

          {voiceSupported && (
            <Button
              onClick={handleDictate}
              variant="outline"
              className="w-full"
              size="sm"
            >
              <Mic className="w-4 h-4 mr-2" />
              Dictate correction
            </Button>
          )}

          <Button
            onClick={handleManual}
            variant="outline"
            className="w-full"
            size="sm"
          >
            <Edit3 className="w-4 h-4 mr-2" />
            Edit manually
          </Button>
        </div>

        {errorMessage && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errorMessage}
          </p>
        )}

        {error && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {error}
          </p>
        )}
      </div>
    )
  }

  // Validation result view
  if (showValidation && validationResult) {
    return (
      <div className="space-y-3">
        <div className={`p-4 rounded-lg border ${
          validationResult.isCompliant 
            ? "bg-green-50 border-green-200" 
            : "bg-amber-50 border-amber-200"
        }`}>
          <div className="flex items-start gap-2 mb-2">
            {validationResult.isCompliant ? (
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <h4 className={`font-medium ${
                validationResult.isCompliant ? "text-green-800" : "text-amber-800"
              }`}>
                {validationResult.isCompliant ? "Validation Passed" : "Compliance Issues Found"}
              </h4>
              
              {validationResult.issues && validationResult.issues.length > 0 && (
                <ul className="mt-2 space-y-1 text-sm text-amber-700">
                  {validationResult.issues.map((issue, idx) => (
                    <li key={idx} className="flex items-start gap-1">
                      <span className="mt-1">•</span>
                      <span>{issue}</span>
                    </li>
                  ))}
                </ul>
              )}

              {validationResult.suggestions && validationResult.suggestions.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium text-amber-800 mb-1">Suggestions:</p>
                  <ul className="space-y-1 text-sm text-amber-700">
                    {validationResult.suggestions.map((suggestion, idx) => (
                      <li key={idx} className="flex items-start gap-1">
                        <span className="mt-1">•</span>
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {validationResult.improvedText && (
            <div className="mt-3 p-3 bg-white rounded border border-amber-200">
              <p className="text-xs font-medium text-amber-800 mb-1">Suggested improvement:</p>
              <p className="text-sm text-slate-700" dir="ltr">{validationResult.improvedText}</p>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {validationResult.improvedText && !validationResult.isCompliant && (
            <Button
              onClick={handleAcceptImproved}
              className="flex-1 bg-green-600 hover:bg-green-700"
              size="sm"
            >
              <Check className="w-4 h-4 mr-1" />
              Use Improved Text
            </Button>
          )}
          
          <Button
            onClick={handleSaveAnyway}
            variant={validationResult.isCompliant ? "default" : "outline"}
            className={validationResult.isCompliant ? "flex-1" : ""}
            size="sm"
          >
            {validationResult.isCompliant ? "Save" : "Save Anyway"}
          </Button>

          <Button
            onClick={handleCancel}
            variant="outline"
            size="sm"
          >
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  // Editing view (auto_fix, dictate, or manual)
  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-slate-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {mode === "dictate" && (
        <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
          <Button
            onClick={isListening ? stopListening : startListening}
            size="sm"
            variant={isListening ? "destructive" : "default"}
            className={isListening ? "animate-pulse" : ""}
          >
            {isListening ? (
              <>
                <MicOff className="w-4 h-4 mr-1" />
                Stop
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 mr-1" />
                Start Dictating
              </>
            )}
          </Button>
          {isListening && (
            <span className="text-sm text-blue-700 animate-pulse">Listening...</span>
          )}
        </div>
      )}

      <Textarea
        value={editText}
        onChange={(e) => setEditText(stripRTL(e.target.value))}
        className="w-full min-h-[120px]"
        placeholder={placeholder}
        dir="ltr"
        style={{ unicodeBidi: "plaintext" }}
        disabled={isLoading}
      />

      <div className="flex gap-2">
        <Button
          onClick={handleSave}
          disabled={isLoading || !editText.trim()}
          className="bg-blue-600 hover:bg-blue-700"
          size="sm"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              Validating...
            </>
          ) : (
            <>
              <Check className="w-4 h-4 mr-1" />
              Save Changes
            </>
          )}
        </Button>

        <Button
          onClick={handleCancel}
          variant="outline"
          size="sm"
          disabled={isLoading}
        >
          <X className="w-4 h-4 mr-1" />
          Cancel
        </Button>
      </div>

      {errorMessage && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {errorMessage}
        </p>
      )}

      {error && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {error}
        </p>
      )}
    </div>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function ComplianceFixInput(props: ComplianceFixInputProps) {
  if (props.type === "date") {
    return (
      <DateInput
        value={props.value}
        onChange={props.onChange}
        placeholder={props.placeholder}
        label={props.label}
        required={props.required}
        error={props.error}
      />
    )
  }

  return (
    <TextInput
      value={props.value}
      onChange={props.onChange}
      placeholder={props.placeholder}
      label={props.label}
      required={props.required}
      error={props.error}
      suggestedFix={props.suggestedFix}
      hasAutoFix={props.hasAutoFix}
      issueId={props.issueId}
      issueType={props.issueType}
      field={props.field}
      state={props.state}
      iepData={props.iepData}
    />
  )
}
