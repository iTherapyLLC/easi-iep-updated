"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { useIEP } from "@/lib/iep-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { FileText, Upload, Mic, MicOff, X, ChevronRight } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

export function GoalProgressPage() {
  const { extractedData, setGoalProgressData, setCurrentStep, addSessionLog, setAdditionalFiles } = useIEP()
  const [hasData, setHasData] = useState<boolean | null>(null)
  const [textInput, setTextInput] = useState("")
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [isRecording, setIsRecording] = useState(false)

  const studentName = extractedData?.studentInfo?.name || "the student"

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setUploadedFiles((prev) => [...prev, ...acceptedFiles])
      addSessionLog(`Progress documents uploaded: ${acceptedFiles.map((f) => f.name).join(", ")}`)
    },
    [addSessionLog],
  )

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/heic": [".heic"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
    noClick: true,
  })

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

  const titleWords = `Do you have information about how ${studentName} performed on their current goals?`.split(" ")

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 md:p-12">
      <div className="w-full max-w-2xl mx-auto">
        {/* Header - Added word-by-word animation and shimmer effect */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-semibold text-foreground mb-3 text-balance animate-title-shimmer cursor-default">
            {titleWords.map((word, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                className="inline-block mr-[0.25em]"
              >
                {word}
              </motion.span>
            ))}
          </h1>
        </motion.div>

        {/* Initial Choice - Added enhanced button animations */}
        <AnimatePresence mode="wait">
          {hasData === null && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                <Button
                  size="lg"
                  onClick={() => setHasData(true)}
                  className="h-14 px-8 text-base font-medium press-effect hover-glow w-full"
                >
                  Yes, I have data
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setHasData(false)}
                  className="h-14 px-8 text-base font-medium press-effect w-full"
                >
                  Not yet
                </Button>
              </motion.div>
            </motion.div>
          )}

          {/* Has Data - Upload + Text Input */}
          {hasData === true && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Upload Zone - Added hover-lift */}
              <Card
                {...getRootProps()}
                className={cn(
                  "relative overflow-hidden border-2 border-dashed p-6 transition-all duration-300 hover-lift",
                  isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
                )}
              >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-4 text-center">
                  <motion.div
                    className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center hover-glow"
                    whileHover={{ rotate: 10, scale: 1.05 }}
                  >
                    <Upload className="w-7 h-7 text-muted-foreground" />
                  </motion.div>
                  <div>
                    <p className="font-medium text-foreground mb-1">Upload data sheets, notes, or work samples</p>
                    <p className="text-sm text-muted-foreground">Drag files here or click to browse</p>
                  </div>
                  <Button variant="secondary" onClick={open} className="press-effect">
                    Browse Files
                  </Button>
                </div>
              </Card>

              {/* Uploaded Files List - Added hover effect to file items */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <motion.div
                      key={`${file.name}-${index}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      whileHover={{ x: 4, backgroundColor: "var(--secondary)" }}
                      className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg cursor-default"
                    >
                      <FileText className="w-5 h-5 text-primary" />
                      <span className="flex-1 text-sm truncate">{file.name}</span>
                      <motion.button
                        onClick={() => removeFile(index)}
                        className="p-1 hover:bg-background rounded-md transition-colors"
                        whileHover={{ scale: 1.1, rotate: 90 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <X className="w-4 h-4 text-muted-foreground" />
                      </motion.button>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Text Input */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <motion.div
                    className="h-px flex-1 bg-border"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.5 }}
                  />
                  <span className="text-sm text-muted-foreground px-2">or tell me about their progress</span>
                  <motion.div
                    className="h-px flex-1 bg-border"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.5 }}
                  />
                </div>

                <div className="relative">
                  <Textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Describe how the student performed on their goals..."
                    className="min-h-[120px] pr-14 text-base resize-none"
                  />
                  <motion.button
                    onClick={toggleRecording}
                    className={cn(
                      "absolute right-3 bottom-3 p-2 rounded-full transition-all duration-200",
                      isRecording
                        ? "bg-destructive text-destructive-foreground"
                        : "bg-secondary hover:bg-secondary/80 text-muted-foreground",
                    )}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    animate={isRecording ? { scale: [1, 1.1, 1] } : {}}
                    transition={isRecording ? { repeat: Number.POSITIVE_INFINITY, duration: 1 } : {}}
                  >
                    {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </motion.button>
                </div>
              </div>

              {/* Continue Button */}
              <div className="flex justify-end pt-4">
                <Button
                  size="lg"
                  onClick={handleContinue}
                  disabled={uploadedFiles.length === 0 && !textInput.trim()}
                  className="h-12 px-6 text-base font-medium press-effect hover-glow"
                >
                  Continue
                  <ChevronRight className="w-5 h-5 ml-1" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* No Data - Alternative Input */}
          {hasData === false && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <Card className="p-6 bg-secondary/30 hover-lift">
                <p className="text-muted-foreground mb-4">{"That's okay. Can you describe:"}</p>
                <ul className="space-y-2 text-sm text-muted-foreground mb-4 stagger-children">
                  <li className="flex items-center gap-2">
                    <motion.span className="inline-block" whileHover={{ x: 4 }}>
                      • Areas where {studentName} is struggling?
                    </motion.span>
                  </li>
                  <li className="flex items-center gap-2">
                    <motion.span className="inline-block" whileHover={{ x: 4 }}>
                      • Areas where they{"'"}ve made progress?
                    </motion.span>
                  </li>
                  <li className="flex items-center gap-2">
                    <motion.span className="inline-block" whileHover={{ x: 4 }}>
                      • Any new concerns this year?
                    </motion.span>
                  </li>
                </ul>
              </Card>

              <div className="relative">
                <Textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder={`Tell me about ${studentName}'s current performance and any concerns...`}
                  className="min-h-[160px] pr-14 text-base resize-none"
                />
                <motion.button
                  onClick={toggleRecording}
                  className={cn(
                    "absolute right-3 bottom-3 p-2 rounded-full transition-all duration-200",
                    isRecording
                      ? "bg-destructive text-destructive-foreground"
                      : "bg-secondary hover:bg-secondary/80 text-muted-foreground",
                  )}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  animate={isRecording ? { scale: [1, 1.1, 1] } : {}}
                  transition={isRecording ? { repeat: Number.POSITIVE_INFINITY, duration: 1 } : {}}
                >
                  {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </motion.button>
              </div>

              {/* Continue Button */}
              <div className="flex justify-end pt-4">
                <Button
                  size="lg"
                  onClick={handleContinue}
                  disabled={!textInput.trim()}
                  className="h-12 px-6 text-base font-medium press-effect hover-glow"
                >
                  Continue
                  <ChevronRight className="w-5 h-5 ml-1" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Back button - Added hover animation */}
        {hasData !== null && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 text-center">
            <motion.button
              onClick={() => setHasData(null)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors hover-underline-grow"
              whileHover={{ x: -4 }}
            >
              ← Go back
            </motion.button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
