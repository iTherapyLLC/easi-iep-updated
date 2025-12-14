"use client"

import { useState } from "react"
import { useIEP } from "@/lib/iep-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Check, Download, FileText, Clock, Shield, Plus } from "lucide-react"

export function FinalizePage() {
  const { draft, sessionLogs, sessionStartTime, resetSession, addSessionLog } = useIEP()
  const [downloadStatus, setDownloadStatus] = useState<string | null>(null)

  if (!draft) return null

  const sessionDuration = sessionStartTime ? Math.round((new Date().getTime() - sessionStartTime.getTime()) / 60000) : 0

  const handleDownloadPDF = () => {
    addSessionLog("PDF downloaded")
    setDownloadStatus("PDF downloading...")
    setTimeout(() => setDownloadStatus(null), 2000)
  }

  const handleDownloadWord = () => {
    addSessionLog("Word document downloaded")
    setDownloadStatus("Word downloading...")
    setTimeout(() => setDownloadStatus(null), 2000)
  }

  const handleStartNew = () => {
    addSessionLog("Session completed")
    resetSession()
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 md:p-12 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-3 h-3 rounded-full bg-primary/30 animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      <div className="w-full max-w-xl mx-auto relative z-10">
        <div className="text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6 animate-pulse transition-transform hover:scale-110">
            <Check className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold text-foreground mb-2 hover-title-underline">
            Your IEP is ready!
          </h1>
          <p className="text-muted-foreground">
            Both IEP Guardian and MySLP confirm this document meets all requirements.
          </p>
          {downloadStatus && <p className="text-sm text-primary mt-2 animate-pulse">{downloadStatus}</p>}
        </div>

        <div
          className="flex flex-col sm:flex-row gap-3 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500"
          style={{ animationDelay: "150ms" }}
        >
          <Button
            size="lg"
            onClick={handleDownloadPDF}
            className="flex-1 h-14 text-base font-medium transition-transform hover:scale-105 active:scale-95"
          >
            <Download className="w-5 h-5 mr-2" />
            Download PDF
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={handleDownloadWord}
            className="flex-1 h-14 text-base font-medium bg-transparent transition-transform hover:scale-105 active:scale-95"
          >
            <FileText className="w-5 h-5 mr-2" />
            Download Word
          </Button>
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: "300ms" }}>
          <Card className="p-6 bg-secondary/30 transition-all hover:shadow-lg hover:-translate-y-1">
            <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Session Summary
            </h2>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-background rounded-lg p-4 transition-transform hover:scale-105">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs">Time on platform</span>
                </div>
                <p className="text-xl font-semibold text-foreground">{sessionDuration} minutes</p>
              </div>
              <div className="bg-background rounded-lg p-4 transition-transform hover:scale-105">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <FileText className="w-4 h-4" />
                  <span className="text-xs">Documents processed</span>
                </div>
                <p className="text-xl font-semibold text-foreground">
                  {sessionLogs.filter((l) => l.action.includes("uploaded")).length + 1}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-background rounded-lg p-4 transition-transform hover:scale-105">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Check className="w-4 h-4" />
                  <span className="text-xs">Compliance score</span>
                </div>
                <p className="text-xl font-semibold text-primary">{draft.complianceScore}%</p>
              </div>
              <div className="bg-background rounded-lg p-4 transition-transform hover:scale-105">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Shield className="w-4 h-4" />
                  <span className="text-xs">Actions logged</span>
                </div>
                <p className="text-xl font-semibold text-foreground">{sessionLogs.length}</p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <Check className="w-3 h-3 text-primary" />
                All actions logged with tamper-evident timestamps
              </p>
            </div>
          </Card>
        </div>

        <div className="mt-8 text-center animate-in fade-in duration-500" style={{ animationDelay: "450ms" }}>
          <Button
            variant="ghost"
            onClick={handleStartNew}
            className="text-muted-foreground hover:text-foreground transition-transform hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4 mr-2" />
            Start New IEP
          </Button>
        </div>
      </div>
    </div>
  )
}
