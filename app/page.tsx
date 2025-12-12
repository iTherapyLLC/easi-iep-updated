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

export default function Home() {
  const { currentStep } = useIEP()

  return (
    <main className="min-h-screen bg-background">
      <div className="min-h-screen animate-fade-in">
        {currentStep === "welcome" && <WelcomePage />}
        {currentStep === "processing" && <ProcessingPage />}
        {currentStep === "goal-progress" && <GoalProgressPage />}
        {currentStep === "additional-info" && <AdditionalInfoPage />}
        {currentStep === "generating" && <GeneratingPage />}
        {currentStep === "draft-review" && <DraftReviewPage />}
        {currentStep === "myslp-review" && <MySLPReviewPage />}
        {currentStep === "finalize" && <FinalizePage />}
      </div>
    </main>
  )
}
