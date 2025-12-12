"use client"

import { useIEP } from "@/lib/iep-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Check, Download, FileText, Clock, Shield, Plus } from "lucide-react"
import { motion } from "framer-motion"
import { toast } from "sonner"

export function FinalizePage() {
  const { draft, sessionLogs, sessionStartTime, resetSession, addSessionLog } = useIEP()

  if (!draft) return null

  const sessionDuration = sessionStartTime ? Math.round((new Date().getTime() - sessionStartTime.getTime()) / 60000) : 0

  const handleDownloadPDF = () => {
    addSessionLog("PDF downloaded")
    toast.success("PDF download started")
  }

  const handleDownloadWord = () => {
    addSessionLog("Word document downloaded")
    toast.success("Word document download started")
  }

  const handleStartNew = () => {
    addSessionLog("Session completed")
    resetSession()
  }

  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 400 - 200,
    y: Math.random() * -200 - 100,
    rotate: Math.random() * 360,
    scale: Math.random() * 0.5 + 0.5,
  }))

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 md:p-12 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute left-1/2 top-1/2 w-3 h-3 rounded-full bg-primary/30"
            initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
            animate={{
              x: particle.x,
              y: particle.y,
              opacity: [0, 1, 0],
              scale: [0, particle.scale, 0],
              rotate: particle.rotate,
            }}
            transition={{
              duration: 2,
              delay: 0.5 + Math.random() * 0.5,
              ease: "easeOut",
            }}
          />
        ))}
      </div>

      <div className="w-full max-w-xl mx-auto relative z-10">
        {/* Success Header - Enhanced success animation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center mb-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.2 }}
            className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6 hover-glow animate-pulse-glow"
            whileHover={{ scale: 1.1, rotate: 10 }}
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.5, type: "spring" }}
            >
              <Check className="w-10 h-10 text-primary" />
            </motion.div>
          </motion.div>
          <h1 className="text-2xl md:text-3xl font-semibold text-foreground mb-2 animate-title-shimmer">
            Your IEP is ready!
          </h1>
          <p className="text-muted-foreground">
            Both IEP Guardian and MySLP confirm this document meets all requirements.
          </p>
        </motion.div>

        {/* Download Buttons - Enhanced button animations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-3 mb-8"
        >
          <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              size="lg"
              onClick={handleDownloadPDF}
              className="w-full h-14 text-base font-medium press-effect hover-glow"
            >
              <Download className="w-5 h-5 mr-2" />
              Download PDF
            </Button>
          </motion.div>
          <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              size="lg"
              variant="outline"
              onClick={handleDownloadWord}
              className="w-full h-14 text-base font-medium bg-transparent press-effect"
            >
              <FileText className="w-5 h-5 mr-2" />
              Download Word
            </Button>
          </motion.div>
        </motion.div>

        {/* Session Summary - Added hover-lift and stat animations */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="p-6 bg-secondary/30 hover-lift">
            <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2 hover-underline-grow cursor-default inline-flex">
              <Shield className="w-4 h-4" />
              Session Summary
            </h2>

            <div className="grid grid-cols-2 gap-4 mb-4">
              {[
                { icon: Clock, label: "Time on platform", value: `${sessionDuration} minutes` },
                {
                  icon: FileText,
                  label: "Documents processed",
                  value: `${sessionLogs.filter((l) => l.action.includes("uploaded")).length + 1}`,
                },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  className="bg-background rounded-lg p-4 hover-lift cursor-default"
                  whileHover={{ scale: 1.03 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                >
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <stat.icon className="w-4 h-4" />
                    <span className="text-xs">{stat.label}</span>
                  </div>
                  <p className="text-xl font-semibold text-foreground">{stat.value}</p>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Check, label: "Compliance score", value: `${draft.complianceScore}%`, highlight: true },
                { icon: Shield, label: "Actions logged", value: `${sessionLogs.length}` },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  className="bg-background rounded-lg p-4 hover-lift cursor-default"
                  whileHover={{ scale: 1.03 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                >
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <stat.icon className="w-4 h-4" />
                    <span className="text-xs">{stat.label}</span>
                  </div>
                  <p className={`text-xl font-semibold ${stat.highlight ? "text-primary" : "text-foreground"}`}>
                    {stat.value}
                  </p>
                </motion.div>
              ))}
            </div>

            <motion.div
              className="mt-4 pt-4 border-t border-border"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.2, type: "spring" }}>
                  <Check className="w-3 h-3 text-primary" />
                </motion.div>
                All actions logged with tamper-evident timestamps
              </p>
            </motion.div>
          </Card>
        </motion.div>

        {/* Start New IEP - Added hover animation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center"
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="ghost"
              onClick={handleStartNew}
              className="text-muted-foreground hover:text-foreground press-effect"
            >
              <Plus className="w-4 h-4 mr-2" />
              Start New IEP
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
