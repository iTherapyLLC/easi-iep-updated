"use client"

import React, { useState, useEffect } from "react"
import { Check, FileText, Brain, Shield, Sparkles, BookOpen, Scale, Users } from "lucide-react"

// =============================================================================
// TYPES
// =============================================================================

interface BuildingStep {
  id: string
  label: string
  status: "pending" | "active" | "complete"
}

interface ExtractedData {
  studentName?: string
  pageCount?: number
  goalCount?: number
  serviceCount?: number
  primaryDisability?: string
}

interface BuildingProgressAnimatedProps {
  /** Current processing phase from parent */
  currentPhase: "uploading" | "processing" | "generating" | "validating" | "complete"
  /** Real extracted data from Lambda (as it becomes available) */
  extractedData?: ExtractedData
  /** Selected state for compliance */
  selectedState?: string
  /** Error if any */
  error?: string | null
}

// =============================================================================
// FLOATING ICONS COMPONENT
// =============================================================================

function FloatingIcons() {
  const icons = [
    { Icon: FileText, delay: 0, x: 10, y: 20 },
    { Icon: Brain, delay: 1, x: 80, y: 15 },
    { Icon: Shield, delay: 2, x: 20, y: 70 },
    { Icon: BookOpen, delay: 1.5, x: 85, y: 65 },
    { Icon: Scale, delay: 0.5, x: 50, y: 10 },
    { Icon: Users, delay: 2.5, x: 45, y: 85 },
  ]

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
      {icons.map(({ Icon, delay, x, y }, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: `${x}%`,
            top: `${y}%`,
            animation: `float 6s ease-in-out infinite`,
            animationDelay: `${delay}s`,
          }}
        >
          <Icon className="w-8 h-8 text-blue-400" />
        </div>
      ))}
    </div>
  )
}

// =============================================================================
// PULSING ORB COMPONENT
// =============================================================================

