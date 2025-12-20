"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, LogIn, CheckCircle2, Sparkles } from "lucide-react"

// PRESET PASSWORDS
const VALID_PASSWORDS = ["easi2026", "iepguardian", "innervoice", "specialed"]

// Particle component for background
interface Particle {
  id: number
  x: number
  y: number
  size: number
  speedX: number
  speedY: number
  opacity: number
}

export default function LoginPage() {
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [shake, setShake] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [particles, setParticles] = useState<Particle[]>([])
  const [isIdle, setIsIdle] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)
  const [keystrokes, setKeystrokes] = useState(0)
  const [mounted, setMounted] = useState(false)
  const idleTimerRef = useRef<NodeJS.Timeout>()
  const keystrokeTimeoutRef = useRef<NodeJS.Timeout>()
  const router = useRouter()

  // Initialize particles on mount
  useEffect(() => {
    setMounted(true)
    const initialParticles: Particle[] = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      speedX: (Math.random() - 0.5) * 0.5,
      speedY: (Math.random() - 0.5) * 0.5,
      opacity: Math.random() * 0.3 + 0.1,
    }))
    setParticles(initialParticles)

    // Animate particles using requestAnimationFrame for better performance
    let animationFrameId: number
    const animateParticles = () => {
      setParticles((prev) =>
        prev.map((p) => ({
          ...p,
          x: (p.x + p.speedX + 100) % 100,
          y: (p.y + p.speedY + 100) % 100,
        }))
      )
      animationFrameId = requestAnimationFrame(animateParticles)
    }
    animationFrameId = requestAnimationFrame(animateParticles)

    return () => cancelAnimationFrame(animationFrameId)
  }, [])

  // Idle detection - using useCallback for stable reference
  const resetIdleTimer = useCallback(() => {
    setIsIdle(false)
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current)
    }
    idleTimerRef.current = setTimeout(() => {
      setIsIdle(true)
    }, 3000)
  }, [])

  // Track mouse position
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      })
      resetIdleTimer()
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [resetIdleTimer])

  useEffect(() => {
    resetIdleTimer()
    return () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current)
      }
    }
  }, [resetIdleTimer])

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

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value)
    setKeystrokes((prev) => prev + 1)
    
    // Clear previous timeout to prevent accumulation
    if (keystrokeTimeoutRef.current) {
      clearTimeout(keystrokeTimeoutRef.current)
    }
    keystrokeTimeoutRef.current = setTimeout(() => {
      setKeystrokes((prev) => Math.max(0, prev - 1))
    }, 300)
    
    resetIdleTimer()
  }

  // Dynamic gradient based on mouse position
  const dynamicGradient = {
    background: `radial-gradient(circle at ${mousePosition.x * 100}% ${mousePosition.y * 100}%, rgba(59, 130, 246, 0.15), rgba(99, 102, 241, 0.05))`,
  }

  // Logo parallax effect
  const logoTransform = {
    transform: `translate(${(mousePosition.x - 0.5) * 20}px, ${(mousePosition.y - 0.5) * 20}px)`,
    transition: "transform 0.3s ease-out",
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Dynamic gradient overlay based on mouse */}
      <div className="absolute inset-0 pointer-events-none" style={dynamicGradient} />

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute rounded-full bg-blue-400 transition-all duration-1000"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              opacity: particle.opacity,
              transform: `translate(${(mousePosition.x - 0.5) * -particle.size * 5}px, ${(mousePosition.y - 0.5) * -particle.size * 5}px)`,
              filter: "blur(1px)",
            }}
          />
        ))}
      </div>

      <div className={`w-full max-w-md relative z-10 px-6 ${shake ? "animate-shake" : ""} ${mounted ? "opacity-100" : "opacity-0"}`}>
        {/* Logo/Brand Section with parallax */}
        <div className="text-center mb-8 animate-logo-float">
          <div className="relative inline-block" style={logoTransform}>
            <div className={`absolute inset-0 bg-blue-400/30 rounded-full blur-xl transition-all duration-500 ${isIdle ? "animate-breathing-glow" : ""}`} />
            <div className={`relative w-24 h-24 mx-auto mb-6 ${mounted ? "animate-bounce-in" : ""}`}>
              <img src="/easi-logo.png" alt="EASI IEP" className="w-full h-full object-contain drop-shadow-2xl" />
            </div>
          </div>

          <h1 className={`text-4xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-2 ${mounted ? "animate-fade-in-delay-1" : ""}`}>
            <span>EASI IEP</span>
            <Sparkles className="w-7 h-7 text-blue-500 animate-sparkle" />
          </h1>
          <p className={`text-gray-600 text-lg ${mounted ? "animate-fade-in-delay-2" : ""}`}>
            Your IEP compliance guardian
          </p>
        </div>

        {/* Success State with celebration */}
        {isSuccess ? (
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/50 text-center relative overflow-hidden animate-success-entrance">
            {/* Celebration particles */}
            <div className="absolute inset-0 pointer-events-none">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full animate-particle-burst"
                  style={{
                    left: "50%",
                    top: "50%",
                    animationDelay: `${i * 0.05}s`,
                    transform: `rotate(${i * 30}deg) translateY(-100px)`,
                  }}
                />
              ))}
            </div>

            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center animate-success-check shadow-lg">
              <CheckCircle2 className="w-14 h-14 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome!</h2>
            <p className="text-gray-600 mb-4">Redirecting to your dashboard...</p>
            <div className="flex justify-center">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-premium-spin" />
            </div>
          </div>
        ) : (
          /* Login Card with glassmorphism */
          <div className={`bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/50 transition-all duration-500 hover:shadow-[0_20px_60px_-15px_rgba(59,130,246,0.3)] ${mounted ? "animate-slide-up-delay" : ""}`}>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Password Input */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative group">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    dir="ltr"
                    value={password}
                    onChange={handlePasswordChange}
                    onFocus={() => {
                      setPasswordFocused(true)
                      resetIdleTimer()
                    }}
                    onBlur={() => setPasswordFocused(false)}
                    placeholder="Enter your password"
                    className={`w-full px-4 py-3 pr-12 rounded-xl border-2 border-gray-200 outline-none transition-all duration-300 text-gray-800 placeholder:text-gray-400 ${
                      passwordFocused
                        ? "border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.2)] scale-[1.02]"
                        : "hover:border-blue-300"
                    } ${keystrokes > 0 ? "animate-keystroke-ripple" : ""}`}
                    style={{ direction: 'ltr', unicodeBidi: 'normal', textAlign: 'left' }}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-colors hover:scale-110"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 rounded-xl bg-red-50 border-2 border-red-200 text-red-600 text-sm text-center animate-shake-error">
                  {error}
                </div>
              )}

              {/* Submit Button with magnetic effect */}
              <button
                type="submit"
                disabled={isLoading || !password}
                className={`login-button w-full py-4 px-4 rounded-xl bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 text-white font-bold shadow-lg transition-all duration-300 flex items-center justify-center gap-2 group relative overflow-hidden ${
                  !isLoading && password ? "hover:shadow-[0_10px_40px_rgba(59,130,246,0.5)] hover:scale-[1.02] hover:-translate-y-1" : ""
                } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:scale-100`}
              >
                {/* Ripple effect container */}
                <span className="absolute inset-0 overflow-hidden rounded-xl">
                  <span className="button-ripple" />
                </span>

                {isLoading ? (
                  <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-premium-spin" />
                ) : (
                  <>
                    <LogIn className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                    <span>Sign In</span>
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-gray-400 text-xs mt-6">
              Need access? Contact your administrator
            </p>
          </div>
        )}

        <p className={`text-center text-gray-500 text-sm mt-6 ${mounted ? "animate-fade-in-delay-3" : ""}`}>
          Powered by EASI IEP Guardian
        </p>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes bounce-in {
          0% {
            opacity: 0;
            transform: scale(0.3) translateY(50px);
          }
          50% {
            transform: scale(1.1) translateY(-10px);
          }
          70% {
            transform: scale(0.95) translateY(0);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes logo-float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        .animate-logo-float {
          animation: logo-float 3s ease-in-out infinite;
        }

        @keyframes breathing-glow {
          0%,
          100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.2);
          }
        }

        .animate-breathing-glow {
          animation: breathing-glow 2s ease-in-out infinite;
        }

        @keyframes fade-in-delay-1 {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in-delay-1 {
          animation: fade-in-delay-1 0.6s ease-out 0.3s forwards;
          opacity: 0;
        }

        @keyframes fade-in-delay-2 {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in-delay-2 {
          animation: fade-in-delay-2 0.6s ease-out 0.5s forwards;
          opacity: 0;
        }

        @keyframes fade-in-delay-3 {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }

        .animate-fade-in-delay-3 {
          animation: fade-in-delay-3 0.8s ease-out 0.9s forwards;
          opacity: 0;
        }

        @keyframes slide-up-delay {
          0% {
            opacity: 0;
            transform: translateY(30px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slide-up-delay {
          animation: slide-up-delay 0.8s ease-out 0.7s forwards;
          opacity: 0;
        }

        @keyframes keystroke-ripple {
          0% {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4);
          }
          100% {
            box-shadow: 0 0 0 10px rgba(59, 130, 246, 0);
          }
        }

        .animate-keystroke-ripple {
          animation: keystroke-ripple 0.3s ease-out;
        }

        @keyframes premium-spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        .animate-premium-spin {
          animation: premium-spin 0.8s cubic-bezier(0.4, 0.0, 0.2, 1) infinite;
        }

        @keyframes success-entrance {
          0% {
            opacity: 0;
            transform: scale(0.5);
          }
          60% {
            transform: scale(1.05);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-success-entrance {
          animation: success-entrance 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        @keyframes success-check {
          0% {
            transform: scale(0) rotate(-45deg);
          }
          60% {
            transform: scale(1.2) rotate(10deg);
          }
          100% {
            transform: scale(1) rotate(0deg);
          }
        }

        .animate-success-check {
          animation: success-check 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s forwards;
        }

        @keyframes particle-burst {
          0% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) translateY(-150px) scale(0.5);
          }
        }

        .animate-particle-burst {
          animation: particle-burst 1s ease-out forwards;
        }

        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }

        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          10%,
          30%,
          50%,
          70%,
          90% {
            transform: translateX(-8px);
          }
          20%,
          40%,
          60%,
          80% {
            transform: translateX(8px);
          }
        }

        .animate-shake-error {
          animation: shake 0.4s ease-in-out;
        }

        .login-button:hover .button-ripple {
          animation: button-ripple 0.6s ease-out;
        }

        @keyframes button-ripple {
          0% {
            transform: scale(0);
            opacity: 0.5;
            background: radial-gradient(circle, rgba(255, 255, 255, 0.4) 0%, transparent 70%);
          }
          100% {
            transform: scale(4);
            opacity: 0;
          }
        }

        .button-ripple {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 100%;
          height: 100%;
          pointer-events: none;
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-logo-float,
          .animate-breathing-glow,
          .animate-bounce-in,
          .animate-fade-in-delay-1,
          .animate-fade-in-delay-2,
          .animate-fade-in-delay-3,
          .animate-slide-up-delay,
          .animate-keystroke-ripple,
          .animate-particle-burst {
            animation: none;
            opacity: 1;
            transform: none;
          }
        }
      `}</style>
    </div>
  )
}
