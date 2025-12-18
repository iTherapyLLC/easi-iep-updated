"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Copy, Check, Upload } from "lucide-react"

interface ExtractedIEP {
  student?: {
    id?: string
    name?: string
    dob?: string
    date_of_birth?: string
    age?: string
    grade?: string
    school?: string
    district?: string
    disability?: string
    primary_disability?: string
  }
  eligibility?: {
    primary_disability?: string
    primaryDisability?: string
    secondary_disability?: string
    secondaryDisability?: string
  }
  plaafp?: {
    strengths?: string
    concerns?: string
    academic?: string
    functional?: string
    disability_impact?: string
    parent_input?: string
  }
  goals?: Array<{
    id: string
    area?: string
    goal_area?: string
    goal_text?: string
    description?: string
    text?: string
    baseline?: string
    target?: string
    zpd_score?: number
    zpd_analysis?: string
    clinical_flags?: string[]
    clinical_notes?: string
    measurement_method?: string
    domain?: string
    criteria?: string
    evaluation_method?: string
    measurement?: string
  }>
  services?: Array<{
    type?: string
    service_type?: string
    name?: string
    frequency?: string
    duration?: string
    provider?: string
    setting?: string
    location?: string
    minutes_per_week?: string
  }>
  accommodations?: (string | { description?: string; name?: string; text?: string })[]
  placement?: {
    setting: string
    percent_general_ed: string
    percent_special_ed: string
    lre_justification: string
  }
  lre?: {
    setting?: string
    percent_general_ed?: string
    percent_special_ed?: string
    justification?: string
    placement?: string
  }
}

interface CopyPasteInterfaceProps {
  iep: ExtractedIEP
  onScreenshotUpload?: (file: File) => void
  logEvent?: (event: string, metadata?: Record<string, unknown>) => void
}

