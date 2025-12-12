"use client"

import { useIEP } from "@/lib/iep-context"
import { WelcomePage } from "@/components/welcome-page"
import { ProcessingPage } from "@/components/processing-page"
import { GoalProgressPage } from "@/components/goal-progress-page"
import { AdditionalInfoPage } from "@/components/additional-info-page"
import { GeneratingPage } from "@/components/generating-page"
import { DraftReviewPage } from "@/components/draft-review-page"
import { MySLPReviewPage } from "@/components/myslp-review-page"
import { FinalizePage } from "@/components/finalize-page"
import { AnimatePresence, motion } from "framer-motion"

export default function Home() {
  const { currentStep } = useIEP()

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  }

  return (
    <main className="min-h-screen bg-background">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="min-h-screen"
        >
          {currentStep === "welcome" && <WelcomePage />}
          {currentStep === "processing" && <ProcessingPage />}
          {currentStep === "goal-progress" && <GoalProgressPage />}
          {currentStep === "additional-info" && <AdditionalInfoPage />}
          {currentStep === "generating" && <GeneratingPage />}
          {currentStep === "draft-review" && <DraftReviewPage />}
          {currentStep === "myslp-review" && <MySLPReviewPage />}
          {currentStep === "finalize" && <FinalizePage />}
        </motion.div>
      </AnimatePresence>
    </main>
  )
}
