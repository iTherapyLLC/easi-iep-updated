"use client"

import { useEffect, useState } from "react"
import { useIEP } from "@/lib/iep-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Check, Loader2, ChevronRight, Edit2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
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

      // Process steps
      for (let i = 0; i < steps.length; i++) {
        setSteps((prev) => prev.map((step, idx) => (idx === i ? { ...step, status: "processing" } : step)))

        await new Promise((resolve) => setTimeout(resolve, 1200 + Math.random() * 800))

        setSteps((prev) => prev.map((step, idx) => (idx === i ? { ...step, status: "complete" } : step)))
      }

      // Generate mock review result
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
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-semibold text-foreground mb-2">
            {isComplete ? "MySLP Review Complete" : "MySLP is reviewing your draft..."}
          </h1>
          {!isComplete && <p className="text-muted-foreground">Getting a second clinical perspective</p>}
        </motion.div>

        {/* Processing Steps */}
        <AnimatePresence mode="wait">
          {!isComplete && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <Card className="p-6 md:p-8 mb-6">
                <p className="text-sm font-medium text-muted-foreground mb-4">Checking:</p>
                <div className="space-y-4">
                  {steps.map((step, index) => (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-4"
                    >
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
                          step.status === "complete" && "bg-primary text-primary-foreground",
                          step.status === "processing" && "bg-primary/20",
                          step.status === "pending" && "bg-muted",
                        )}
                      >
                        {step.status === "complete" && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          >
                            <Check className="w-4 h-4" />
                          </motion.div>
                        )}
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
                    </motion.div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}

          {/* Review Result */}
          {isComplete && reviewResult && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card
                className={cn(
                  "p-6 md:p-8 mb-6",
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
                  className="flex-1 h-12 text-base font-medium transition-all duration-200 hover:scale-[1.02] active:scale-100"
                >
                  Accept & Continue
                  <ChevronRight className="w-5 h-5 ml-1" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleMakeChanges}
                  className="flex-1 h-12 text-base font-medium bg-transparent"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Make Changes
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading dots */}
        {!isComplete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center gap-2 mt-4">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-primary"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{
                  duration: 1.5,
                  repeat: Number.POSITIVE_INFINITY,
                  delay: i * 0.2,
                }}
              />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}