export function CopyPasteInterface({ iep, onScreenshotUpload, logEvent }: CopyPasteInterfaceProps) {
  const [copiedSection, setCopiedSection] = useState<string | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  const handleCopy = async (text: string, sectionId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedSection(sectionId)
      logEvent?.("COPY_SECTION", { sectionId })
      setTimeout(() => setCopiedSection(null), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setUploadedFile(file)
      onScreenshotUpload?.(file)
      logEvent?.("SCREENSHOT_UPLOADED", { fileName: file.name, fileSize: file.size })
    }
  }

  const formatAllSections = () => {
    let allContent = ""

    // Present Levels - Academic
    if (iep.plaafp?.academic) {
      allContent += "=== PRESENT LEVELS - ACADEMIC ===\n"
      allContent += iep.plaafp.academic + "\n\n"
    }

    // Present Levels - Functional
    if (iep.plaafp?.functional) {
      allContent += "=== PRESENT LEVELS - FUNCTIONAL ===\n"
      allContent += iep.plaafp.functional + "\n\n"
    }

    // Disability Impact Statement
    if (iep.plaafp?.disability_impact) {
      allContent += "=== DISABILITY IMPACT STATEMENT ===\n"
      allContent += iep.plaafp.disability_impact + "\n\n"
    }

    // Strengths
    if (iep.plaafp?.strengths) {
      allContent += "=== STRENGTHS ===\n"
      allContent += iep.plaafp.strengths + "\n\n"
    }

    // Parent Input
    if (iep.plaafp?.parent_input) {
      allContent += "=== PARENT INPUT ===\n"
      allContent += iep.plaafp.parent_input + "\n\n"
    }

    // Goals
    iep.goals?.forEach((goal, index) => {
      const area = goal.area || goal.goal_area || goal.domain || "Goal"
      const goalText = goal.goal_text || goal.text || goal.description || "Not specified"
      const baseline = goal.baseline || "Not specified"
      const target = goal.target || goal.criteria || "Not specified"
      const measurement =
        goal.measurement_method || goal.measurement || goal.evaluation_method || "Not specified"

      allContent += `=== GOAL ${index + 1}: ${area} ===\n`
      allContent += `Area: ${area}\n`
      allContent += `Goal: ${goalText}\n`
      allContent += `Baseline: ${baseline}\n`
      allContent += `Target: ${target}\n`
      allContent += `Measurement: ${measurement}\n\n`
    })

    // Services
    iep.services?.forEach((service, index) => {
      const type = service.type || service.service_type || service.name || "Service"
      const frequency = service.frequency || "Not specified"
      const duration = service.duration || service.minutes_per_week || "Not specified"
      const location = service.location || service.setting || "Not specified"
      const provider = service.provider || "Not specified"

      allContent += `=== SERVICE ${index + 1}: ${type} ===\n`
      allContent += `Type: ${type}\n`
      allContent += `Frequency: ${frequency}\n`
      allContent += `Duration: ${duration}\n`
      allContent += `Location: ${location}\n`
      allContent += `Provider: ${provider}\n\n`
    })

    // Accommodations
    if (iep.accommodations && iep.accommodations.length > 0) {
      allContent += "=== ACCOMMODATIONS ===\n"
      const accommodationsList = iep.accommodations
        .map((acc) => {
          if (typeof acc === "string") return acc
          return acc.description || acc.name || acc.text || ""
        })
        .filter(Boolean)
        .join("\n")
      allContent += accommodationsList + "\n\n"
    }

    // LRE
    const lre = iep.lre || iep.placement
    if (lre) {
      allContent += "=== LEAST RESTRICTIVE ENVIRONMENT (LRE) ===\n"
      allContent += `Placement: ${lre.setting || (lre as any).placement || "Not specified"}\n`
      allContent += `Percent General Ed: ${lre.percent_general_ed || "Not specified"}\n`
      allContent += `Percent Special Ed: ${lre.percent_special_ed || "Not specified"}\n`
      allContent += `Justification: ${(lre as any).justification || (lre as any).lre_justification || "Not specified"}\n\n`
    }

    return allContent
  }

  const handleCopyAll = async () => {
    const allContent = formatAllSections()
    await handleCopy(allContent, "all-sections")
  }

  const renderSectionCard = (
    title: string,
    content: string | undefined,
    sectionId: string,
  ) => {
    if (!content) return null

    return (
      <div className="bg-card border border-border rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-foreground">{title}</h3>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleCopy(content, sectionId)}
            className="flex items-center gap-1"
          >
            {copiedSection === sectionId ? (
              <>
                <Check className="w-4 h-4 text-green-600" />
                Copied ✓
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy
              </>
            )}
          </Button>
        </div>
        <div className="bg-muted/30 rounded p-3 text-sm text-foreground whitespace-pre-wrap select-all">
          {content}
        </div>
      </div>
    )
  }

  const renderGoalCard = (
    goal: NonNullable<ExtractedIEP["goals"]>[0],
    index: number,
  ) => {
    const area = goal.area || goal.goal_area || goal.domain || "Goal"
    const goalText = goal.goal_text || goal.text || goal.description || "Not specified"
    const baseline = goal.baseline || "Not specified"
    const target = goal.target || goal.criteria || "Not specified"
    const measurement = goal.measurement_method || goal.measurement || goal.evaluation_method || "Not specified"

    const content = `Area: ${area}\nGoal: ${goalText}\nBaseline: ${baseline}\nTarget: ${target}\nMeasurement: ${measurement}`

    return (
      <div key={goal.id || index} className="bg-card border border-border rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-foreground">Goal {index + 1}: {area}</h3>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleCopy(content, `goal-${index}`)}
            className="flex items-center gap-1"
          >
            {copiedSection === `goal-${index}` ? (
              <>
                <Check className="w-4 h-4 text-green-600" />
                Copied ✓
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy
              </>
            )}
          </Button>
        </div>
        <div className="bg-muted/30 rounded p-3 text-sm text-foreground space-y-1 select-all">
          <div><span className="font-medium">Area:</span> {area}</div>
          <div><span className="font-medium">Goal:</span> {goalText}</div>
          <div><span className="font-medium">Baseline:</span> {baseline}</div>
          <div><span className="font-medium">Target:</span> {target}</div>
          <div><span className="font-medium">Measurement:</span> {measurement}</div>
        </div>
      </div>
    )
  }

  const renderServiceCard = (
    service: NonNullable<ExtractedIEP["services"]>[0],
    index: number,
  ) => {
    const type = service.type || service.service_type || service.name || "Service"
    const frequency = service.frequency || "Not specified"
    const duration = service.duration || service.minutes_per_week || "Not specified"
    const location = service.location || service.setting || "Not specified"
    const provider = service.provider || "Not specified"

    const content = `Type: ${type}\nFrequency: ${frequency}\nDuration: ${duration}\nLocation: ${location}\nProvider: ${provider}`

    return (
      <div key={index} className="bg-card border border-border rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-foreground">Service {index + 1}: {type}</h3>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleCopy(content, `service-${index}`)}
            className="flex items-center gap-1"
          >
            {copiedSection === `service-${index}` ? (
              <>
                <Check className="w-4 h-4 text-green-600" />
                Copied ✓
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy
              </>
            )}
          </Button>
        </div>
        <div className="bg-muted/30 rounded p-3 text-sm text-foreground space-y-1 select-all">
          <div><span className="font-medium">Type:</span> {type}</div>
          <div><span className="font-medium">Frequency:</span> {frequency}</div>
          <div><span className="font-medium">Duration:</span> {duration}</div>
          <div><span className="font-medium">Location:</span> {location}</div>
          <div><span className="font-medium">Provider:</span> {provider}</div>
        </div>
      </div>
    )
  }

  const renderAccommodationsCard = () => {
    if (!iep.accommodations || iep.accommodations.length === 0) return null

    const accommodationsList = iep.accommodations
      .map((acc) => {
        if (typeof acc === "string") return acc
        return acc.description || acc.name || acc.text || ""
      })
      .filter(Boolean)
      .join("\n")

    if (!accommodationsList) return null

    return (
      <div className="bg-card border border-border rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-foreground">Accommodations</h3>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleCopy(accommodationsList, "accommodations")}
            className="flex items-center gap-1"
          >
            {copiedSection === "accommodations" ? (
              <>
                <Check className="w-4 h-4 text-green-600" />
                Copied ✓
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy
              </>
            )}
          </Button>
        </div>
        <div className="bg-muted/30 rounded p-3 text-sm text-foreground whitespace-pre-wrap select-all">
          {accommodationsList}
        </div>
      </div>
    )
  }

  const renderLRECard = () => {
    const lre = iep.lre || iep.placement
    if (!lre) return null

    const setting = lre.setting || (lre as any).placement || "Not specified"
    const percentGenEd = lre.percent_general_ed || "Not specified"
    const percentSpecialEd = lre.percent_special_ed || "Not specified"
    const justification = (lre as any).justification || (lre as any).lre_justification || "Not specified"

    const content = `Placement: ${setting}\nPercent General Ed: ${percentGenEd}\nPercent Special Ed: ${percentSpecialEd}\nJustification: ${justification}`

    return (
      <div className="bg-card border border-border rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-foreground">Least Restrictive Environment (LRE)</h3>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleCopy(content, "lre")}
            className="flex items-center gap-1"
          >
            {copiedSection === "lre" ? (
              <>
                <Check className="w-4 h-4 text-green-600" />
                Copied ✓
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy
              </>
            )}
          </Button>
        </div>
        <div className="bg-muted/30 rounded p-3 text-sm text-foreground space-y-1 select-all">
          <div><span className="font-medium">Placement:</span> {setting}</div>
          <div><span className="font-medium">Percent General Ed:</span> {percentGenEd}</div>
          <div><span className="font-medium">Percent Special Ed:</span> {percentSpecialEd}</div>
          <div><span className="font-medium">Justification:</span> {justification}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header with Copy All Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Transfer to IEP System</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Copy sections individually or all at once to paste into your IEP system (SEIS, etc.)
          </p>
        </div>
        <Button
          onClick={handleCopyAll}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {copiedSection === "all-sections" ? (
            <>
              <Check className="w-4 h-4 mr-2 text-white" />
              Copied All ✓
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-2" />
              Copy All Sections
            </>
          )}
        </Button>
      </div>

      {/* Present Levels Section */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">Present Levels (PLAAFP)</h2>
        {renderSectionCard("Present Levels - Academic", iep.plaafp?.academic, "academic")}
        {renderSectionCard("Present Levels - Functional", iep.plaafp?.functional, "functional")}
        {renderSectionCard("Disability Impact Statement", iep.plaafp?.disability_impact, "disability-impact")}
        {renderSectionCard("Strengths", iep.plaafp?.strengths, "strengths")}
        {renderSectionCard("Parent Input", iep.plaafp?.parent_input, "parent-input")}
      </div>

      {/* Goals Section */}
      {iep.goals && iep.goals.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">Goals</h2>
          {iep.goals.map((goal, index) => renderGoalCard(goal, index))}
        </div>
      )}

      {/* Services Section */}
      {iep.services && iep.services.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">Services</h2>
          {iep.services.map((service, index) => renderServiceCard(service, index))}
        </div>
      )}

      {/* Accommodations Section */}
      {renderAccommodationsCard()}

      {/* LRE Section */}
      {renderLRECard()}

      {/* Verification Upload Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
        <h3 className="font-semibold text-foreground mb-2">Verification</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Done transferring? Upload a screenshot of your IEP system for MySLP to verify everything landed correctly.
        </p>
        <div className="flex items-center gap-4">
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".png,.jpg,.jpeg,.heic"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              className="bg-white hover:bg-gray-50"
              onClick={(e) => {
                e.preventDefault()
                ;(e.currentTarget.previousElementSibling as HTMLInputElement)?.click()
              }}
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Screenshot
            </Button>
          </label>
          {uploadedFile && (
            <div className="flex items-center gap-2 text-sm text-green-700">
              <Check className="w-4 h-4" />
              {uploadedFile.name}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