function PulsingOrb({ phase }: { phase: string }) {
  const isComplete = phase === "complete"
  
  return (
    <div className="relative w-32 h-32 flex items-center justify-center">
      {/* Outer pulsing rings */}
      <div className="absolute inset-0 rounded-full bg-blue-400 opacity-20 animate-ping" />
      <div className="absolute inset-2 rounded-full bg-blue-400 opacity-30 animate-pulse" />
      
      {/* Center orb */}
      <div
        className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 ${
          isComplete
            ? "bg-gradient-to-br from-green-500 to-green-600 shadow-lg shadow-green-300"
            : "bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-300"
        }`}
      >
        {isComplete ? (
          <Check className="w-12 h-12 text-white animate-scale-in" />
        ) : (
          <Sparkles className="w-12 h-12 text-white animate-spin-slow" />
        )}
      </div>
      
      {/* Orbiting particles */}
      {!isComplete && (
        <>
          <div
            className="absolute w-3 h-3 bg-blue-300 rounded-full"
            style={{
              animation: "orbit 3s linear infinite",
              transformOrigin: "0 0",
            }}
          />
          <div
            className="absolute w-2 h-2 bg-purple-300 rounded-full"
            style={{
              animation: "orbit 4s linear infinite reverse",
              animationDelay: "1s",
              transformOrigin: "0 0",
            }}
          />
        </>
      )}
    </div>
  )
}

// =============================================================================
// PHASE MESSAGE COMPONENT
// =============================================================================

function PhaseMessage({ phase }: { phase: string }) {
  const messages = {
    uploading: "Uploading your document...",
    processing: "Reading and extracting IEP data...",
    generating: "Generating your new IEP...",
    validating: "Validating compliance requirements...",
    complete: "Your IEP is ready!",
  }

  const submessages = {
    uploading: "Securely transferring your files",
    processing: "Analyzing goals, services, and accommodations",
    generating: "Creating compliant IEP content",
    validating: "Checking against state and federal regulations",
    complete: "All done! Everything looks great",
  }

  return (
    <div className="text-center space-y-2 animate-fade-in">
      <h2 className="text-2xl font-bold text-slate-900">
        {messages[phase as keyof typeof messages]}
      </h2>
      <p className="text-slate-600 text-sm">
        {submessages[phase as keyof typeof submessages]}
      </p>
    </div>
  )
}

// =============================================================================
// STEP TRACKER COMPONENT
// =============================================================================

function StepTracker({ phase }: { phase: string }) {
  const steps: BuildingStep[] = [
    { id: "uploading", label: "Upload", status: "pending" },
    { id: "processing", label: "Extract", status: "pending" },
    { id: "generating", label: "Generate", status: "pending" },
    { id: "validating", label: "Validate", status: "pending" },
  ]

  // Update step statuses based on current phase
  const phaseOrder = ["uploading", "processing", "generating", "validating", "complete"]
  const currentIndex = phaseOrder.indexOf(phase)

  const updatedSteps = steps.map((step, index) => {
    const stepIndex = phaseOrder.indexOf(step.id)
    if (stepIndex < currentIndex) return { ...step, status: "complete" as const }
    if (stepIndex === currentIndex) return { ...step, status: "active" as const }
    return step
  })

  return (
    <div className="flex items-center justify-center gap-3">
      {updatedSteps.map((step, index) => (
        <React.Fragment key={step.id}>
          <div className="flex flex-col items-center gap-1">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                step.status === "complete"
                  ? "bg-green-500 text-white scale-110"
                  : step.status === "active"
                    ? "bg-blue-500 text-white animate-pulse"
                    : "bg-slate-200 text-slate-400"
              }`}
            >
              {step.status === "complete" ? (
                <Check className="w-5 h-5" />
              ) : (
                <span className="text-sm font-medium">{index + 1}</span>
              )}
            </div>
            <span
              className={`text-xs font-medium ${
                step.status === "active" ? "text-blue-600" : "text-slate-500"
              }`}
            >
              {step.label}
            </span>
          </div>
          {index < updatedSteps.length - 1 && (
            <div
              className={`w-8 h-0.5 transition-all duration-300 ${
                step.status === "complete" ? "bg-green-500" : "bg-slate-200"
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

// =============================================================================
// ACTIVITY FEED COMPONENT
// =============================================================================

function ActivityFeed({
  extractedData,
  selectedState,
  phase,
}: {
  extractedData?: ExtractedData
  selectedState?: string
  phase: string
}) {
  const [visibleItems, setVisibleItems] = useState<string[]>([])

  // Simulate progressive data reveal
  useEffect(() => {
    const items: string[] = []
    
    if (phase === "processing" || phase === "generating" || phase === "validating" || phase === "complete") {
      if (extractedData?.studentName) items.push("student")
      if (extractedData?.pageCount) items.push("pages")
      if (extractedData?.primaryDisability) items.push("disability")
    }
    
    if (phase === "generating" || phase === "validating" || phase === "complete") {
      if (extractedData?.goalCount) items.push("goals")
      if (extractedData?.serviceCount) items.push("services")
    }
    
    if (phase === "validating" || phase === "complete") {
      if (selectedState) items.push("compliance")
    }

    // Progressively reveal items
    let currentIndex = 0
    const interval = setInterval(() => {
      if (currentIndex < items.length) {
        setVisibleItems((prev) => [...prev, items[currentIndex]])
        currentIndex++
      } else {
        clearInterval(interval)
      }
    }, 500)

    return () => clearInterval(interval)
  }, [extractedData, selectedState, phase])

  const getStateName = (code: string) => {
    const states: Record<string, string> = {
      CA: "California",
      NY: "New York",
      TX: "Texas",
      FL: "Florida",
      // Add more as needed
    }
    return states[code] || code
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200 p-4 shadow-sm min-h-[120px]">
      <h3 className="text-sm font-semibold text-slate-700 mb-3">Activity</h3>
      <div className="space-y-2">
        {visibleItems.includes("student") && extractedData?.studentName && (
          <div className="flex items-center gap-2 text-sm text-slate-600 animate-slide-in-left">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
            Found student: <span className="font-medium">{extractedData.studentName}</span>
          </div>
        )}
        {visibleItems.includes("pages") && extractedData?.pageCount && (
          <div className="flex items-center gap-2 text-sm text-slate-600 animate-slide-in-left">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
            Processed {extractedData.pageCount} page{extractedData.pageCount !== 1 ? "s" : ""}
          </div>
        )}
        {visibleItems.includes("disability") && extractedData?.primaryDisability && (
          <div className="flex items-center gap-2 text-sm text-slate-600 animate-slide-in-left">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
            Primary disability: <span className="font-medium">{extractedData.primaryDisability}</span>
          </div>
        )}
        {visibleItems.includes("goals") && extractedData?.goalCount !== undefined && (
          <div className="flex items-center gap-2 text-sm text-slate-600 animate-slide-in-left">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
            Generated {extractedData.goalCount} goal{extractedData.goalCount !== 1 ? "s" : ""}
          </div>
        )}
        {visibleItems.includes("services") && extractedData?.serviceCount !== undefined && (
          <div className="flex items-center gap-2 text-sm text-slate-600 animate-slide-in-left">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
            Configured {extractedData.serviceCount} service{extractedData.serviceCount !== 1 ? "s" : ""}
          </div>
        )}
        {visibleItems.includes("compliance") && selectedState && (
          <div className="flex items-center gap-2 text-sm text-slate-600 animate-slide-in-left">
            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse" />
            Validating against <span className="font-medium">{getStateName(selectedState)}</span> regulations
          </div>
        )}
        {visibleItems.length === 0 && (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-pulse" />
            Preparing to process...
          </div>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function BuildingProgressAnimated({
  currentPhase,
  extractedData,
  selectedState,
  error,
}: BuildingProgressAnimatedProps) {
  if (error) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-red-900 mb-2">Something went wrong</h2>
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[80vh] flex flex-col relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50" />
      
      {/* Floating decorative icons */}
      <FloatingIcons />

      {/* Main content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-8 space-y-8">
        {/* Pulsing orb */}
        <PulsingOrb phase={currentPhase} />

        {/* Phase message */}
        <PhaseMessage phase={currentPhase} />

        {/* Step tracker */}
        <StepTracker phase={currentPhase} />

        {/* Activity feed */}
        <div className="w-full max-w-md">
          <ActivityFeed
            extractedData={extractedData}
            selectedState={selectedState}
            phase={currentPhase}
          />
        </div>

        {/* Compliance badge */}
        {selectedState && (currentPhase === "validating" || currentPhase === "complete") && (
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-100/80 backdrop-blur-sm rounded-full border border-blue-200 animate-fade-in">
            <Shield className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">
              {selectedState} Compliance Check
            </span>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(5deg);
          }
        }

        @keyframes orbit {
          from {
            transform: rotate(0deg) translateX(60px) rotate(0deg);
          }
          to {
            transform: rotate(360deg) translateX(60px) rotate(-360deg);
          }
        }

        @keyframes scale-in {
          from {
            transform: scale(0);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slide-in-left {
          from {
            transform: translateX(-20px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .animate-scale-in {
          animation: scale-in 0.5s ease-out;
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }

        .animate-slide-in-left {
          animation: slide-in-left 0.5s ease-out;
        }

        .animate-spin-slow {
          animation: spin 3s linear infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  )
}
