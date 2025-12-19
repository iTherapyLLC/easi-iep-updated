"use client"

import type React from "react"

import { useCallback, useState, useRef } from "react"
import { useIEP } from "@/lib/iep-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { FileText, Upload } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"

export function WelcomePage() {
  const { setUploadedFile, setCurrentStep, addSessionLog } = useIEP()
  const [isDragActive, setIsDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (files && files.length > 0) {
        const file = files[0]
        setUploadedFile(file)
        addSessionLog("Document uploaded: " + file.name)
        setCurrentStep("processing")
      }
    },
    [setUploadedFile, setCurrentStep, addSessionLog],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragActive(false)
      handleFiles(e.dataTransfer.files)
    },
    [handleFiles],
  )

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragActive(false)
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files)
  }

  const title = "Let's work on this IEP together"

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 md:p-12">
      <div className="w-full max-w-2xl mx-auto text-center">
        {/* Logo and Title */}
        <div className="mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-24 h-24 mb-6 transition-transform duration-300 hover:scale-110 hover:rotate-3">
            <Image
              src="/images/easi-iep-logo.png"
              alt="EASI IEP Logo"
              width={96}
              height={96}
              className="object-contain"
            />
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold text-foreground mb-3 text-balance hover-title-glow-scale">
            {title}
          </h1>
          <p className="text-lg text-muted-foreground text-pretty animate-fade-in-delay">
            Upload the student{"'"}s current IEP so we can build from there.
          </p>
        </div>

        {/* Upload Zone */}
        <div className="animate-slide-up">
          <Card
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={handleClick}
            className={cn(
              "relative overflow-hidden border-2 border-dashed p-8 md:p-12 transition-all duration-300 cursor-pointer",
              isDragActive
                ? "border-primary bg-primary/5 scale-[1.02]"
                : "border-border hover:border-primary/50 hover:bg-muted/50 hover:shadow-lg hover:-translate-y-1",
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              dir="ltr"
              onChange={handleInputChange}
              accept=".pdf,.png,.jpg,.jpeg,.heic,.doc,.docx"
              className="hidden"
            />

            {/* Animated background when dragging */}
            {isDragActive && <div className="absolute inset-0 bg-primary/10 animate-pulse" />}

            <div className="relative z-10 flex flex-col items-center gap-6">
              <div
                className={cn(
                  "w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center transition-all duration-300",
                  isDragActive ? "scale-110 -translate-y-2" : "hover:scale-105",
                )}
              >
                {isDragActive ? (
                  <Upload className="w-10 h-10 text-primary" />
                ) : (
                  <FileText className="w-10 h-10 text-muted-foreground" />
                )}
              </div>

              <div className="space-y-2">
                <p className="text-lg font-medium text-foreground">
                  {isDragActive ? "Drop your file here" : "Drag and drop your IEP document"}
                </p>
                <p className="text-sm text-muted-foreground">PDF, Word, or images (PNG, JPG, HEIC)</p>
              </div>

              <div className="flex items-center gap-4">
                <div className="h-px w-12 bg-border" />
                <span className="text-sm text-muted-foreground">or</span>
                <div className="h-px w-12 bg-border" />
              </div>

              <Button
                size="lg"
                onClick={(e) => {
                  e.stopPropagation()
                  handleClick()
                }}
                className="min-w-[200px] h-12 text-base font-medium transition-transform active:scale-95"
              >
                Browse Files
              </Button>
            </div>
          </Card>
        </div>

        {/* Reassuring message */}
        <p className="mt-8 text-sm text-muted-foreground animate-fade-in-delay-2">
          Your documents are processed securely and never shared.
        </p>
      </div>
    </div>
  )
}
