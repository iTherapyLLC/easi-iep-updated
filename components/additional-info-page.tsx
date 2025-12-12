"use client"

import type React from "react"

import { useState, useCallback, useRef } from "react"
import { useIEP } from "@/lib/iep-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { FileText, Upload, X, ChevronRight, ClipboardList, Stethoscope, Users, Eye } from "lucide-react"
import { cn } from "@/lib/utils"

const documentTypes = [
  { id: "eval", label: "Evaluation reports", icon: ClipboardList },
  { id: "medical", label: "Medical records", icon: Stethoscope },
  { id: "parent", label: "Parent input", icon: Users },
  { id: "teacher", label: "Teacher observations", icon: Eye },
]

export function AdditionalInfoPage() {
  const { additionalFiles, setAdditionalFiles, setCurrentStep, addSessionLog } = useIEP()
  const [uploadedFiles, setUploadedFiles] = useState<File[]>(additionalFiles)
  const [isDragActive, setIsDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (files) {
        const newFiles = Array.from(files)
        setUploadedFiles((prev) => [...prev, ...newFiles])
        addSessionLog(`Additional documents uploaded: ${newFiles.map((f) => f.name).join(", ")}`)
      }
    },
    [addSessionLog],
  )

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragActive(false)
    handleFiles(e.dataTransfer.files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragActive(false)
  }

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleContinue = (skip = false) => {
    if (!skip) {
      setAdditionalFiles(uploadedFiles)
    }
    addSessionLog(skip ? "Skipped additional documents" : "Additional documents submitted")
    setCurrentStep("generating")
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 md:p-12">
      <div className="w-full max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-2xl md:text-3xl font-semibold text-foreground mb-3">
            Anything else that should be in this IEP?
          </h1>
          <p className="text-muted-foreground">Optional: Add any additional documents that might help</p>
        </div>

        {/* Document Type Pills */}
        <div className="flex flex-wrap justify-center gap-3 mb-6">
          {documentTypes.map((type, index) => (
            <div
              key={type.id}
              className="flex items-center gap-2 px-4 py-2 bg-secondary/50 rounded-full text-sm text-muted-foreground animate-fade-in transition-transform hover:scale-105"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <type.icon className="w-4 h-4" />
              {type.label}
            </div>
          ))}
        </div>

        {/* Upload Zone */}
        <div className="animate-slide-up">
          <Card
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "relative overflow-hidden border-2 border-dashed p-8 transition-all duration-300 cursor-pointer",
              isDragActive
                ? "border-primary bg-primary/5 scale-[1.02]"
                : "border-border hover:border-primary/50 hover:shadow-lg",
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={(e) => handleFiles(e.target.files)}
              accept=".pdf,.png,.jpg,.jpeg,.heic,.doc,.docx"
              className="hidden"
            />
            <div className="flex flex-col items-center gap-4 text-center">
              <div
                className={cn(
                  "w-16 h-16 rounded-xl bg-secondary flex items-center justify-center transition-transform",
                  isDragActive ? "scale-110" : "hover:scale-105",
                )}
              >
                <Upload className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">
                  {isDragActive ? "Drop files here" : "Upload additional documents"}
                </p>
                <p className="text-sm text-muted-foreground">Drag files here or click to browse</p>
              </div>
              <Button
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation()
                  fileInputRef.current?.click()
                }}
                className="transition-transform active:scale-95"
              >
                Add Documents
              </Button>
            </div>
          </Card>
        </div>

        {/* Uploaded Files List */}
        {uploadedFiles.length > 0 && (
          <div className="mt-6 space-y-2">
            {uploadedFiles.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg animate-fade-in transition-all hover:bg-secondary"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <FileText className="w-5 h-5 text-primary" />
                <span className="flex-1 text-sm truncate">{file.name}</span>
                <button
                  onClick={() => removeFile(index)}
                  className="p-1 hover:bg-background rounded-md transition-all hover:scale-110"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mt-8 animate-fade-in-delay">
          <Button
            size="lg"
            variant="outline"
            onClick={() => handleContinue(true)}
            className="flex-1 h-12 text-base font-medium transition-transform active:scale-95"
          >
            Skip - Generate Draft
          </Button>
          <Button
            size="lg"
            onClick={() => handleContinue(false)}
            disabled={uploadedFiles.length === 0}
            className="flex-1 h-12 text-base font-medium transition-transform hover:scale-[1.02] active:scale-95"
          >
            Continue with Documents
            <ChevronRight className="w-5 h-5 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  )
}
