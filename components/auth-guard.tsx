"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface AuthGuardProps {
  children: React.ReactNode
}

// Session timeout in milliseconds (24 hours)
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000

export function AuthGuard({ children }: AuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = () => {
      const authStatus = localStorage.getItem("isAuthenticated")
      const authTimestamp = localStorage.getItem("authTimestamp")

      if (authStatus === "true" && authTimestamp) {
        const elapsed = Date.now() - Number.parseInt(authTimestamp, 10)
        if (elapsed < SESSION_TIMEOUT) {
          setIsAuthenticated(true)
          return
        } else {
          localStorage.removeItem("isAuthenticated")
          localStorage.removeItem("authTimestamp")
        }
      }

      setIsAuthenticated(false)
      router.push("/login")
    }

    checkAuth()
  }, [router])

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100">
        <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return isAuthenticated ? <>{children}</> : null
}
