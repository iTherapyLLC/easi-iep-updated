"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, LogIn, CheckCircle2, Sparkles, Quote } from "lucide-react"
import Image from "next/image"

// PRESET PASSWORDS - Multiple passwords for different users/purposes
const VALID_PASSWORDS = ["easi2026", "iepguardian", "innervoice", "specialed"]

const TEACHER_IMAGES = [
  {
    src: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&q=80",
    alt: "Happy special education teacher smiling",
  },
  {
    src: "https://images.unsplash.com/photo-1594608661623-aa0bd3a69d98?w=400&h=400&fit=crop&q=80",
    alt: "Relieved case manager",
  },
  {
    src: "https://images.unsplash.com/photo-1580894732444-8ecded7900cd?w=400&h=400&fit=crop&q=80",
    alt: "Teacher helping student learn",
  },
  {
    src: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=400&h=400&fit=crop&q=80",
    alt: "Special education team collaborating",
  },
]

export default function LoginPage() {
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [shake, setShake] = useState(false)
  const router = useRouter()

  const [particles, setParticles] = useState<
    Array<{ id: number; x: number; y: number; size: number; duration: number }>
  >([])

  useEffect(() => {
    const newParticles = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 10 + 10,
    }))
    setParticles(newParticles)
  }, [])

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
    <div className="min-h-screen flex overflow-hidden relative">
      {/* Animated Gradient Background */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-100"
        style={{
          backgroundSize: "400% 400%",
          animation: "gradient-shift 15s ease infinite",
        }}
      />

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute rounded-full bg-blue-400/20"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              animation: `float-particle ${particle.duration}s ease-in-out infinite`,
              animationDelay: `${particle.id * 0.5}s`,
            }}
          />
        ))}
      </div>

      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {/* Top left cluster */}
        <Image
          src="/easi-logo.png"
          alt=""
          width={80}
          height={80}
          className="absolute top-[5%] left-[3%] opacity-[0.03] rotate-[-15deg]"
        />
        <Image
          src="/easi-logo.png"
          alt=""
          width={48}
          height={48}
          className="absolute top-[12%] left-[15%] opacity-[0.025] rotate-[20deg]"
        />
        <Image
          src="/easi-logo.png"
          alt=""
          width={64}
          height={64}
          className="absolute top-[25%] left-[5%] opacity-[0.02] rotate-[-5deg]"
        />

        {/* Top right cluster */}
        <Image
          src="/easi-logo.png"
          alt=""
          width={72}
          height={72}
          className="absolute top-[8%] right-[8%] opacity-[0.03] rotate-[25deg]"
        />
        <Image
          src="/easi-logo.png"
          alt=""
          width={56}
          height={56}
          className="absolute top-[20%] right-[3%] opacity-[0.025] rotate-[-20deg]"
        />
        <Image
          src="/easi-logo.png"
          alt=""
          width={48}
          height={48}
          className="absolute top-[3%] right-[20%] opacity-[0.02] rotate-[10deg]"
        />

        {/* Middle sides */}
        <Image
          src="/easi-logo.png"
          alt=""
          width={60}
          height={60}
          className="absolute top-[45%] left-[2%] opacity-[0.025] rotate-[15deg]"
        />
        <Image
          src="/easi-logo.png"
          alt=""
          width={52}
          height={52}
          className="absolute top-[55%] right-[4%] opacity-[0.03] rotate-[-25deg]"
        />
        <Image
          src="/easi-logo.png"
          alt=""
          width={44}
          height={44}
          className="absolute top-[38%] right-[12%] opacity-[0.02] rotate-[30deg]"
        />

        {/* Bottom clusters */}
        <Image
          src="/easi-logo.png"
          alt=""
          width={68}
          height={68}
          className="absolute bottom-[15%] left-[8%] opacity-[0.03] rotate-[-10deg]"
        />
        <Image
          src="/easi-logo.png"
          alt=""
          width={56}
          height={56}
          className="absolute bottom-[5%] left-[20%] opacity-[0.025] rotate-[15deg]"
        />
        <Image
          src="/easi-logo.png"
          alt=""
          width={76}
          height={76}
          className="absolute bottom-[10%] right-[6%] opacity-[0.03] rotate-[-30deg]"
        />
        <Image
          src="/easi-logo.png"
          alt=""
          width={48}
          height={48}
          className="absolute bottom-[25%] right-[15%] opacity-[0.02] rotate-[5deg]"
        />
        <Image
          src="/easi-logo.png"
          alt=""
          width={40}
          height={40}
          className="absolute bottom-[3%] right-[25%] opacity-[0.025] rotate-[-15deg]"
        />

        {/* Center scattered (subtle) */}
        <Image
          src="/easi-logo.png"
          alt=""
          width={36}
          height={36}
          className="absolute top-[35%] left-[25%] opacity-[0.015] rotate-[20deg]"
        />
        <Image
          src="/easi-logo.png"
          alt=""
          width={32}
          height={32}
          className="absolute top-[65%] left-[30%] opacity-[0.015] rotate-[-10deg]"
        />
        <Image
          src="/easi-logo.png"
          alt=""
          width={40}
          height={40}
          className="absolute top-[50%] right-[25%] opacity-[0.02] rotate-[35deg]"
        />
      </div>

      <div className="hidden lg:flex lg:w-1/2 relative z-10 flex-col justify-center p-12">
        <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
          {TEACHER_IMAGES.map((img, index) => (
            <div
              key={index}
              className="relative aspect-square rounded-2xl overflow-hidden shadow-xl transform hover:scale-105 transition-transform duration-300"
            >
              <img
                src={img.src || "/placeholder.svg"}
                alt={img.alt}
                crossOrigin="anonymous"
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = `/placeholder.svg?height=400&width=400&query=${encodeURIComponent(img.alt)}`
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            </div>
          ))}
        </div>

        <div className="mt-8 max-w-lg mx-auto bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
          <Quote className="w-8 h-8 text-blue-400 mb-3" />
          <p className="text-gray-700 italic text-lg leading-relaxed">
            {
              "EASI IEP saved me hours every week. I finally have time to focus on my students instead of drowning in paperwork."
            }
          </p>
          <p className="mt-4 text-gray-600 font-medium">— Special Education Teacher, California</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className={`w-full max-w-md ${shake ? "animate-shake" : ""}`}>
          {/* Logo/Brand Section */}
          <div className="text-center mb-8">
            <div className="relative inline-block">
              <div
                className="absolute inset-0 bg-blue-400/30 rounded-full blur-xl"
                style={{ animation: "pulse-slow 3s ease-in-out infinite" }}
              />

              <div
                className="relative w-24 h-24 mx-auto mb-4 bg-white rounded-full p-3 shadow-lg"
                style={{ animation: "float 3s ease-in-out infinite" }}
              >
                <Image
                  src="/easi-logo.png"
                  alt="EASI IEP"
                  width={96}
                  height={96}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-2">
              <span>EASI IEP</span>
              <Sparkles className="w-6 h-6 text-blue-500" style={{ animation: "sparkle 2s ease-in-out infinite" }} />
            </h1>
            <p className="text-gray-600">Your IEP compliance guardian</p>
          </div>

          {/* Success State */}
          {isSuccess ? (
            <div
              className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-gray-100 text-center"
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
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-gray-100 transition-all duration-300 hover:shadow-2xl">
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
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div
                    className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm text-center"
                    style={{ animation: "fade-in 0.3s ease-out forwards" }}
                  >
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

              {/* Hint */}
              <p className="text-center text-gray-400 text-xs mt-4">Need access? Contact your administrator</p>
            </div>
          )}

          <div className="lg:hidden mt-8 bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-lg">
            <Quote className="w-6 h-6 text-blue-400 mb-2" />
            <p className="text-gray-700 italic text-sm leading-relaxed">
              {"EASI IEP saved me hours every week. I finally have time to focus on my students."}
            </p>
            <p className="mt-3 text-gray-600 font-medium text-sm">— Special Education Teacher</p>
          </div>

          {/* Footer */}
          <p className="text-center text-gray-500 text-sm mt-6">Powered by EASI IEP Guardian</p>
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes float-particle {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; }
          25% { transform: translateY(-20px) translateX(10px); opacity: 0.6; }
          50% { transform: translateY(-10px) translateX(-10px); opacity: 0.4; }
          75% { transform: translateY(-30px) translateX(5px); opacity: 0.5; }
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
        
        @keyframes fade-in {
          0% { opacity: 0; transform: translateY(-10px); }
          100% { opacity: 1; transform: translateY(0); }
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
