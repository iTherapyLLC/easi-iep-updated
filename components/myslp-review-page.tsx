"use client"

import { useEffect, useState } from "react"
import { useIEP } from "@/lib/iep-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Check, Loader2, ChevronRight, Edit2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface ReviewStep {
  id: string
  label: string
  status: "pending" | "processing" | "complete"
}

export function MySLPReviewPage() {
  const { draft, setMyslpReview, setCurrentStep, addSessionLog } = useIEP()
  const [steps, setSteps] = useState<ReviewStep[]>([
    { id: "clinical", label: "Clinical appropriateness", status: "pending" },
    { id: "measurability", label: "Goal measurability", status: "pending" },
    { id: "alignment", label: "Service alignment", status: "pending" },
    { id: "zpd", label: "ZPD validation", status: "pending" },
  ])
  const [isComplete, setIsComplete] = useState(false)
  const [reviewResult, setReviewResult] = useState<{
    approved: boolean
    commentary: string
    recommendations: string[]
  } | null>(null)

  useEffect(() => {
    const runReview = async () => {
      addSessionLog("MySLP review started")

      for (let i = 0; i < steps.length; i++) {
        setSteps((prev) => prev.map((step, idx) => (idx === i ? { ...step, status: "processing" } : step)))
        await new Promise((resolve) => setTimeout(resolve, 1200 + Math.random() * 800))
        setSteps((prev) => prev.map((step, idx) => (idx === i ? { ...step, status: "complete" } : step)))
      }

      const mockReview = {
        approved: true,
        commentary: `This IEP meets federal and state compliance requirements. Goals are appropriately challenging within ${draft?.studentInfo.name || "the student"}'s zone of proximal development. The services and accommodations are well-aligned with the identified areas of need.`,
        recommendations: [
          "Consider adding visual supports to Goal 2 accommodation list based on student's learning profile",
          "May want to specify frequency of data collection for Goal 3",
          "ESY determination should be documented at the annual review",
        ],
      }

      setReviewResult(mockReview)
      setMyslpReview(mockReview)
      addSessionLog("MySLP review completed - Approved: " + mockReview.approved)
      setIsComplete(true)
    }

    runReview()
  }, [addSessionLog, draft, setMyslpReview, steps.length])

  const handleAccept = () => {
    addSessionLog("MySLP review accepted")
    setCurrentStep("finalize")
  }

  const handleMakeChanges = () => {
    addSessionLog("User requested changes after MySLP review")
    setCurrentStep("draft-review")
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 md:p-12">
      <div className="w-full max-w-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-2xl md:text-3xl font-semibold text-foreground mb-2 hover-title">
            {isComplete ? "MySLP Review Complete" : "MySLP is reviewing your draft..."}
          </h1>
          {!isComplete && <p className="text-muted-foreground">Getting a second clinical perspective</p>}
        </div>

        {/* Processing Steps */}
        {!isComplete && (
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
            <Card
              className={cn(
                "p-6 md:p-8 mb-6 transition-all hover:shadow-lg",
                reviewResult.approved ? "bg-primary/5 border-primary/20" : "bg-destructive/5 border-destructive/20",
              )}
            >
              {/* Status Badge */}
              <div className="flex items-center gap-2 mb-4">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center",
                    reviewResult.approved
                      ? "bg-primary text-primary-foreground"
                      : "bg-destructive text-destructive-foreground",
                  )}
                >
                  <Check className="w-5 h-5" />
                </div>
                <span className={cn("font-semibold", reviewResult.approved ? "text-primary" : "text-destructive")}>
                  MySLP Review {reviewResult.approved ? "Approved" : "Needs Revision"}
                </span>
              </div>

              {/* Commentary */}
              <p className="text-foreground leading-relaxed mb-6">
                {`"`}
                {reviewResult.commentary}
                {`"`}
              </p>

              {/* Recommendations */}
              {reviewResult.recommendations.length > 0 && (
                <div className="bg-background rounded-lg p-4">
                  <p className="text-sm font-medium text-foreground mb-3">Recommendations:</p>
                  <ul className="space-y-2">
                    {reviewResult.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="text-primary mt-1">•</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                onClick={handleAccept}
                className="flex-1 h-12 text-base font-medium transition-transform hover:scale-[1.02] active:scale-95"
              >
                Accept & Continue
                <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={handleMakeChanges}
                className="flex-1 h-12 text-base font-medium bg-transparent transition-transform active:scale-95"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Make Changes
              </Button>
            </div>
          </div>
        )}

        {/* Loading dots */}
        {!isComplete && (
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
