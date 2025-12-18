"use client"

import { IEPWizard } from "@/components/iep-wizard"
import { AuthGuard } from "@/components/auth-guard"

export default function Home() {
  return (
    <AuthGuard>
      <main className="min-h-screen bg-slate-50">
        <IEPWizard />
      </main>
    </AuthGuard>
  )
}
