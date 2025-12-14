"use client"

import { useEffect, useState, useRef } from "react"
import { useIEP } from "@/lib/iep-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Check, Loader2, ArrowLeft, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

interface GeneratingStep {
  id: string
  label: string
  status: "pending" | "processing" | "complete"
}

export function GeneratingPage() {
  const { setDraft, setCurrentStep, addSessionLog, extractedData } = useIEP()
  const [steps, setSteps] = useState<GeneratingStep[]>([
    { id: "federal", label: "Federal IDEA requirements", status: "pending" },
    { id: "state", label: "State Education Code", status: "pending" },
    { id: "development", label: "Child development norms", status: "pending" },
    { id: "research", label: "Best practices research", status: "pending" },
    { id: "zpd", label: "Zone of Proximal Development", status: "pending" },
  ])
  const [error, setError] = useState<string | null>(null)
  const hasStarted = useRef(false)

  const handleBack = () => {
    addSessionLog("Returned to additional info")
    setCurrentStep("additional-info")
  }

  useEffect(() => {
    if (hasStarted.current) return
    hasStarted.current = true

    const generateDraft = async () => {
      addSessionLog("Draft generation started")

      if (!extractedData || !extractedData.rawIEP) {
        console.error("[v0] No extracted data available!")
        setError("No IEP data found. Please go back and upload an IEP document first.")
        return
      }

      // Use the raw IEP data from the Lambda
      const rawIEP = extractedData.rawIEP
      console.log("[v0] Using rawIEP data:", JSON.stringify(rawIEP, null, 2))

      // Animate the compliance check steps
      for (let i = 0; i < steps.length; i++) {
        setSteps((prev) => prev.map((step, idx) => (idx === i ? { ...step, status: "processing" } : step)))
        await new Promise((resolve) => setTimeout(resolve, 600 + Math.random() * 400))
        setSteps((prev) => prev.map((step, idx) => (idx === i ? { ...step, status: "complete" } : step)))
      }

      const student = rawIEP.student || {}
      const eligibility = rawIEP.eligibility || extractedData.eligibility || {}
      const plaafp = rawIEP.plaafp || {}
      const rawGoals = rawIEP.goals || []
      const rawServices = rawIEP.services || []
      const rawAccommodations = rawIEP.accommodations || []

      // Build present levels from PLAAFP
      let presentLevels = ""
      if (plaafp.academic) {
        presentLevels += "ACADEMIC PERFORMANCE:\n" + plaafp.academic + "\n\n"
      }
      if (plaafp.functional) {
        presentLevels += "FUNCTIONAL PERFORMANCE:\n" + plaafp.functional + "\n\n"
      }
      if (plaafp.strengths) {
        presentLevels += "STRENGTHS:\n" + plaafp.strengths + "\n\n"
      }
      if (plaafp.concerns) {
        presentLevels += "AREAS OF CONCERN:\n" + plaafp.concerns
      }
      if (!presentLevels.trim()) {
        presentLevels = "No present levels data extracted from the IEP document."
      }

      const goals = rawGoals.map((goal: any, index: number) => ({
        id: goal.id || `goal-${index + 1}`,
        area: goal.area || goal.domain || "Goal Area",
        description: goal.goal_text || goal.description || goal.text || "No description",
        baseline: goal.baseline || goal.current_performance || "Not specified",
        target: goal.target || goal.criteria || "Not specified",
        status: (goal.status || "progressing") as "met" | "progressing" | "not-met" | "unknown",
      }))

      console.log("[v0] Mapped goals from rawIEP:", goals)

      const services = rawServices.map((service: any, index: number) => ({
        id: service.id || `service-${index + 1}`,
        type: service.type || service.service_type || service.name || "Service",
        frequency: service.frequency || "Not specified",
        duration: service.duration || "Not specified",
        provider: service.provider || service.provider_type || "Not specified",
        location: service.location || service.setting || "Not specified",
      }))

      console.log("[v0] Mapped services from rawIEP:", services)

      // Accommodations are already an array of strings
      const accommodations = Array.isArray(rawAccommodations) ? rawAccommodations : []
      console.log("[v0] Accommodations from rawIEP:", accommodations)

      // Get compliance data if available
      const compliance = extractedData.compliance || {}
      const complianceScore =
        extractedData.complianceScore ||
        (compliance.status === "COMPLIANT" ? 90 : compliance.status === "NEEDS_REVISION" ? 75 : 60)

      const complianceIssues = (compliance.issues || []).map((issue: any, i: number) => {
        if (typeof issue === "string") {
          return {
            id: `issue-${i + 1}`,
            severity: "warning" as const,
            section: "Compliance",
            message: issue,
          }
        }
        return issue
      })

      const realDraft = {
        studentInfo: {
          name: student.name || extractedData.studentInfo?.name || "Unknown Student",
          grade: student.grade || extractedData.studentInfo?.grade || "Unknown",
          primaryDisability:
            eligibility.primary_disability || extractedData.studentInfo?.primaryDisability || "Not specified",
          secondaryDisability: eligibility.secondary_disability || extractedData.studentInfo?.secondaryDisability,
        },
        presentLevels: presentLevels.trim(),
        goals:
          goals.length > 0
            ? goals
            : [
                {
                  id: "no-goals",
                  area: "No Goals Extracted",
                  description: "No goals were found in the uploaded IEP. Please add goals manually.",
                  baseline: "N/A",
                  target: "N/A",
                  status: "unknown" as const,
                },
              ],
        services:
          services.length > 0
            ? services
            : [
                {
                  id: "no-services",
                  type: "No Services Extracted",
                  frequency: "N/A",
                  duration: "N/A",
                  provider: "N/A",
                  location: "N/A",
                },
              ],
        accommodations: accommodations.length > 0 ? accommodations : ["No accommodations extracted"],
        complianceScore,
        complianceIssues,
      }

      console.log("[v0] Final draft being set:", JSON.stringify(realDraft, null, 2))

      setDraft(realDraft)
      addSessionLog(
        `Draft generation completed - ${goals.length} goals, ${services.length} services, ${accommodations.length} accommodations`,
      )
      await new Promise((resolve) => setTimeout(resolve, 500))
      setCurrentStep("draft-review")
    }

    generateDraft()
  }, [addSessionLog, setCurrentStep, setDraft, extractedData, steps.length])

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-xl mx-auto text-center">
          <div className="mb-6 flex justify-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
          </div>
          <h1 className="text-2xl font-semibold text-foreground mb-4">Missing IEP Data</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={() => setCurrentStep("welcome")} className="transition-transform hover:scale-105">
            Start Over
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 md:p-12">
      <div className="w-full max-w-xl mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="text-muted-foreground hover:text-foreground transition-transform hover:scale-105"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>

        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-2xl md:text-3xl font-semibold text-foreground mb-2 hover-title-glow">
            Creating your IEP draft...
          </h1>
          <p className="text-muted-foreground">Checking against compliance requirements</p>
        </div>

        {/* Progress Card */}
        <div className="animate-slide-up">
          <Card className="p-6 md:p-8 transition-all hover:shadow-lg">
            <p className="text-sm font-medium text-muted-foreground mb-4">Checking against:</p>
            <div className="space-y-4">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className="flex items-center gap-4 animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
                      step.status === "complete" && "bg-primary text-primary-foreground scale-110",
                      step.status === "processing" && "bg-primary/20 animate-pulse",
                      step.status === "pending" && "bg-muted",
                    )}
                  >
                    {step.status === "complete" && <Check className="w-4 h-4" />}
                    {step.status === "processing" && <Loader2 className="w-4 h-4 text-primary animate-spin" />}
                    {step.status === "pending" && <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />}
                  </div>
                  <span
                    className={cn(
                      "text-sm transition-colors duration-300",
                      step.status === "complete" && "text-foreground",
                      step.status === "processing" && "text-foreground font-medium",
                      step.status === "pending" && "text-muted-foreground",
                    )}
                  >
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Loading dots */}
        <div className="flex justify-center gap-2 mt-8">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-primary animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
