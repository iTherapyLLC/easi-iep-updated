"use client"

import { useState } from "react"
import { useIEP } from "@/lib/iep-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Check, AlertTriangle, Info, ChevronDown, ChevronRight, Save, ExternalLink, Edit2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export function DraftReviewPage() {
  const { draft, setDraft, setCurrentStep, addSessionLog } = useIEP()
  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set())
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [showAllIssues, setShowAllIssues] = useState(false)

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
    toast.success("Draft saved successfully")
  }

  const handleSecondLook = () => {
    addSessionLog("MySLP review requested")
    setCurrentStep("myslp-review")
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
    if (score >= 70) return "text-warning"
    return "text-destructive"
  }

  const getSeverityIcon = (severity: "error" | "warning" | "info") => {
    switch (severity) {
      case "error":
        return <AlertTriangle className="w-4 h-4 text-destructive" />
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-warning" />
      case "info":
        return <Info className="w-4 h-4 text-primary" />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Added hover effects to header buttons */}
      <div className="border-b bg-card sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground animate-title-shimmer hover-underline-grow cursor-default inline-block">
              Draft IEP: {draft.studentInfo.name}
            </h1>
            <p className="text-sm text-muted-foreground">Review and edit before second look</p>
          </div>
          <div className="flex items-center gap-3">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button variant="outline" onClick={handleSave} className="press-effect bg-transparent">
                <Save className="w-4 h-4 mr-2" />
                Save Draft
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button onClick={handleSecondLook} className="press-effect hover-glow">
                Ready for Second Look
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Left 2/3 */}
          <div className="lg:col-span-2 space-y-6">
            {/* Present Levels - Added hover-lift */}
            <Card className="p-6 hover-lift">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground hover-underline-grow cursor-default">
                  Present Levels of Performance (PLAAFP)
                </h2>
                <motion.button
                  onClick={() => setEditingSection(editingSection === "plaafp" ? null : "plaafp")}
                  className="p-2 hover:bg-secondary rounded-md transition-colors"
                  whileHover={{ scale: 1.1, rotate: 15 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Edit2 className="w-4 h-4 text-muted-foreground" />
                </motion.button>
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

            {/* Goals - Added hover-lift and enhanced goal item animations */}
            <Card className="p-6 hover-lift">
              <h2 className="text-lg font-semibold text-foreground mb-4 hover-underline-grow cursor-default inline-block">
                Annual Goals ({draft.goals.length})
              </h2>
              <div className="space-y-3">
                {draft.goals.map((goal, index) => (
                  <motion.div
                    key={goal.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border rounded-lg overflow-hidden"
                    whileHover={{ scale: 1.01, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
                  >
                    <button
                      onClick={() => toggleGoal(goal.id)}
                      className="w-full p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors text-left group"
                    >
                      <div className="flex items-center gap-3">
                        <motion.span
                          className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary"
                          whileHover={{ scale: 1.1 }}
                        >
                          {index + 1}
                        </motion.span>
                        <div>
                          <p className="font-medium text-foreground">{goal.area}</p>
                          <p className="text-sm text-muted-foreground line-clamp-1">{goal.description}</p>
                        </div>
                      </div>
                      <motion.div
                        animate={{ rotate: expandedGoals.has(goal.id) ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      </motion.div>
                    </button>

                    <AnimatePresence>
                      {expandedGoals.has(goal.id) && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="border-t bg-secondary/30"
                        >
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
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            </Card>

            {/* Services - Added hover-lift and row hover effects */}
            <Card className="p-6 hover-lift">
              <h2 className="text-lg font-semibold text-foreground mb-4 hover-underline-grow cursor-default inline-block">
                Services
              </h2>
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
                      <motion.tr
                        key={service.id}
                        className="border-b last:border-b-0"
                        whileHover={{ backgroundColor: "var(--secondary)", x: 2 }}
                      >
                        <td className="py-3 px-2 text-sm font-medium">{service.type}</td>
                        <td className="py-3 px-2 text-sm text-muted-foreground">{service.frequency}</td>
                        <td className="py-3 px-2 text-sm text-muted-foreground">{service.duration}</td>
                        <td className="py-3 px-2 text-sm text-muted-foreground">{service.provider}</td>
                        <td className="py-3 px-2 text-sm text-muted-foreground">{service.location}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Accommodations - Added hover-lift and item hover effects */}
            <Card className="p-6 hover-lift">
              <h2 className="text-lg font-semibold text-foreground mb-4 hover-underline-grow cursor-default inline-block">
                Accommodations
              </h2>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {draft.accommodations.map((accommodation, index) => (
                  <motion.li
                    key={index}
                    className="flex items-start gap-2 text-sm p-2 rounded-md cursor-default"
                    whileHover={{ backgroundColor: "var(--secondary)", x: 4 }}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{accommodation}</span>
                  </motion.li>
                ))}
              </ul>
            </Card>
          </div>

          {/* Compliance Panel - Right 1/3 - Added hover-lift */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Card className="p-6 hover-lift">
                <h2 className="text-lg font-semibold text-foreground mb-4 hover-underline-grow cursor-default inline-block">
                  Compliance Check
                </h2>

                {/* Score Circle - Added hover effect to score */}
                <motion.div className="flex justify-center mb-6" whileHover={{ scale: 1.05 }}>
                  <div className="relative w-32 h-32">
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
                      <motion.circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        strokeLinecap="round"
                        className={getScoreColor(draft.complianceScore)}
                        initial={{ strokeDasharray: "0 251.2" }}
                        animate={{
                          strokeDasharray: `${draft.complianceScore * 2.512} 251.2`,
                        }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <motion.span
                        className={cn("text-3xl font-bold", getScoreColor(draft.complianceScore))}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5, type: "spring" }}
                      >
                        {draft.complianceScore}%
                      </motion.span>
                    </div>
                  </div>
                </motion.div>

                {/* Compliance Issues - Added hover effects to issue cards */}
                <div className="space-y-3">
                  {(showAllIssues ? draft.complianceIssues : draft.complianceIssues.slice(0, 3)).map((issue, index) => (
                    <motion.div
                      key={issue.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02, x: 4 }}
                      className={cn(
                        "p-3 rounded-lg border cursor-default",
                        issue.severity === "error" && "bg-destructive/10 border-destructive/20",
                        issue.severity === "warning" && "bg-warning/10 border-warning/20",
                        issue.severity === "info" && "bg-primary/10 border-primary/20",
                      )}
                    >
                      <div className="flex items-start gap-2">
                        {getSeverityIcon(issue.severity)}
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{issue.section}</p>
                          <p className="text-xs text-muted-foreground mt-1">{issue.message}</p>
                          {issue.citation && (
                            <motion.button
                              className="flex items-center gap-1 mt-2 text-xs text-primary"
                              whileHover={{ x: 2 }}
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span className="hover-underline-grow">{issue.citation}</span>
                            </motion.button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {draft.complianceIssues.length > 3 && (
                    <motion.button
                      onClick={() => setShowAllIssues(!showAllIssues)}
                      className="w-full text-sm text-primary py-2 hover-underline-grow"
                      whileHover={{ scale: 1.02 }}
                    >
                      {showAllIssues ? "Show less" : `Show ${draft.complianceIssues.length - 3} more`}
                    </motion.button>
                  )}
                </div>

                {/* Quick Stats - Added hover effects to stat items */}
                <div className="mt-6 pt-6 border-t space-y-3">
                  {[
                    { label: "FAPE requirements", checked: true },
                    { label: "LRE documented", checked: true },
                    { label: "Services match needs", checked: true },
                  ].map((stat, index) => (
                    <motion.div
                      key={stat.label}
                      className="flex items-center justify-between text-sm p-2 rounded-md cursor-default"
                      whileHover={{ backgroundColor: "var(--secondary)", x: 4 }}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 + index * 0.1 }}
                    >
                      <span className="text-muted-foreground">{stat.label}</span>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 1 + index * 0.1, type: "spring" }}
                      >
                        <Check className="w-4 h-4 text-primary" />
                      </motion.div>
                    </motion.div>
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
