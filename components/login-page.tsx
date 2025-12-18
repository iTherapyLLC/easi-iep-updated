"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, LogIn } from "lucide-react"
import Image from "next/image"

// PRESET PASSWORD - Change this to your desired password
// For production, use an environment variable: process.env.NEXT_PUBLIC_ACCESS_PASSWORD
const PRESET_PASSWORD = "easi2024"

export default function LoginPage() {
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    await new Promise((resolve) => setTimeout(resolve, 500))

    if (password === PRESET_PASSWORD) {
      localStorage.setItem("isAuthenticated", "true")
      localStorage.setItem("authTimestamp", Date.now().toString())
      router.push("/")
    } else {
      setError("Incorrect password. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {/* Large centered logo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.04]">
          <Image src="/easi-logo.png" alt="" width={600} height={600} className="w-[600px] h-[600px] object-contain" />
        </div>
        {/* Scattered logos around the page */}
        <div className="absolute top-[10%] left-[5%] opacity-[0.025] rotate-[-15deg]">
          <Image src="/easi-logo.png" alt="" width={120} height={120} className="w-[120px] h-[120px]" />
        </div>
        <div className="absolute top-[15%] right-[8%] opacity-[0.03] rotate-[20deg]">
          <Image src="/easi-logo.png" alt="" width={100} height={100} className="w-[100px] h-[100px]" />
        </div>
        <div className="absolute bottom-[20%] left-[10%] opacity-[0.025] rotate-[10deg]">
          <Image src="/easi-logo.png" alt="" width={140} height={140} className="w-[140px] h-[140px]" />
        </div>
        <div className="absolute bottom-[15%] right-[5%] opacity-[0.03] rotate-[-10deg]">
          <Image src="/easi-logo.png" alt="" width={110} height={110} className="w-[110px] h-[110px]" />
        </div>
        <div className="absolute top-[40%] left-[2%] opacity-[0.02] rotate-[5deg]">
          <Image src="/easi-logo.png" alt="" width={80} height={80} className="w-[80px] h-[80px]" />
        </div>
        <div className="absolute top-[35%] right-[3%] opacity-[0.02] rotate-[-8deg]">
          <Image src="/easi-logo.png" alt="" width={90} height={90} className="w-[90px] h-[90px]" />
        </div>
        <div className="absolute bottom-[40%] left-[15%] opacity-[0.015] rotate-[25deg]">
          <Image src="/easi-logo.png" alt="" width={70} height={70} className="w-[70px] h-[70px]" />
        </div>
        <div className="absolute top-[5%] left-[40%] opacity-[0.02] rotate-[-5deg]">
          <Image src="/easi-logo.png" alt="" width={60} height={60} className="w-[60px] h-[60px]" />
        </div>
        <div className="absolute bottom-[5%] right-[40%] opacity-[0.02] rotate-[15deg]">
          <Image src="/easi-logo.png" alt="" width={65} height={65} className="w-[65px] h-[65px]" />
        </div>
      </div>

      <div className="w-full max-w-5xl flex flex-col lg:flex-row items-center gap-8 lg:gap-16 relative z-10">
        <div className="hidden lg:flex flex-col items-center flex-1 text-center">
          <div className="relative w-full max-w-md">
            {/* Teacher images grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl overflow-hidden shadow-lg transform hover:scale-105 transition-transform">
                <Image
                  src="/happy-special-education-teacher-smiling-warmly-in-.jpg"
                  alt="Happy special education teacher in classroom"
                  width={200}
                  height={200}
                  className="w-full h-48 object-cover"
                />
              </div>
              <div className="rounded-2xl overflow-hidden shadow-lg transform hover:scale-105 transition-transform mt-8">
                <Image
                  src="/relieved-case-manager-celebrating-completing-paper.jpg"
                  alt="Relieved case manager at desk"
                  width={200}
                  height={200}
                  className="w-full h-48 object-cover"
                />
              </div>
              <div className="rounded-2xl overflow-hidden shadow-lg transform hover:scale-105 transition-transform -mt-4">
                <Image
                  src="/joyful-teacher-high-fiving-student-with-special-ne.jpg"
                  alt="Teacher high-fiving student"
                  width={200}
                  height={200}
                  className="w-full h-48 object-cover"
                />
              </div>
              <div className="rounded-2xl overflow-hidden shadow-lg transform hover:scale-105 transition-transform mt-4">
                <Image
                  src="/smiling-special-education-team-collaborating-at-ie.jpg"
                  alt="Special education team at IEP meeting"
                  width={200}
                  height={200}
                  className="w-full h-48 object-cover"
                />
              </div>
            </div>
            {/* Supportive message */}
            <div className="mt-6 p-4 bg-white/80 backdrop-blur rounded-xl shadow-sm">
              <p className="text-gray-700 font-medium text-lg">"EASI IEP gave me my evenings back."</p>
              <p className="text-gray-500 text-sm mt-1">— Sarah M., Special Education Teacher</p>
            </div>
          </div>
        </div>

        {/* Right side - Login form */}
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white mb-4 shadow-lg p-2">
              <Image
                src="/easi-logo.png"
                alt="EASI IEP Logo"
                width={64}
                height={64}
                className="w-16 h-16 object-contain"
              />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">EASI IEP</h1>
            <p className="text-gray-600">Compliant IEPs in minutes, not hours</p>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Password Input */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-800 placeholder:text-gray-400"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm text-center">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !password}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    Sign In
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <p className="text-center text-gray-500 text-sm mt-6">
            Protected access. Contact administrator for password.
          </p>

          {/* Mobile testimonial - only shows on smaller screens */}
          <div className="lg:hidden mt-8 p-4 bg-white/80 backdrop-blur rounded-xl shadow-sm text-center">
            <p className="text-gray-700 font-medium">"EASI IEP gave me my evenings back."</p>
            <p className="text-gray-500 text-sm mt-1">— Sarah M., Special Education Teacher</p>
          </div>
        </div>
      </div>
    </div>
  )
}
