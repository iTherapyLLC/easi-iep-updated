"use client"

import { useEffect, useState } from "react"
import { useIEP } from "@/lib/iep-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Check, Loader2, AlertCircle, FileText } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

interface ProcessingStep {
  id: string
  label: string
  status: "pending" | "processing" | "complete" | "error"
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
  const [extractedInfo, setExtractedInfo] = useState<{
    name: string
    grade: string
    disability: string
    goalCount: number
  } | null>(null)

  useEffect(() => {
    if (!uploadedFile) return

    const processDocument = async () => {
      for (let i = 0; i < steps.length; i++) {
        setSteps((prev) => prev.map((step, idx) => (idx === i ? { ...step, status: "processing" } : step)))
        await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 700))
        setSteps((prev) => prev.map((step, idx) => (idx === i ? { ...step, status: "complete" } : step)))
      }

      const mockExtracted = {
        name: "Sample Student",
        grade: "2nd Grade",
        disability: "Autism Spectrum Disorder",
        goalCount: 5,
      }

      setExtractedInfo(mockExtracted)
      setExtractedData({
        studentInfo: {
          name: mockExtracted.name,
          grade: mockExtracted.grade,
          primaryDisability: mockExtracted.disability,
        },
        goals: Array(mockExtracted.goalCount)
          .fill(null)
          .map((_, i) => ({
            id: `goal-${i}`,
            area: ["Communication", "Social Skills", "Academic", "Motor Skills", "Behavior"][i % 5],
            description: `Goal ${i + 1} description`,
            baseline: "Current baseline",
            target: "Target criteria",
          })),
      })

      addSessionLog("Document processed successfully")
      setIsComplete(true)
    }

    processDocument()
  }, [uploadedFile, addSessionLog, setExtractedData, steps.length])

  const handleConfirm = () => {
    addSessionLog("Extracted data confirmed")
    setCurrentStep("goal-progress")
  }

  const handleCorrection = () => {
    addSessionLog("User requested data correction")
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 md:p-12">
      <div className="w-full max-w-xl mx-auto">
        {/* Header - Added shimmer animation to title */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-semibold text-foreground mb-2 animate-title-shimmer hover-underline-grow cursor-default">
            {isComplete ? "Document Analyzed" : `Analyzing ${uploadedFile?.name || "document"}...`}
          </h1>
          {!isComplete && <p className="text-muted-foreground">This usually takes about 30 seconds</p>}
        </motion.div>

        {/* Processing Steps - Added hover-lift to card */}
        <Card className="p-6 md:p-8 mb-6 hover-lift">
          <div className="space-y-4">
            {steps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-4 group"
                whileHover={{ x: 4 }}
              >
                <motion.div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
                    step.status === "complete" && "bg-primary text-primary-foreground",
                    step.status === "processing" && "bg-primary/20 animate-pulse-glow",
                    step.status === "pending" && "bg-muted group-hover:bg-muted/80",
                    step.status === "error" && "bg-destructive text-destructive-foreground",
                  )}
                  animate={step.status === "complete" ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  {step.status === "complete" && (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    >
                      <Check className="w-4 h-4" />
                    </motion.div>
                  )}
                  {step.status === "processing" && <Loader2 className="w-4 h-4 text-primary animate-spin" />}
                  {step.status === "error" && <AlertCircle className="w-4 h-4" />}
                  {step.status === "pending" && <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />}
                </motion.div>
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
              </motion.div>
            ))}
          </div>
        </Card>

        {/* Extracted Summary - Added hover-lift */}
        <AnimatePresence>
          {isComplete && extractedInfo && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="p-6 md:p-8 bg-secondary/30 border-primary/20 hover-lift">
                <div className="flex items-start gap-4 mb-6">
                  <motion.div
                    className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 hover-glow hover-bounce"
                    whileHover={{ rotate: 10 }}
                  >
                    <FileText className="w-6 h-6 text-primary" />
                  </motion.div>
                  <div>
                    <h2 className="font-semibold text-lg text-foreground mb-1">{extractedInfo.name}</h2>
                    <p className="text-sm text-muted-foreground">{extractedInfo.grade}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6 stagger-children">
                  <motion.div
                    className="bg-background rounded-lg p-4 hover-lift cursor-default"
                    whileHover={{ scale: 1.02 }}
                  >
                    <p className="text-xs text-muted-foreground mb-1">Primary Disability</p>
                    <p className="font-medium text-foreground">{extractedInfo.disability}</p>
                  </motion.div>
                  <motion.div
                    className="bg-background rounded-lg p-4 hover-lift cursor-default"
                    whileHover={{ scale: 1.02 }}
                  >
                    <p className="text-xs text-muted-foreground mb-1">Current Goals</p>
                    <p className="font-medium text-foreground">{extractedInfo.goalCount} goals</p>
                  </motion.div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button onClick={handleConfirm} className="flex-1 h-12 text-base font-medium press-effect hover-glow">
                    Looks correct
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCorrection}
                    className="flex-1 h-12 text-base font-medium bg-transparent press-effect"
                  >
                    {"Something's wrong"}
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
