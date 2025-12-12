"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { useIEP } from "@/lib/iep-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { FileText, Upload, X, ChevronRight, ClipboardList, Stethoscope, Users, Eye } from "lucide-react"
import { motion } from "framer-motion"
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

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setUploadedFiles((prev) => [...prev, ...acceptedFiles])
      addSessionLog(`Additional documents uploaded: ${acceptedFiles.map((f) => f.name).join(", ")}`)
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
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-semibold text-foreground mb-3">
            Anything else that should be in this IEP?
          </h1>
          <p className="text-muted-foreground">Optional: Add any additional documents that might help</p>
        </motion.div>

        {/* Document Type Pills */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap justify-center gap-3 mb-6"
        >
          {documentTypes.map((type, index) => (
            <motion.div
              key={type.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              className="flex items-center gap-2 px-4 py-2 bg-secondary/50 rounded-full text-sm text-muted-foreground"
            >
              <type.icon className="w-4 h-4" />
              {type.label}
            </motion.div>
          ))}
        </motion.div>

        {/* Upload Zone */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card
            {...getRootProps()}
            className={cn(
              "relative overflow-hidden border-2 border-dashed p-8 transition-all duration-300",
              isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
            )}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-4 text-center">
              <motion.div
                animate={isDragActive ? { scale: 1.1 } : { scale: 1 }}
                className="w-16 h-16 rounded-xl bg-secondary flex items-center justify-center"
              >
                <Upload className="w-8 h-8 text-muted-foreground" />
              </motion.div>
              <div>
                <p className="font-medium text-foreground mb-1">
                  {isDragActive ? "Drop files here" : "Upload additional documents"}
                </p>
                <p className="text-sm text-muted-foreground">Drag files here or click to browse</p>
              </div>
              <Button variant="secondary" onClick={open}>
                Add Documents
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Uploaded Files List */}
        {uploadedFiles.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 space-y-2">
            {uploadedFiles.map((file, index) => (
              <motion.div
                key={`${file.name}-${index}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg"
              >
                <FileText className="w-5 h-5 text-primary" />
                <span className="flex-1 text-sm truncate">{file.name}</span>
                <button
                  onClick={() => removeFile(index)}
                  className="p-1 hover:bg-background rounded-md transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-3 mt-8"
        >
          <Button
            size="lg"
            variant="outline"
            onClick={() => handleContinue(true)}
            className="flex-1 h-12 text-base font-medium"
          >
            Skip - Generate Draft
          </Button>
          <Button
            size="lg"
            onClick={() => handleContinue(false)}
            disabled={uploadedFiles.length === 0}
            className="flex-1 h-12 text-base font-medium transition-all duration-200 hover:scale-[1.02] active:scale-100"
          >
            Continue with Documents
            <ChevronRight className="w-5 h-5 ml-1" />
          </Button>
        </motion.div>
      </div>
    </div>
  )
}
