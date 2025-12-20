"use client"

import React, { useState } from "react"
import { 
  CheckCircle, 
  MessageCircle, 
  Lightbulb, 
  ChevronDown, 
  ChevronUp,
  Sparkles,
  FileText,
  Download,
  ArrowRight,
  ThumbsUp,
  AlertCircle,
  HelpCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

// =============================================================================
// TYPES
// =============================================================================

export interface ReviewInsight {
  id: string
  type: "ready" | "suggestion" | "question" | "attention"
  title: string
  description: string
  /** Optional action the user can take */
  action?: {
    label: string
    onClick: () => void
  }
  /** Optional field this relates to */
  field?: string
}

export interface MySLPReviewProps {
  /** Student name for personalization */
  studentName?: string
  /** Is the IEP ready for the meeting? */
  isReady: boolean
  /** List of insights from the SLP review */
  insights: ReviewInsight[]
  /** Handler for downloading the IEP */
  onDownload: () => void
  /** Handler for downloading compliance report */
  onDownloadReport?: () => void
  /** Handler for going back to edit */
  onBackToEdit: () => void
  /** Handler for asking a question */
  onAskQuestion?: (question: string) => void
  /** Reviewer name (optional) */
  reviewerName?: string
}

// =============================================================================
// COMPONENT
// =============================================================================

export function MySLPReview({
  studentName = "Student",
  isReady,
  insights,
  onDownload,
  onDownloadReport,
  onBackToEdit,
  onAskQuestion,
  reviewerName = "MySLP"
}: MySLPReviewProps) {
  const [questionInput, setQuestionInput] = useState("")
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    ready: true,
    attention: true,
    suggestion: true,
    question: true
  })

  // Group insights by type
  const readyInsights = insights.filter(i => i.type === "ready")
  const attentionInsights = insights.filter(i => i.type === "attention")
  const suggestionInsights = insights.filter(i => i.type === "suggestion")
  const questionInsights = insights.filter(i => i.type === "question")

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const handleAskQuestion = () => {
    if (questionInput.trim() && onAskQuestion) {
      onAskQuestion(questionInput)
      setQuestionInput("")
    }
  }

  // Get icon and color for insight type
  const getInsightIcon = (type: ReviewInsight["type"]) => {
    switch (type) {
      case "ready":
        return <CheckCircle className="w-5 h-5 text-primary" />
      case "attention":
        return <AlertCircle className="w-5 h-5 text-amber-500" />
      case "suggestion":
        return <Lightbulb className="w-5 h-5 text-blue-500" />
      case "question":
        return <HelpCircle className="w-5 h-5 text-purple-500" />
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Header Banner */}
      <Card className={cn(
        "p-6",
        isReady 
          ? "bg-primary/10 border-primary/20" 
          : "bg-amber-500/10 border-amber-500/20"
      )}>
        <div className="flex items-start gap-4">
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0",
            isReady ? "bg-primary" : "bg-amber-500"
          )}>
            {isReady ? (
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            ) : (
              <AlertCircle className="w-6 h-6 text-white" />
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold mb-1">
              {isReady 
                ? `Ready for Your IEP Meeting, ${studentName}!` 
                : `${attentionInsights.length} ${attentionInsights.length === 1 ? 'thing needs' : 'things need'} your attention`
              }
            </h1>
            <p className="text-muted-foreground">
              {isReady 
                ? `${reviewerName} has reviewed the IEP and it looks great. Here's what's working well and some ideas to consider.`
                : `${reviewerName} found some items that need your attention before the meeting.`
              }
            </p>
          </div>
        </div>
      </Card>

      {/* Attention Section (if any) */}
      {attentionInsights.length > 0 && (
        <Card className="p-6">
          <button
            onClick={() => toggleSection("attention")}
            className="w-full flex items-center justify-between mb-4 group"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-semibold">Needs Attention</h2>
              <span className="text-sm text-muted-foreground">({attentionInsights.length})</span>
            </div>
            {expandedSections.attention ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            )}
          </button>

          {expandedSections.attention && (
            <div className="space-y-3">
              {attentionInsights.map((insight) => (
                <div key={insight.id} className="flex items-start gap-3 p-3 bg-amber-500/5 rounded-lg border border-amber-500/10">
                  {getInsightIcon(insight.type)}
                  <div className="flex-1">
                    <p className="font-medium text-sm mb-1">{insight.title}</p>
                    <p className="text-sm text-muted-foreground">{insight.description}</p>
                    {insight.action && (
                      <Button
                        variant="link"
                        size="sm"
                        onClick={insight.action.onClick}
                        className="px-0 h-auto mt-2 text-amber-600 hover:text-amber-700"
                      >
                        {insight.action.label}
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* What's Working Well Section */}
      {readyInsights.length > 0 && (
        <Card className="p-6">
          <button
            onClick={() => toggleSection("ready")}
            className="w-full flex items-center justify-between mb-4 group"
          >
            <div className="flex items-center gap-2">
              <ThumbsUp className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">What's Working Well</h2>
              <span className="text-sm text-muted-foreground">({readyInsights.length})</span>
            </div>
            {expandedSections.ready ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            )}
          </button>

          {expandedSections.ready && (
            <div className="space-y-3">
              {readyInsights.map((insight) => (
                <div key={insight.id} className="flex items-start gap-3 p-3 bg-primary/5 rounded-lg">
                  {getInsightIcon(insight.type)}
                  <div className="flex-1">
                    <p className="font-medium text-sm mb-1">{insight.title}</p>
                    <p className="text-sm text-muted-foreground">{insight.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Ideas to Consider Section */}
      {suggestionInsights.length > 0 && (
        <Card className="p-6">
          <button
            onClick={() => toggleSection("suggestion")}
            className="w-full flex items-center justify-between mb-4 group"
          >
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-blue-500" />
              <h2 className="text-lg font-semibold">Ideas to Consider</h2>
              <span className="text-sm text-muted-foreground">({suggestionInsights.length})</span>
            </div>
            {expandedSections.suggestion ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            )}
          </button>

          {expandedSections.suggestion && (
            <div className="space-y-3">
              {suggestionInsights.map((insight) => (
                <div key={insight.id} className="flex items-start gap-3 p-3 bg-blue-500/5 rounded-lg border border-blue-500/10">
                  {getInsightIcon(insight.type)}
                  <div className="flex-1">
                    <p className="font-medium text-sm mb-1">{insight.title}</p>
                    <p className="text-sm text-muted-foreground">{insight.description}</p>
                    {insight.action && (
                      <Button
                        variant="link"
                        size="sm"
                        onClick={insight.action.onClick}
                        className="px-0 h-auto mt-2 text-blue-600 hover:text-blue-700"
                      >
                        {insight.action.label}
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Questions to Discuss Section */}
      {questionInsights.length > 0 && (
        <Card className="p-6">
          <button
            onClick={() => toggleSection("question")}
            className="w-full flex items-center justify-between mb-4 group"
          >
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-purple-500" />
              <h2 className="text-lg font-semibold">Questions to Discuss at the Meeting</h2>
              <span className="text-sm text-muted-foreground">({questionInsights.length})</span>
            </div>
            {expandedSections.question ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            )}
          </button>

          {expandedSections.question && (
            <div className="space-y-3">
              {questionInsights.map((insight) => (
                <div key={insight.id} className="flex items-start gap-3 p-3 bg-purple-500/5 rounded-lg border border-purple-500/10">
                  {getInsightIcon(insight.type)}
                  <div className="flex-1">
                    <p className="font-medium text-sm mb-1">{insight.title}</p>
                    <p className="text-sm text-muted-foreground">{insight.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Ask a Question Section */}
      {onAskQuestion && (
        <Card className="p-6 bg-muted/30">
          <div className="flex items-start gap-3 mb-4">
            <MessageCircle className="w-5 h-5 text-primary mt-1" />
            <div>
              <h3 className="font-semibold mb-1">Ask a question about the IEP</h3>
              <p className="text-sm text-muted-foreground">
                {reviewerName} can help clarify any section or provide more details.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={questionInput}
              onChange={(e) => setQuestionInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAskQuestion()}
              placeholder="e.g., Can you explain the baseline for goal 1?"
              className="flex-1 px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Button 
              onClick={handleAskQuestion}
              disabled={!questionInput.trim()}
            >
              Ask
            </Button>
          </div>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Button
          size="lg"
          onClick={onDownload}
          className="flex-1 h-12 text-base font-medium"
        >
          <Download className="w-4 h-4 mr-2" />
          Download IEP
        </Button>
        {onDownloadReport && (
          <Button
            size="lg"
            variant="outline"
            onClick={onDownloadReport}
            className="flex-1 h-12 text-base font-medium bg-transparent"
          >
            <FileText className="w-4 h-4 mr-2" />
            Download Report
          </Button>
        )}
        <Button
          size="lg"
          variant="outline"
          onClick={onBackToEdit}
          className="flex-1 h-12 text-base font-medium bg-transparent"
        >
          Back to Edit
        </Button>
      </div>
    </div>
  )
}
