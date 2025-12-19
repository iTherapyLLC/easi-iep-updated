"use client"

import type React from "react"

import { useState, useCallback, useRef } from "react"
import { useIEP } from "@/lib/iep-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { FileText, Upload, Mic, MicOff, X, ChevronRight, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"

export function GoalProgressPage() {
  const { extractedData, setGoalProgressData, setCurrentStep, addSessionLog, setAdditionalFiles } = useIEP()
  const [hasData, setHasData] = useState<boolean | null>(null)
  const [textInput, setTextInput] = useState("")
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [isDragActive, setIsDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const studentName = extractedData?.studentInfo?.name || "the student"

  const handleBack = () => {
    addSessionLog("Returned to processing page")
    setCurrentStep("processing")
  }

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (files) {
        const newFiles = Array.from(files)
        setUploadedFiles((prev) => [...prev, ...newFiles])
        addSessionLog(`Progress documents uploaded: ${newFiles.map((f) => f.name).join(", ")}`)
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

  const toggleRecording = () => {
    setIsRecording(!isRecording)
    if (!isRecording) {
      addSessionLog("Voice input started")
    } else {
      addSessionLog("Voice input ended")
    }
  }

  const handleContinue = () => {
    setGoalProgressData(textInput)
    setAdditionalFiles(uploadedFiles)
    addSessionLog("Goal progress information submitted")
    setCurrentStep("additional-info")
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 md:p-12">
      <div className="w-full max-w-2xl mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="text-muted-foreground hover:text-foreground transition-transform hover:scale-105"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Document Review
          </Button>
        </div>

        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-2xl md:text-3xl font-semibold text-foreground mb-3 text-balance hover-title-underline">
            Do you have information about how {studentName} performed on their current goals?
          </h1>
        </div>

        {/* Initial Choice */}
        {hasData === null && (
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up">
            <Button
              size="lg"
              onClick={() => setHasData(true)}
              className="h-14 px-8 text-base font-medium transition-transform hover:scale-105 active:scale-95"
            >
              Yes, I have data
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setHasData(false)}
              className="h-14 px-8 text-base font-medium transition-transform hover:scale-105 active:scale-95"
            >
              Not yet
            </Button>
          </div>
        )}

        {/* Has Data - Upload + Text Input */}
        {hasData === true && (
          <div className="space-y-6 animate-slide-up">
            {/* Upload Zone */}
            <Card
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "relative overflow-hidden border-2 border-dashed p-6 transition-all duration-300 cursor-pointer",
                isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:shadow-lg",
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                dir="ltr"
                onChange={(e) => handleFiles(e.target.files)}
                accept=".pdf,.png,.jpg,.jpeg,.heic,.doc,.docx"
                className="hidden"
              />
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center transition-transform hover:scale-105 hover:rotate-6">
                  <Upload className="w-7 h-7 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-foreground mb-1">Upload data sheets, notes, or work samples</p>
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
                  Browse Files
                </Button>
              </div>
            </Card>

            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                {uploadedFiles.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg transition-all hover:bg-secondary animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <FileText className="w-5 h-5 text-primary" />
                    <span className="flex-1 text-sm truncate">{file.name}</span>
                    <button
                      onClick={() => removeFile(index)}
                      className="p-1 hover:bg-background rounded-md transition-all hover:scale-110 hover:rotate-90"
                    >
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Text Input */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-border" />
                <span className="text-sm text-muted-foreground px-2">or tell me about their progress</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <div className="relative">
                <Textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Describe how the student performed on their goals..."
                  className="min-h-[120px] pr-14 text-base resize-none"
                />
                <button
                  onClick={toggleRecording}
                  className={cn(
                    "absolute right-3 bottom-3 p-2 rounded-full transition-all duration-200",
                    isRecording
                      ? "bg-destructive text-destructive-foreground animate-pulse"
                      : "bg-secondary hover:bg-secondary/80 text-muted-foreground hover:scale-110",
                  )}
                >
                  {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Continue Button */}
            <div className="flex justify-end pt-4">
              <Button
                size="lg"
                onClick={handleContinue}
                disabled={uploadedFiles.length === 0 && !textInput.trim()}
                className="h-12 px-6 text-base font-medium transition-transform active:scale-95"
              >
                Continue
                <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* No Data - Alternative Input */}
        {hasData === false && (
          <div className="space-y-6 animate-slide-up">
            <Card className="p-6 bg-secondary/30 transition-all hover:shadow-lg">
              <p className="text-muted-foreground mb-4">{"That's okay. Can you describe:"}</p>
              <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                <li className="transition-transform hover:translate-x-2">• Areas where {studentName} is struggling?</li>
                <li className="transition-transform hover:translate-x-2">• Areas where they{"'"}ve made progress?</li>
                <li className="transition-transform hover:translate-x-2">• Any new concerns this year?</li>
              </ul>
            </Card>

            <div className="relative">
              <Textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder={`Tell me about ${studentName}'s current performance and any concerns...`}
                className="min-h-[160px] pr-14 text-base resize-none"
              />
              <button
                onClick={toggleRecording}
                className={cn(
                  "absolute right-3 bottom-3 p-2 rounded-full transition-all duration-200",
                  isRecording
                    ? "bg-destructive text-destructive-foreground animate-pulse"
                    : "bg-secondary hover:bg-secondary/80 text-muted-foreground hover:scale-110",
                )}
              >
                {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
            </div>

            {/* Continue Button */}
            <div className="flex justify-end pt-4">
              <Button
                size="lg"
                onClick={handleContinue}
                disabled={!textInput.trim()}
                className="h-12 px-6 text-base font-medium transition-transform active:scale-95"
              >
                Continue
                <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Back button for choices */}
        {hasData !== null && (
          <div className="mt-6 text-center animate-fade-in">
            <button
              onClick={() => setHasData(null)}
              className="text-sm text-muted-foreground hover:text-foreground transition-all hover:-translate-x-1"
            >
              ← Go back
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
