"use client"

import { useEffect, useState, useCallback } from "react"
import { useIEP } from "@/lib/iep-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Check, Loader2, AlertCircle, FileText, Edit2, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProcessingStep {
  id: string
  label: string
  status: "pending" | "processing" | "complete" | "error"
}

interface ExtractedInfo {
  name: string
  grade: string
  primaryDisability: string
  secondaryDisability: string
  goalCount: number
}

function transformExtractedData(data: Record<string, unknown>) {
  return {
    success: true,
    studentInfo: data.studentInfo || data.student_info || {},
    eligibility: data.eligibility || {},
    goals: data.goals || [],
    services: data.services || [],
    presentLevels: data.presentLevels || data.present_levels || {},
    compliance: data.compliance || {},
  }
}

export function ProcessingPage() {
  const { uploadedFile, setExtractedData, setCurrentStep, addSessionLog } = useIEP()
  const [steps, setSteps] = useState<ProcessingStep[]>([
    { id: "extract", label: "Extracting student information", status: "pending" },
    { id: "goals", label: "Identifying current goals", status: "pending" },
    { id: "levels", label: "Reading present levels of performance", status: "pending" },
    { id: "compliance", label: "Checking compliance elements", status: "pending" },
  ])
  const [isComplete, setIsComplete] = useState(false)
  const [extractedInfo, setExtractedInfo] = useState<ExtractedInfo | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedInfo, setEditedInfo] = useState<ExtractedInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pollingStatus, setPollingStatus] = useState<string | null>(null)

  const pollForResult = useCallback(
    async (resultUrl: string, pollInterval = 3000): Promise<Record<string, unknown>> => {
      const maxAttempts = 30 // 90 seconds max
      let attempts = 0

      while (attempts < maxAttempts) {
        setPollingStatus(`Processing... (${attempts * 3}s)`)

        try {
          const pollResponse = await fetch("/api/poll-result", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ resultUrl }),
          })

          if (pollResponse.ok) {
            const pollResult = await pollResponse.json()

            if (pollResult.status === "complete") {
              setPollingStatus(null)
              return pollResult
            }

            if (pollResult.status === "error") {
              throw new Error(pollResult.error || "Processing failed")
            }
          }
        } catch (pollError) {
          console.error("Polling error:", pollError)
          // Continue polling even if one request fails
        }

        // Wait before next poll
        await new Promise((resolve) => setTimeout(resolve, pollInterval))
        attempts++
      }

      throw new Error("Processing timed out after 90 seconds")
    },
    [],
  )

  useEffect(() => {
    if (!uploadedFile) return

    const processDocument = async () => {
      setError(null)

      // Step 1: Extracting student information
      setSteps((prev) => prev.map((step, idx) => (idx === 0 ? { ...step, status: "processing" } : step)))

      try {
        // Create FormData and send to API
        const formData = new FormData()
        formData.append("file", uploadedFile)

        const response = await fetch("/api/extract-iep", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to process document")
        }

        let data = await response.json()

        if (data.status === "processing" && data.resultUrl) {
          setPollingStatus("Processing started...")
          const pollResult = await pollForResult(data.resultUrl, data.pollInterval || 3000)
          data = transformExtractedData(pollResult)
        } else if (!data.success && !data.studentInfo) {
          // Transform direct Lambda response
          data = transformExtractedData(data)
        }

        // Mark step 1 complete
        setSteps((prev) => prev.map((step, idx) => (idx === 0 ? { ...step, status: "complete" } : step)))

        // Step 2: Identifying goals
        setSteps((prev) => prev.map((step, idx) => (idx === 1 ? { ...step, status: "processing" } : step)))
        await new Promise((resolve) => setTimeout(resolve, 500))
        setSteps((prev) => prev.map((step, idx) => (idx === 1 ? { ...step, status: "complete" } : step)))

        // Step 3: Reading present levels
        setSteps((prev) => prev.map((step, idx) => (idx === 2 ? { ...step, status: "processing" } : step)))
        await new Promise((resolve) => setTimeout(resolve, 500))
        setSteps((prev) => prev.map((step, idx) => (idx === 2 ? { ...step, status: "complete" } : step)))

        // Step 4: Checking compliance
        setSteps((prev) => prev.map((step, idx) => (idx === 3 ? { ...step, status: "processing" } : step)))
        await new Promise((resolve) => setTimeout(resolve, 500))
        setSteps((prev) => prev.map((step, idx) => (idx === 3 ? { ...step, status: "complete" } : step)))

        // Build extracted info from response
        const extracted: ExtractedInfo = {
          name: data.studentInfo?.name || "Unknown Student",
          grade: data.studentInfo?.grade || "Unknown",
          primaryDisability:
            data.eligibility?.primaryDisability || data.studentInfo?.primaryDisability || "Not specified",
          secondaryDisability: data.eligibility?.secondaryDisability || data.studentInfo?.secondaryDisability || "",
          goalCount: data.goals?.length || 0,
        }

        setExtractedInfo(extracted)
        setEditedInfo(extracted)

        // Store full extracted data in context
        setExtractedData({
          studentInfo: {
            name: data.studentInfo?.name || "",
            grade: data.studentInfo?.grade || "",
            primaryDisability: data.eligibility?.primaryDisability || data.studentInfo?.primaryDisability || "",
            secondaryDisability: data.eligibility?.secondaryDisability || data.studentInfo?.secondaryDisability || "",
            dob: data.studentInfo?.dob || "",
            school: data.studentInfo?.school || "",
            district: data.studentInfo?.district || "",
          },
          goals: data.goals || [],
          services: data.services || [],
          presentLevels: data.presentLevels || "",
          compliance: data.compliance || null,
        })

        addSessionLog("Document processed successfully")
        setIsComplete(true)
      } catch (err) {
        console.error("Processing error:", err)
        setError(err instanceof Error ? err.message : "Unknown error occurred")
        setPollingStatus(null)

        // Mark current step as error
        setSteps((prev) => prev.map((step) => (step.status === "processing" ? { ...step, status: "error" } : step)))

        // Fall back to letting user enter info manually
        const fallbackInfo: ExtractedInfo = {
          name: "",
          grade: "",
          primaryDisability: "",
          secondaryDisability: "",
          goalCount: 0,
        }
        setExtractedInfo(fallbackInfo)
        setEditedInfo(fallbackInfo)
        setIsEditing(true)
        setIsComplete(true)
      }
    }

    processDocument()
  }, [uploadedFile, addSessionLog, setExtractedData, pollForResult])

  const handleConfirm = () => {
    if (editedInfo && isEditing) {
      // Save edited info
      setExtractedData((prev: any) => ({
        ...prev,
        studentInfo: {
          ...prev?.studentInfo,
          name: editedInfo.name,
          grade: editedInfo.grade,
          primaryDisability: editedInfo.primaryDisability,
          secondaryDisability: editedInfo.secondaryDisability,
        },
      }))
      addSessionLog("Extracted data confirmed with edits")
    } else {
      addSessionLog("Extracted data confirmed")
    }
    setCurrentStep("goal-progress")
  }

  const handleCorrection = () => {
    addSessionLog("User requested data correction")
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setEditedInfo(extractedInfo)
    setIsEditing(false)
  }

  const updateEditedInfo = (field: keyof ExtractedInfo, value: string | number) => {
    if (editedInfo) {
      setEditedInfo({ ...editedInfo, [field]: value })
    }
  }

  const displayInfo = isEditing ? editedInfo : extractedInfo

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 md:p-12">
      <div className="w-full max-w-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-2xl md:text-3xl font-semibold text-foreground mb-2">
            {isComplete
              ? error
                ? "Manual Entry Required"
                : "Document Analyzed"
              : `Analyzing ${uploadedFile?.name || "document"}...`}
          </h1>
          {!isComplete && (
            <p className="text-muted-foreground">{pollingStatus || "This usually takes about 30-60 seconds"}</p>
          )}
          {error && <p className="text-destructive mt-2 text-sm">{error}. Please enter the information manually.</p>}
        </div>

        {/* Processing Steps */}
        <Card className="p-6 md:p-8 mb-6 transition-all duration-300 hover:shadow-lg">
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className="flex items-center gap-4 group animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
                    step.status === "complete" && "bg-primary text-primary-foreground scale-110",
                    step.status === "processing" && "bg-primary/20 animate-pulse",
                    step.status === "pending" && "bg-muted group-hover:bg-muted/80",
                    step.status === "error" && "bg-destructive text-destructive-foreground",
                  )}
                >
                  {step.status === "complete" && <Check className="w-4 h-4" />}
                  {step.status === "processing" && <Loader2 className="w-4 h-4 text-primary animate-spin" />}
                  {step.status === "error" && <AlertCircle className="w-4 h-4" />}
                  {step.status === "pending" && <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />}
                </div>
                <span
                  className={cn(
                    "text-sm transition-colors duration-300",
                    step.status === "complete" && "text-foreground",
                    step.status === "processing" && "text-foreground font-medium",
                    step.status === "pending" && "text-muted-foreground group-hover:text-foreground/70",
                    step.status === "error" && "text-destructive",
                  )}
                >
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Extracted Summary / Edit Form */}
        {isComplete && displayInfo && (
          <div className="animate-slide-up">
            <Card className="p-6 md:p-8 bg-secondary/30 border-primary/20 transition-all duration-300 hover:shadow-lg">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 transition-transform hover:scale-110 hover:rotate-6">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    {isEditing ? (
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-xs">
                          Student Name
                        </Label>
                        <Input
                          id="name"
                          value={displayInfo.name}
                          onChange={(e) => updateEditedInfo("name", e.target.value)}
                          placeholder="Enter student name"
                        />
                      </div>
                    ) : (
                      <>
                        <h2 className="font-semibold text-lg text-foreground mb-1">{displayInfo.name}</h2>
                        <p className="text-sm text-muted-foreground">{displayInfo.grade}</p>
                      </>
                    )}
                  </div>
                </div>
                {isEditing && (
                  <Button variant="ghost" size="sm" onClick={handleCancelEdit} className="flex-shrink-0">
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-4 mb-6">
                  <div>
                    <Label htmlFor="grade" className="text-xs">
                      Grade
                    </Label>
                    <Input
                      id="grade"
                      value={displayInfo.grade}
                      onChange={(e) => updateEditedInfo("grade", e.target.value)}
                      placeholder="e.g., 2nd Grade"
                    />
                  </div>
                  <div>
                    <Label htmlFor="primaryDisability" className="text-xs">
                      Primary Disability
                    </Label>
                    <Input
                      id="primaryDisability"
                      value={displayInfo.primaryDisability}
                      onChange={(e) => updateEditedInfo("primaryDisability", e.target.value)}
                      placeholder="e.g., Other Health Impairment (OHI)"
                    />
                  </div>
                  <div>
                    <Label htmlFor="secondaryDisability" className="text-xs">
                      Secondary Disability (if any)
                    </Label>
                    <Input
                      id="secondaryDisability"
                      value={displayInfo.secondaryDisability}
                      onChange={(e) => updateEditedInfo("secondaryDisability", e.target.value)}
                      placeholder="e.g., Specific Learning Disability (SLD)"
                    />
                  </div>
                  <div>
                    <Label htmlFor="goalCount" className="text-xs">
                      Number of Goals
                    </Label>
                    <Input
                      id="goalCount"
                      type="number"
                      value={displayInfo.goalCount}
                      onChange={(e) => updateEditedInfo("goalCount", Number.parseInt(e.target.value) || 0)}
                      placeholder="e.g., 5"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-background rounded-lg p-4 transition-transform hover:scale-[1.02]">
                    <p className="text-xs text-muted-foreground mb-1">Primary Disability</p>
                    <p className="font-medium text-foreground">{displayInfo.primaryDisability}</p>
                    {displayInfo.secondaryDisability && (
                      <>
                        <p className="text-xs text-muted-foreground mb-1 mt-2">Secondary Disability</p>
                        <p className="font-medium text-foreground text-sm">{displayInfo.secondaryDisability}</p>
                      </>
                    )}
                  </div>
                  <div className="bg-background rounded-lg p-4 transition-transform hover:scale-[1.02]">
                    <p className="text-xs text-muted-foreground mb-1">Current Goals</p>
                    <p className="font-medium text-foreground">{displayInfo.goalCount} goals</p>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleConfirm}
                  className="flex-1 h-12 text-base font-medium transition-transform active:scale-95"
                >
                  {isEditing ? "Save & Continue" : "Looks correct"}
                </Button>
                {!isEditing && (
                  <Button
                    variant="outline"
                    onClick={handleCorrection}
                    className="flex-1 h-12 text-base font-medium bg-transparent transition-transform active:scale-95"
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit Information
                  </Button>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
