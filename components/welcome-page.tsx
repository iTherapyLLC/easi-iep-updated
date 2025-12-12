"use client"

import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { useIEP } from "@/lib/iep-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { FileText, Upload } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import Image from "next/image"

export function WelcomePage() {
  const { setUploadedFile, setCurrentStep, addSessionLog } = useIEP()
  const [isDragActive, setIsDragActive] = useState(false)

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0]
        setUploadedFile(file)
        addSessionLog("Document uploaded: " + file.name)
        setCurrentStep("processing")
      }
    },
    [setUploadedFile, setCurrentStep, addSessionLog],
  )

  const { getRootProps, getInputProps, open } = useDropzone({
    onDrop,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    accept: {
      "application/pdf": [".pdf"],
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/heic": [".heic"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
    multiple: false,
    noClick: true,
  })

  const letterVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.03,
        duration: 0.4,
        ease: "easeOut",
      },
    }),
  }

  const title = "Let's work on this IEP together"

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 md:p-12">
      <div className="w-full max-w-2xl mx-auto text-center">
        {/* Logo and Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <motion.div
            className="inline-flex items-center justify-center w-24 h-24 mb-6 hover-bounce animate-float"
            whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
            transition={{ duration: 0.5 }}
          >
            <Image
              src="/images/easi-iep-logo.png"
              alt="EASI IEP Logo"
              width={96}
              height={96}
              className="object-contain"
            />
          </motion.div>
          <h1 className="text-3xl md:text-4xl font-semibold text-foreground mb-3 text-balance animate-title-shimmer hover-underline-grow cursor-default">
            <span className="sr-only">{title}</span>
            <span aria-hidden="true">
              {title.split("").map((char, i) => (
                <motion.span
                  key={i}
                  custom={i}
                  initial="hidden"
                  animate="visible"
                  variants={letterVariants}
                  className="inline-block"
                  style={{ whiteSpace: char === " " ? "pre" : "normal" }}
                >
                  {char}
                </motion.span>
              ))}
            </span>
          </h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="text-lg text-muted-foreground text-pretty"
          >
            Upload the student{"'"}s current IEP so we can build from there.
          </motion.p>
        </motion.div>

        {/* Upload Zone - Added hover-lift class for card lift effect */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card
            {...getRootProps()}
            className={cn(
              "relative overflow-hidden border-2 border-dashed p-8 md:p-12 transition-all duration-300 cursor-pointer hover-lift",
              isDragActive
                ? "border-primary bg-primary/5 scale-[1.02]"
                : "border-border hover:border-primary/50 hover:bg-muted/50",
            )}
          >
            <input {...getInputProps()} />

            {/* Animated background pulse when dragging */}
            {isDragActive && (
              <motion.div
                className="absolute inset-0 bg-primary/10"
                animate={{ opacity: [0.3, 0.1, 0.3] }}
                transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
              />
            )}

            <div className="relative z-10 flex flex-col items-center gap-6">
              <motion.div
                animate={isDragActive ? { scale: 1.1, y: -5 } : { scale: 1, y: 0 }}
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ duration: 0.2 }}
                className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center hover-glow"
              >
                {isDragActive ? (
                  <Upload className="w-10 h-10 text-primary" />
                ) : (
                  <FileText className="w-10 h-10 text-muted-foreground" />
                )}
              </motion.div>

              <div className="space-y-2">
                <p className="text-lg font-medium text-foreground">
                  {isDragActive ? "Drop your file here" : "Drag and drop your IEP document"}
                </p>
                <p className="text-sm text-muted-foreground">PDF, Word, or images (PNG, JPG, HEIC)</p>
              </div>

              <div className="flex items-center gap-4">
                <motion.div
                  className="h-px w-12 bg-border"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 1, duration: 0.5 }}
                />
                <span className="text-sm text-muted-foreground">or</span>
                <motion.div
                  className="h-px w-12 bg-border"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 1, duration: 0.5 }}
                />
              </div>

              <Button
                size="lg"
                onClick={open}
                className="min-w-[200px] h-12 text-base font-medium press-effect hover-glow"
              >
                Browse Files
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Reassuring message */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-8 text-sm text-muted-foreground"
        >
          Your documents are processed securely and never shared.
        </motion.p>
      </div>
    </div>
  )
}
