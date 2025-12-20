"use client"

import React, { useState } from "react"
import Image from "next/image"

// =============================================================================
// ANIMATED EASI IEP HEADER
// A polished, engaging header with hover animations
// Purely visual - does not interfere with any functionality
// =============================================================================

interface AnimatedHeaderProps {
  onSignOut?: () => void
  showSignOut?: boolean
}

export default function AnimatedHeader({ onSignOut, showSignOut = true }: AnimatedHeaderProps) {
  const [isHovering, setIsHovering] = useState(false)

  return (
    <header className="header">
      <div className="header-content">
        {/* Logo and Title */}
        <div 
          className={`logo-container ${isHovering ? 'hovering' : ''}`}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          {/* Logo Icon */}
          <div className="logo-icon">
            <Image
              src="/easi-logo.png"
              alt="EASI"
              width={44}
              height={44}
              className="logo-image"
            />
            {/* Glow effect on hover */}
            <div className="logo-glow" />
          </div>

          {/* Title with letter animation */}
          <div className="title-container">
            <h1 className="title">
              <span className="letter" style={{ animationDelay: '0ms' }}>E</span>
              <span className="letter" style={{ animationDelay: '30ms' }}>A</span>
              <span className="letter" style={{ animationDelay: '60ms' }}>S</span>
              <span className="letter" style={{ animationDelay: '90ms' }}>I</span>
              <span className="space"> </span>
              <span className="letter iep" style={{ animationDelay: '150ms' }}>I</span>
              <span className="letter iep" style={{ animationDelay: '180ms' }}>E</span>
              <span className="letter iep" style={{ animationDelay: '210ms' }}>P</span>
            </h1>
            <p className="tagline">Compliance made simple</p>
          </div>
        </div>

        {/* Sign Out Button */}
        {showSignOut && onSignOut && (
          <button onClick={onSignOut} className="sign-out-btn">
            <svg 
              width="18" 
              height="18" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Sign Out</span>
          </button>
        )}
      </div>

      <style jsx>{`
        .header {
          width: 100%;
          padding: 16px 24px;
          background: white;
          border-bottom: 1px solid #e5e7eb;
        }

        .header-content {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .logo-container {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          padding: 8px 12px;
          margin: -8px -12px;
          border-radius: 12px;
          transition: background 0.3s ease;
        }

        .logo-container:hover {
          background: rgba(59, 130, 246, 0.05);
        }

        .logo-icon {
          position: relative;
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .logo-image {
          position: relative;
          z-index: 2;
          transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .logo-container.hovering .logo-image {
          transform: scale(1.1) rotate(5deg);
        }

        .logo-glow {
          position: absolute;
          inset: -4px;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%);
          border-radius: 50%;
          opacity: 0;
          transform: scale(0.8);
          transition: opacity 0.3s ease, transform 0.3s ease;
        }

        .logo-container.hovering .logo-glow {
          opacity: 1;
          transform: scale(1.2);
        }

        .title-container {
          display: flex;
          flex-direction: column;
        }

        .title {
          font-size: 28px;
          font-weight: 800;
          color: #1e3a5f;
          margin: 0;
          letter-spacing: -0.5px;
          display: flex;
          align-items: center;
        }

        .letter {
          display: inline-block;
          transition: transform 0.3s ease, color 0.3s ease;
        }

        .letter.iep {
          color: #3b82f6;
        }

        .space {
          width: 8px;
        }

        .logo-container.hovering .letter {
          animation: wave 0.5s ease forwards;
        }

        @keyframes wave {
          0% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
          100% { transform: translateY(0); }
        }

        .logo-container.hovering .letter.iep {
          color: #2563eb;
        }

        .tagline {
          font-size: 12px;
          color: #6b7280;
          margin: 0;
          opacity: 0;
          transform: translateY(-5px);
          transition: opacity 0.3s ease, transform 0.3s ease;
        }

        .logo-container.hovering .tagline {
          opacity: 1;
          transform: translateY(0);
        }

        .sign-out-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: transparent;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          color: #6b7280;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .sign-out-btn:hover {
          background: #f9fafb;
          border-color: #d1d5db;
          color: #374151;
        }

        /* Responsive */
        @media (max-width: 640px) {
          .header {
            padding: 12px 16px;
          }

          .title {
            font-size: 22px;
          }

          .logo-icon {
            width: 36px;
            height: 36px;
          }

          .logo-image {
            width: 36px !important;
            height: 36px !important;
          }

          .sign-out-btn span {
            display: none;
          }

          .sign-out-btn {
            padding: 8px;
          }
        }
      `}</style>
    </header>
  )
}

// =============================================================================
// ALTERNATIVE: Minimal animated title (just the text, no header wrapper)
// Use this if you want to drop it into an existing header
// =============================================================================

export function AnimatedTitle() {
  const [isHovering, setIsHovering] = useState(false)

  return (
    <div 
      className={`animated-title ${isHovering ? 'hovering' : ''}`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <Image
        src="/easi-logo.png"
        alt="EASI"
        width={40}
        height={40}
        className="title-logo"
      />
      <h1 className="title-text">
        <span className="char e">E</span>
        <span className="char a">A</span>
        <span className="char s">S</span>
        <span className="char i1">I</span>
        <span className="char space">&nbsp;</span>
        <span className="char i2">I</span>
        <span className="char e2">E</span>
        <span className="char p">P</span>
      </h1>

      <style jsx>{`
        .animated-title {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          padding: 6px 10px;
          margin: -6px -10px;
          border-radius: 10px;
          transition: background 0.2s ease;
        }

        .animated-title:hover {
          background: rgba(59, 130, 246, 0.06);
        }

        .title-logo {
          transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .animated-title.hovering .title-logo {
          transform: rotate(10deg) scale(1.1);
        }

        .title-text {
          font-size: 26px;
          font-weight: 800;
          color: #1e3a5f;
          margin: 0;
          display: flex;
        }

        .char {
          display: inline-block;
          transition: transform 0.25s ease, color 0.25s ease;
        }

        .char.i2, .char.e2, .char.p {
          color: #3b82f6;
        }

        .char.space {
          width: 6px;
        }

        .animated-title.hovering .char.e { transform: translateY(-3px); transition-delay: 0ms; }
        .animated-title.hovering .char.a { transform: translateY(-3px); transition-delay: 25ms; }
        .animated-title.hovering .char.s { transform: translateY(-3px); transition-delay: 50ms; }
        .animated-title.hovering .char.i1 { transform: translateY(-3px); transition-delay: 75ms; }
        .animated-title.hovering .char.i2 { transform: translateY(-3px); transition-delay: 125ms; }
        .animated-title.hovering .char.e2 { transform: translateY(-3px); transition-delay: 150ms; }
        .animated-title.hovering .char.p { transform: translateY(-3px); transition-delay: 175ms; }

        .animated-title.hovering .char.i2,
        .animated-title.hovering .char.e2,
        .animated-title.hovering .char.p {
          color: #1d4ed8;
        }
      `}</style>
    </div>
  )
}
