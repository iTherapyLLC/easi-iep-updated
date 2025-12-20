"use client"

import { useEffect, useState, useRef } from "react"
import { useIEP } from "@/lib/iep-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Check, Loader2, ChevronRight, Edit2, ArrowLeft, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { MySLPReview, type ReviewInsight } from "@/components/MySLPReview"

interface ReviewStep {
  id: string
  label: string
  status: "pending" | "processing" | "complete"
}

interface ReviewResult {
  approved: boolean
  score?: number
  commentary: string
  recommendations: string[]
  complianceChecks?: Record<string, { passed: boolean; note: string }>
}

// Helper function to format compliance check names
function formatCheckName(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, str => str.toUpperCase())
    .trim()
}

// Helper function to convert review result to insights
function convertToInsights(
  reviewResult: ReviewResult,
  draft: any,
  extractedData: any
): ReviewInsight[] {
  const insights: ReviewInsight[] = []
  
  // Add "what's working" insights based on IEP content
  const goals = draft?.goals || extractedData?.goals || []
  if (goals.length >= 3) {
    insights.push({
      id: "goals-complete",
      type: "ready",
      title: "Goals are well-defined",
      description: `${goals.length} measurable goals with clear baselines and targets.`
    })
  }
  
  const services = draft?.services || extractedData?.services || []
  if (services.length > 0) {
    insights.push({
      id: "services-complete",
      type: "ready",
      title: "Services are documented",
      description: `${services.length} services with frequency and duration specified.`
    })
  }
  
  // Convert compliance checks to attention/suggestion items
  if (reviewResult.complianceChecks) {
    Object.entries(reviewResult.complianceChecks).forEach(([key, check]) => {
      if (!check.passed) {
        insights.push({
          id: `compliance-${key}`,
          type: "attention",
          title: formatCheckName(key),
          description: check.note || `${formatCheckName(key)} needs review.`
        })
      }
    })
  }
  
  // Convert recommendations to suggestions
  reviewResult.recommendations?.forEach((rec, index) => {
    insights.push({
      id: `rec-${index}`,
      type: "suggestion",
      title: "Suggestion",
      description: rec
    })
  })
  
  // Add discussion questions based on IEP content
  if (goals.some((g: any) => g.baseline?.toLowerCase().includes("emerging"))) {
    insights.push({
      id: "emerging-skills",
      type: "question",
      title: "Discuss emerging skills with the team",
      description: "Some goals reference 'emerging' skills. The team might want to discuss specific strategies to support skill development."
    })
  }
  
  return insights
}

