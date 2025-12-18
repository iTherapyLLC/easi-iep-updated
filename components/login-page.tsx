"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, LogIn, CheckCircle2, Sparkles } from "lucide-react"

// PRESET PASSWORDS
const VALID_PASSWORDS = ["easi2026", "iepguardian", "innervoice", "specialed"]

export default function LoginPage() {
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [shake, setShake] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    await new Promise((resolve) => setTimeout(resolve, 500))

    if (VALID_PASSWORDS.includes(password)) {
      setIsSuccess(true)
      localStorage.setItem("isAuthenticated", "true")
      localStorage.setItem("authTimestamp", Date.now().toString())
      await new Promise((resolve) => setTimeout(resolve, 1500))
      router.push("/")
    } else {
      setError("Incorrect password. Please try again.")
      setShake(true)
      setTimeout(() => setShake(false), 500)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Teacher Images */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-blue-600 to-indigo-700 overflow-hidden">
        {/* Main teacher image as background */}
        <div className="absolute inset-0">
          <img src="/teacher1.jpg" alt="Special education teacher" className="w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/80 to-indigo-700/80" />
        </div>

        {/* Floating teacher photo cards */}
        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12">
          <div className="grid grid-cols-2 gap-4 max-w-md">
            <div className="rounded-2xl overflow-hidden shadow-2xl transform hover:scale-105 transition-transform duration-300 rotate-[-3deg]">
              <img src="/teacher2.jpg" alt="Teacher helping student" className="w-full h-40 object-cover" />
            </div>
            <div className="rounded-2xl overflow-hidden shadow-2xl transform hover:scale-105 transition-transform duration-300 rotate-[2deg] mt-8">
              <img src="/teacher3.jpg" alt="Classroom collaboration" className="w-full h-40 object-cover" />
            </div>
            <div className="rounded-2xl overflow-hidden shadow-2xl transform hover:scale-105 transition-transform duration-300 rotate-[3deg]">
              <img src="/teacher4.jpg" alt="Teacher at work" className="w-full h-40 object-cover" />
            </div>
            <div className="rounded-2xl overflow-hidden shadow-2xl transform hover:scale-105 transition-transform duration-300 rotate-[-2deg] mt-8">
              <img src="/teacher1.jpg" alt="Happy teacher" className="w-full h-40 object-cover" />
            </div>
          </div>

          {/* Tagline */}
          <div className="mt-12 text-center text-white">
            <h2 className="text-3xl font-bold mb-3">Built for Educators</h2>
            <p className="text-blue-100 text-lg max-w-sm">
              Spend less time on paperwork, more time with your students.
            </p>
          </div>
        </div>

        {/* Decorative gradient at bottom */}
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-blue-900/50 to-transparent" />
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gradient-to-br from-slate-50 to-blue-50 relative overflow-hidden">
        {/* Background logo decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.03]">
          <img src="/easi-logo.png" alt="" className="absolute -top-20 -right-20 w-64 h-64 rotate-[15deg]" />
          <img src="/easi-logo.png" alt="" className="absolute -bottom-20 -left-20 w-64 h-64 rotate-[-15deg]" />
          <img src="/easi-logo.png" alt="" className="absolute top-1/3 left-10 w-32 h-32 rotate-[25deg]" />
          <img src="/easi-logo.png" alt="" className="absolute bottom-1/4 right-10 w-40 h-40 rotate-[-10deg]" />
        </div>

        <div className={`w-full max-w-md relative z-10 ${shake ? "animate-shake" : ""}`}>
          {/* Logo/Brand Section */}
          <div className="text-center mb-8">
            <div className="relative inline-block">
              <div
                className="absolute inset-0 bg-blue-400/30 rounded-full blur-xl"
                style={{ animation: "pulse-slow 3s ease-in-out infinite" }}
              />
              <div className="relative w-20 h-20 mx-auto mb-4" style={{ animation: "float 3s ease-in-out infinite" }}>
                <img src="/easi-logo.png" alt="EASI IEP" className="w-full h-full object-contain drop-shadow-lg" />
              </div>
            </div>

            <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-2">
              <span>EASI IEP</span>
              <Sparkles className="w-6 h-6 text-blue-500" style={{ animation: "sparkle 2s ease-in-out infinite" }} />
            </h1>
            <p className="text-gray-600">Your IEP compliance guardian</p>
          </div>

          {/* Mobile-only teacher image */}
          <div className="lg:hidden mb-6 rounded-2xl overflow-hidden shadow-lg">
            <img src="/teacher1.jpg" alt="Teacher" className="w-full h-32 object-cover" />
          </div>

          {/* Success State */}
          {isSuccess ? (
            <div
              className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 text-center"
              style={{ animation: "success-pop 0.5s ease-out forwards" }}
            >
              <div
                className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center"
                style={{ animation: "success-check 0.6s ease-out 0.2s forwards", transform: "scale(0)" }}
              >
                <CheckCircle2 className="w-12 h-12 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome!</h2>
              <p className="text-gray-600">Redirecting to your dashboard...</p>
              <div className="mt-4 flex justify-center">
                <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            </div>
          ) : (
            /* Login Card */
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 transition-all duration-300 hover:shadow-2xl">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Password Input */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative group">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-800 placeholder:text-gray-400 group-hover:border-blue-300"
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm text-center">
                    {error}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading || !password}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 text-white font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 transition-all duration-300 flex items-center justify-center gap-2 group"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <LogIn className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                      <span>Sign In</span>
                    </>
                  )}
                </button>
              </form>

              <p className="text-center text-gray-400 text-xs mt-4">Need access? Contact your administrator</p>
            </div>
          )}

          <p className="text-center text-gray-500 text-sm mt-6">Powered by EASI IEP Guardian</p>
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.1); }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 1; transform: scale(1) rotate(0deg); }
          50% { opacity: 0.7; transform: scale(1.2) rotate(15deg); }
        }
        @keyframes success-pop {
          0% { transform: scale(0.8); opacity: 0; }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes success-check {
          0% { transform: scale(0); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
      `}</style>
    </div>
  )
}
