"use client"

import { useState } from "react"
import { useIEP } from "@/lib/iep-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import {
  Check,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronRight,
  Save,
  ExternalLink,
  Edit2,
  ArrowLeft,
} from "lucide-react"
import { cn } from "@/lib/utils"

export function DraftReviewPage() {
  const { draft, setDraft, setCurrentStep, addSessionLog } = useIEP()
  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set())
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [showAllIssues, setShowAllIssues] = useState(false)
  const [saveStatus, setSaveStatus] = useState<string | null>(null)

  if (!draft) return null

  const toggleGoal = (goalId: string) => {
    setExpandedGoals((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(goalId)) {
        newSet.delete(goalId)
      } else {
        newSet.add(goalId)
      }
      return newSet
    })
  }

  const handleSave = () => {
    addSessionLog("Draft saved")
    setSaveStatus("Saved!")
    setTimeout(() => setSaveStatus(null), 2000)
  }

  const handleSecondLook = () => {
    addSessionLog("MySLP review requested")
    setCurrentStep("myslp-review")
  }

  const handleBack = () => {
    addSessionLog("Returned to generating page")
    setCurrentStep("generating")
  }

  const updatePresentLevels = (value: string) => {
    setDraft({ ...draft, presentLevels: value })
  }

  const updateGoal = (goalId: string, field: string, value: string) => {
    setDraft({
      ...draft,
      goals: draft.goals.map((g) => (g.id === goalId ? { ...g, [field]: value } : g)),
    })
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-primary"
    if (score >= 70) return "text-yellow-600"
    return "text-destructive"
  }

  const getSeverityIcon = (severity: "error" | "warning" | "info") => {
    switch (severity) {
      case "error":
        return <AlertTriangle className="w-4 h-4 text-destructive" />
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />
      case "info":
        return <Info className="w-4 h-4 text-primary" />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-foreground hover-title">Draft IEP: {draft.studentInfo.name}</h1>
              <p className="text-sm text-muted-foreground">Review and edit before second look</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleSave}
              className="bg-transparent transition-transform hover:scale-105 active:scale-95"
            >
              <Save className="w-4 h-4 mr-2" />
              {saveStatus || "Save Draft"}
            </Button>
            <Button onClick={handleSecondLook} className="transition-transform hover:scale-105 active:scale-95">
              Ready for Second Look
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Left 2/3 */}
          <div className="lg:col-span-2 space-y-6">
            {/* Present Levels */}
            <Card className="p-6 transition-all hover:shadow-lg hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">Present Levels of Performance (PLAAFP)</h2>
                <button
                  onClick={() => setEditingSection(editingSection === "plaafp" ? null : "plaafp")}
                  className="p-2 hover:bg-secondary rounded-md transition-all hover:scale-110"
                >
                  <Edit2 className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              {editingSection === "plaafp" ? (
                <Textarea
                  value={draft.presentLevels}
                  onChange={(e) => updatePresentLevels(e.target.value)}
                  className="min-h-[200px] text-base"
                />
              ) : (
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{draft.presentLevels}</p>
              )}
            </Card>

            {/* Goals */}
            <Card className="p-6 transition-all hover:shadow-lg hover:-translate-y-1">
              <h2 className="text-lg font-semibold text-foreground mb-4">Annual Goals ({draft.goals.length})</h2>
              <div className="space-y-3">
                {draft.goals.map((goal, index) => (
                  <div
                    key={goal.id}
                    className="border rounded-lg overflow-hidden transition-all hover:shadow-md"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <button
                      onClick={() => toggleGoal(goal.id)}
                      className="w-full p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors text-left group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary transition-transform group-hover:scale-110">
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-medium text-foreground">{goal.area}</p>
                          <p className="text-sm text-muted-foreground line-clamp-1">{goal.description}</p>
                        </div>
                      </div>
                      <ChevronDown
                        className={cn(
                          "w-5 h-5 text-muted-foreground transition-transform",
                          expandedGoals.has(goal.id) && "rotate-180",
                        )}
                      />
                    </button>

                    {expandedGoals.has(goal.id) && (
                      <div className="border-t bg-secondary/30 animate-in slide-in-from-top-2">
                        <div className="p-4 space-y-4">
                          <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">
                              Goal Description
                            </label>
                            <Textarea
                              value={goal.description}
                              onChange={(e) => updateGoal(goal.id, "description", e.target.value)}
                              className="min-h-[80px]"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-xs font-medium text-muted-foreground mb-1 block">Baseline</label>
                              <Input
                                value={goal.baseline}
                                onChange={(e) => updateGoal(goal.id, "baseline", e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-muted-foreground mb-1 block">Target</label>
                              <Input
                                value={goal.target}
                                onChange={(e) => updateGoal(goal.id, "target", e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* Services */}
            <Card className="p-6 transition-all hover:shadow-lg hover:-translate-y-1">
              <h2 className="text-lg font-semibold text-foreground mb-4">Services ({draft.services.length})</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Service</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Frequency</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Duration</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Provider</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Location</th>
                    </tr>
                  </thead>
                  <tbody>
                    {draft.services.map((service) => (
                      <tr key={service.id} className="border-b last:border-b-0 transition-colors hover:bg-secondary">
                        <td className="py-3 px-2 text-sm font-medium">{service.type}</td>
                        <td className="py-3 px-2 text-sm text-muted-foreground">{service.frequency}</td>
                        <td className="py-3 px-2 text-sm text-muted-foreground">{service.duration}</td>
                        <td className="py-3 px-2 text-sm text-muted-foreground">{service.provider}</td>
                        <td className="py-3 px-2 text-sm text-muted-foreground">{service.location}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Accommodations */}
            <Card className="p-6 transition-all hover:shadow-lg hover:-translate-y-1">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Accommodations ({draft.accommodations.length})
              </h2>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {draft.accommodations.map((accommodation, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-sm p-2 rounded-md transition-all hover:bg-secondary hover:translate-x-1"
                  >
                    <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{accommodation}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {/* Compliance Panel - Right 1/3 */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Card className="p-6 transition-all hover:shadow-lg">
                <h2 className="text-lg font-semibold text-foreground mb-4">Compliance Check</h2>

                {/* Score Circle */}
                <div className="flex justify-center mb-6">
                  <div className="relative w-32 h-32 transition-transform hover:scale-105">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        className="text-secondary"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        strokeLinecap="round"
                        className={getScoreColor(draft.complianceScore)}
                        strokeDasharray={`${draft.complianceScore * 2.512} 251.2`}
                        style={{ transition: "stroke-dasharray 1s ease-out" }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={cn("text-3xl font-bold", getScoreColor(draft.complianceScore))}>
                        {draft.complianceScore}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Compliance Issues */}
                {draft.complianceIssues.length > 0 ? (
                  <div className="space-y-3">
                    {(showAllIssues ? draft.complianceIssues : draft.complianceIssues.slice(0, 3)).map(
                      (issue, index) => (
                        <div
                          key={issue.id}
                          className={cn(
                            "p-3 rounded-lg border transition-all hover:scale-[1.02] hover:translate-x-1",
                            issue.severity === "error" && "bg-destructive/10 border-destructive/20",
                            issue.severity === "warning" && "bg-yellow-100 border-yellow-200",
                            issue.severity === "info" && "bg-primary/10 border-primary/20",
                          )}
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          <div className="flex items-start gap-2">
                            {getSeverityIcon(issue.severity)}
                            <div className="flex-1">
                              <p className="text-sm font-medium text-foreground">{issue.section}</p>
                              <p className="text-xs text-muted-foreground mt-1">{issue.message}</p>
                              {issue.citation && (
                                <button className="flex items-center gap-1 mt-2 text-xs text-primary hover:underline">
                                  <ExternalLink className="w-3 h-3" />
                                  <span>{issue.citation}</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ),
                    )}

                    {draft.complianceIssues.length > 3 && (
                      <button
                        onClick={() => setShowAllIssues(!showAllIssues)}
                        className="w-full text-sm text-primary py-2 hover:underline transition-transform hover:scale-105"
                      >
                        {showAllIssues ? "Show less" : `Show ${draft.complianceIssues.length - 3} more`}
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No compliance issues found</p>
                )}

                {/* Quick Stats */}
                <div className="mt-6 pt-6 border-t space-y-3">
                  {[
                    { label: "FAPE requirements", checked: true },
                    { label: "LRE documented", checked: true },
                    { label: "Services match needs", checked: true },
                  ].map((stat, index) => (
                    <div
                      key={stat.label}
                      className="flex items-center justify-between text-sm p-2 rounded-md transition-all hover:bg-secondary hover:translate-x-1"
                      style={{ animationDelay: `${800 + index * 100}ms` }}
                    >
                      <span className="text-muted-foreground">{stat.label}</span>
                      <Check className="w-4 h-4 text-primary" />
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
