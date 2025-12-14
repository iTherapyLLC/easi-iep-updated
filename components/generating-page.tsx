"use client"

import { useEffect, useState } from "react"
import { useIEP } from "@/lib/iep-context"
import { Card } from "@/components/ui/card"
import { Check, Loader2 } from "lucide-react"
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

  useEffect(() => {
    const generateDraft = async () => {
      addSessionLog("Draft generation started")

      for (let i = 0; i < steps.length; i++) {
        setSteps((prev) => prev.map((step, idx) => (idx === i ? { ...step, status: "processing" } : step)))
        await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 800))
        setSteps((prev) => prev.map((step, idx) => (idx === i ? { ...step, status: "complete" } : step)))
      }

      const mockDraft = {
        studentInfo: extractedData?.studentInfo || {
          name: "Sample Student",
          grade: "2nd Grade",
          primaryDisability: "Autism Spectrum Disorder",
        },
        presentLevels: `${extractedData?.studentInfo?.name || "The student"} is a second-grade student who receives special education services under the eligibility category of Autism Spectrum Disorder. In the classroom setting, they demonstrate strengths in visual learning and pattern recognition. Areas of need include social communication, expressive language, and self-regulation during transitions.`,
        goals: [
          {
            id: "goal-1",
            area: "Communication",
            description:
              "Student will use a communication device or verbal language to make requests across school settings.",
            baseline: "Currently makes requests using gestures 60% of opportunities",
            target: "80% accuracy across 3 consecutive sessions",
            status: "progressing" as const,
          },
          {
            id: "goal-2",
            area: "Social Skills",
            description: "Student will engage in reciprocal play with peers during structured activities.",
            baseline: "Currently engages in parallel play only",
            target: "3 turn exchanges with peer support in 4/5 opportunities",
            status: "progressing" as const,
          },
          {
            id: "goal-3",
            area: "Self-Regulation",
            description: "Student will use calming strategies when presented with challenging tasks.",
            baseline: "Requires adult prompting 90% of the time",
            target: "Independent use 60% of opportunities",
            status: "progressing" as const,
          },
          {
            id: "goal-4",
            area: "Academic - Reading",
            description: "Student will identify sight words from grade-level word list.",
            baseline: "Currently identifies 15 sight words",
            target: "50 sight words with 90% accuracy",
            status: "progressing" as const,
          },
          {
            id: "goal-5",
            area: "Motor Skills",
            description: "Student will demonstrate improved fine motor control for writing tasks.",
            baseline: "Currently writes with oversized grip, letters inconsistent in size",
            target: "Legible letter formation with appropriate sizing",
            status: "progressing" as const,
          },
        ],
        services: [
          {
            id: "service-1",
            type: "Specialized Academic Instruction",
            frequency: "5x weekly",
            duration: "180 minutes",
            provider: "Special Education Teacher",
            location: "Special Day Class",
          },
          {
            id: "service-2",
            type: "Speech and Language",
            frequency: "2x weekly",
            duration: "30 minutes",
            provider: "Speech-Language Pathologist",
            location: "Pull-out",
          },
          {
            id: "service-3",
            type: "Occupational Therapy",
            frequency: "1x weekly",
            duration: "30 minutes",
            provider: "Occupational Therapist",
            location: "Pull-out",
          },
        ],
        accommodations: [
          "Visual schedule and timers for transitions",
          "Preferential seating away from distractions",
          "Movement breaks every 20 minutes",
          "Visual supports for all instructions",
          "Extended time for assignments",
          "Sensory tools available (fidgets, headphones)",
          "Reduced visual clutter on worksheets",
        ],
        complianceScore: 87,
        complianceIssues: [
          {
            id: "issue-1",
            severity: "warning" as const,
            section: "Goal 3",
            message: 'Consider adding measurable criteria for "calming strategies"',
            citation: "IDEA 34 CFR §300.320(a)(2)",
          },
          {
            id: "issue-2",
            severity: "info" as const,
            section: "Services",
            message: "Consider documenting extended school year (ESY) determination",
            citation: "IDEA 34 CFR §300.106",
          },
        ],
      }

      setDraft(mockDraft)
      addSessionLog("Draft generation completed - Compliance Score: 87%")
      await new Promise((resolve) => setTimeout(resolve, 500))
      setCurrentStep("draft-review")
    }

    generateDraft()
  }, [addSessionLog, setCurrentStep, setDraft, extractedData, steps.length])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 md:p-12">
      <div className="w-full max-w-xl mx-auto">
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