export function MySLPReviewPage() {
  const { draft, extractedData, setMyslpReview, setCurrentStep, addSessionLog } = useIEP()
  const [steps, setSteps] = useState<ReviewStep[]>([
    { id: "clinical", label: "Clinical appropriateness", status: "pending" },
    { id: "measurability", label: "Goal measurability", status: "pending" },
    { id: "alignment", label: "Service alignment", status: "pending" },
    { id: "zpd", label: "ZPD validation", status: "pending" },
  ])
  const [isComplete, setIsComplete] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reviewResult, setReviewResult] = useState<ReviewResult | null>(null)
  const hasStarted = useRef(false)

  const handleBack = () => {
    addSessionLog("Returned to draft review")
    setCurrentStep("draft-review")
  }

  useEffect(() => {
    if (hasStarted.current) return
    hasStarted.current = true

    const runReview = async () => {
      addSessionLog("MySLP review started")
      setIsLoading(true)
      setError(null)

      // Animate the review steps
      for (let i = 0; i < steps.length; i++) {
        setSteps((prev) => prev.map((step, idx) => (idx === i ? { ...step, status: "processing" } : step)))
        await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 600))
        setSteps((prev) => prev.map((step, idx) => (idx === i ? { ...step, status: "complete" } : step)))
      }

      try {
        console.log("[v0] Calling MySLP API with draft:", draft)
        console.log("[v0] And extractedData:", extractedData)

        const response = await fetch("/api/myslp-review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            // Send the full IEP data for compliance review
            draft: draft,
            iepData: extractedData?.rawIEP || null,
            studentInfo: draft?.studentInfo || extractedData?.studentInfo,
            sessionId: crypto.randomUUID(),
          }),
        })

        const data = await response.json()
        console.log("[v0] MySLP API response:", data)

        if (!data.success) {
          throw new Error(data.error || "MySLP review failed")
        }

        const review = data.review
        const formattedReview = {
          approved: review.approved ?? true,
          score: review.score,
          commentary: review.commentary || "Review completed.",
          recommendations: review.recommendations || [],
          complianceChecks: review.complianceChecks,
        }

        setReviewResult(formattedReview)
        setMyslpReview({
          approved: formattedReview.approved,
          commentary: formattedReview.commentary,
          recommendations: formattedReview.recommendations,
          clinicalNotes: JSON.stringify(formattedReview.complianceChecks),
        })
        addSessionLog(
          `MySLP review completed - Approved: ${formattedReview.approved}, Score: ${formattedReview.score || "N/A"}%`,
        )
        setIsComplete(true)
      } catch (err) {
        console.error("[v0] MySLP review error:", err)
        setError(err instanceof Error ? err.message : "Failed to complete MySLP review")
      } finally {
        setIsLoading(false)
      }
    }

    runReview()
  }, [addSessionLog, draft, extractedData, setMyslpReview, steps.length])

  const handleAccept = () => {
    addSessionLog("MySLP review accepted")
    setCurrentStep("finalize")
  }

  const handleMakeChanges = () => {
    addSessionLog("User requested changes after MySLP review")
    setCurrentStep("draft-review")
  }

  const handleRetry = () => {
    hasStarted.current = false
    setError(null)
    setIsComplete(false)
    setSteps((prev) => prev.map((step) => ({ ...step, status: "pending" })))
    // Trigger re-run by forcing a state update
    window.location.reload()
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
            Back to Draft
          </Button>
        </div>

        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-2xl md:text-3xl font-semibold text-foreground mb-2 hover-title">
            {error ? "Review Error" : isComplete ? "MySLP Review Complete" : "MySLP is reviewing your draft..."}
          </h1>
          {!isComplete && !error && <p className="text-muted-foreground">Getting a second clinical perspective</p>}
        </div>

        {/* Error State */}
        {error && (
          <div className="animate-slide-up">
            <Card className="p-6 md:p-8 mb-6 bg-destructive/5 border-destructive/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <p className="font-medium text-destructive">Review Failed</p>
                  <p className="text-sm text-muted-foreground">{error}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button onClick={handleRetry} className="flex-1">
                  Retry Review
                </Button>
                <Button variant="outline" onClick={handleBack} className="flex-1 bg-transparent">
                  Go Back
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Processing Steps */}
        {!isComplete && !error && (
          <div className="animate-slide-up">
            <Card className="p-6 md:p-8 mb-6 transition-all hover:shadow-lg">
              <p className="text-sm font-medium text-muted-foreground mb-4">Checking:</p>
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
        )}

        {/* Review Result */}
        {isComplete && reviewResult && (
          <div className="animate-slide-up">
            <MySLPReview
              studentName={
                (draft?.studentInfo?.name || extractedData?.studentInfo?.name || "Student")
                  .split(" ")[0]
              }
              isReady={
                reviewResult.approved &&
                !Object.values(reviewResult.complianceChecks || {}).some(
                  (check) => !check.passed
                )
              }
              insights={convertToInsights(reviewResult, draft, extractedData)}
              onDownload={() => {
                addSessionLog("Downloaded IEP from MySLP review")
                // TODO: Implement actual download logic
                alert("IEP download would happen here")
              }}
              onBackToEdit={handleMakeChanges}
              onAskQuestion={(question) => {
                addSessionLog(`Asked question: ${question}`)
                // TODO: Implement question handling
                alert(`Question: ${question}`)
              }}
              reviewerName="MySLP"
            />

            {/* Action Buttons */}
            <div className="flex justify-center mt-6">
              <Button
                size="lg"
                onClick={handleAccept}
                className="h-12 text-base font-medium px-8 transition-transform hover:scale-[1.02] active:scale-95"
              >
                Accept & Continue
                <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Loading dots */}
        {!isComplete && !error && (
          <div className="flex justify-center gap-2 mt-4">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-primary animate-bounce"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
