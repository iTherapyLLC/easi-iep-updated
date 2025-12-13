"use client"

import { useEffect, useState } from "react"
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
  school: string
  district: string
  primaryDisability: string
  secondaryDisability: string
  goalCount: number
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
  const [processingStatus, setProcessingStatus] = useState<string | null>(null)
  const [complianceStatus, setComplianceStatus] = useState<string | null>(null)

  useEffect(() => {
    if (!uploadedFile) return

    const processDocument = async () => {
      setError(null)
      setProcessingStatus("Uploading document to IEP Guardian...")

      // Step 1: Extracting student information
      setSteps((prev) => prev.map((step, idx) => (idx === 0 ? { ...step, status: "processing" } : step)))

      try {
        // Create FormData and send to API
        const formData = new FormData()
        formData.append("file", uploadedFile)

        setProcessingStatus("Analyzing document... (this may take 30-60 seconds)")

        const response = await fetch("/api/extract-iep", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to process document")
        }

        const data = await response.json()

        console.log("[v0] Full API response:", JSON.stringify(data, null, 2))

        if (!data.success) {
          throw new Error(data.error || "Extraction failed")
        }

        const iep = data.iep || {}

        const student = iep.student || {}
        const eligibility = iep.eligibility || {}
        const goals = iep.goals || []
        const services = iep.services || []
        const accommodations = iep.accommodations || []
        const plaafp = iep.plaafp || {}
        const placement = iep.placement || {}
        const compliance = data.compliance || {}

        console.log("[v0] Parsed data:", {
          student,
          eligibility,
          goalsCount: goals.length,
          servicesCount: services.length,
        })

        // Mark step 1 complete
        setSteps((prev) => prev.map((step, idx) => (idx === 0 ? { ...step, status: "complete" } : step)))
        setProcessingStatus("Processing goals...")

        // Step 2: Identifying goals
        setSteps((prev) => prev.map((step, idx) => (idx === 1 ? { ...step, status: "processing" } : step)))
        await new Promise((resolve) => setTimeout(resolve, 300))
        setSteps((prev) => prev.map((step, idx) => (idx === 1 ? { ...step, status: "complete" } : step)))

        // Step 3: Reading present levels
        setSteps((prev) => prev.map((step, idx) => (idx === 2 ? { ...step, status: "processing" } : step)))
        await new Promise((resolve) => setTimeout(resolve, 300))
        setSteps((prev) => prev.map((step, idx) => (idx === 2 ? { ...step, status: "complete" } : step)))

        // Step 4: Checking compliance
        setSteps((prev) => prev.map((step, idx) => (idx === 3 ? { ...step, status: "processing" } : step)))
        await new Promise((resolve) => setTimeout(resolve, 300))
        setSteps((prev) => prev.map((step, idx) => (idx === 3 ? { ...step, status: "complete" } : step)))

        const extracted: ExtractedInfo = {
          name: student.name || "Unknown Student",
          grade: student.grade || "Unknown",
          school: student.school || "",
          district: student.district || "",
          primaryDisability: eligibility.primary_disability || "Not specified",
          secondaryDisability: eligibility.secondary_disability || "",
          goalCount: goals.length,
        }

        console.log("[v0] Extracted info:", extracted)

        setExtractedInfo(extracted)
        setEditedInfo(extracted)

        if (compliance.status) {
          setComplianceStatus(compliance.status)
        }

        setExtractedData({
          studentInfo: {
            name: student.name || "",
            grade: student.grade || "",
            primaryDisability: eligibility.primary_disability || "",
            secondaryDisability: eligibility.secondary_disability || "",
            dob: student.dob || "",
            school: student.school || "",
            district: student.district || "",
            age: student.age || "",
          },
          eligibility: eligibility,
          plaafp: plaafp,
          goals: goals,
          services: services,
          accommodations: accommodations,
          placement: placement,
          compliance: compliance,
          // Store raw IEP for later use
          rawIEP: iep,
        })

        addSessionLog("Document processed successfully")
        setProcessingStatus(null)
        setIsComplete(true)
      } catch (err) {
        console.error("Processing error:", err)
        setError(err instanceof Error ? err.message : "Unknown error occurred")
        setProcessingStatus(null)

        // Mark current step as error
        setSteps((prev) => prev.map((step) => (step.status === "processing" ? { ...step, status: "error" } : step)))

        // Fall back to letting user enter info manually
        const fallbackInfo: ExtractedInfo = {
          name: "",
          grade: "",
          school: "",
          district: "",
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
  }, [uploadedFile, addSessionLog, setExtractedData])

  const handleConfirm = () => {
    if (editedInfo && isEditing) {
      setExtractedData((prev) => ({
        ...prev!,
        studentInfo: {
          ...prev?.studentInfo!,
          name: editedInfo.name,
          grade: editedInfo.grade,
          school: editedInfo.school,
          district: editedInfo.district,
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

  const getComplianceBadgeColor = (status: string) => {
    switch (status) {
      case "COMPLIANT":
        return "bg-green-100 text-green-800 border-green-200"
      case "NEEDS_REVISION":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "NON_COMPLIANT":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

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
            <p className="text-muted-foreground">{processingStatus || "This usually takes about 30-60 seconds"}</p>
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
                        <p className="text-sm text-muted-foreground">
                          {displayInfo.grade}
                          {displayInfo.school && ` • ${displayInfo.school}`}
                          {displayInfo.district && ` • ${displayInfo.district}`}
                        </p>
                      </>
                    )}
                  </div>
                </div>
                {complianceStatus && !isEditing && (
                  <span
                    className={cn(
                      "px-2 py-1 text-xs font-medium rounded-full border",
                      getComplianceBadgeColor(complianceStatus),
                    )}
                  >
                    {complianceStatus.replace(/_/g, " ")}
                  </span>
                )}
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
                    <Label htmlFor="school" className="text-xs">
                      School
                    </Label>
                    <Input
                      id="school"
                      value={displayInfo.school}
                      onChange={(e) => updateEditedInfo("school", e.target.value)}
                      placeholder="e.g., Lincoln Elementary"
                    />
                  </div>
                  <div>
                    <Label htmlFor="district" className="text-xs">
                      District
                    </Label>
                    <Input
                      id="district"
                      value={displayInfo.district}
                      onChange={(e) => updateEditedInfo("district", e.target.value)}
                      placeholder="e.g., Springfield USD"
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
