"use client"

import { useState, useCallback, useRef, useEffect } from "react"

interface UseVoiceOptions {
  onTranscript?: (text: string) => void
  voiceEnabled?: boolean
}

interface SpeechRecognitionEvent {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string
      }
      isFinal: boolean
    }
    length: number
  }
}

interface SpeechRecognitionErrorEvent {
  error: string
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition
    webkitSpeechRecognition: new () => SpeechRecognition
  }
}

export function useVoice({ onTranscript, voiceEnabled = true }: UseVoiceOptions = {}) {
  const [isRecording, setIsRecording] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [voiceOutputEnabled, setVoiceOutputEnabled] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("voice-output-enabled")
      return stored !== null ? stored === "true" : true
    }
    return true
  })

  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Check browser support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    setIsSupported(!!SpeechRecognition)
  }, [])

  // Save voice output preference
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("voice-output-enabled", String(voiceOutputEnabled))
    }
  }, [voiceOutputEnabled])

  // Start speech-to-text recording
  const startRecording = useCallback(() => {
    if (!isSupported || !voiceEnabled) return

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()

    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = "en-US"

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = ""
      let interimTranscript = ""

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          finalTranscript += result[0].transcript
        } else {
          interimTranscript += result[0].transcript
        }
      }

      if (finalTranscript && onTranscript) {
        onTranscript(finalTranscript)
      }
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("[v0] Speech recognition error:", event.error)
      setIsRecording(false)
    }

    recognition.onend = () => {
      setIsRecording(false)
    }

    recognitionRef.current = recognition
    recognition.start()
    setIsRecording(true)
  }, [isSupported, voiceEnabled, onTranscript])

  // Stop speech-to-text recording
  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setIsRecording(false)
  }, [])

  // Toggle recording
  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }, [isRecording, startRecording, stopRecording])

  // Text-to-speech using ElevenLabs
  const speak = useCallback(
    async (text: string) => {
      if (!voiceOutputEnabled || !text) return

      try {
        setIsSpeaking(true)

        const response = await fetch("/api/text-to-speech", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        })

        if (!response.ok) {
          throw new Error("TTS request failed")
        }

        const audioBlob = await response.blob()
        const audioUrl = URL.createObjectURL(audioBlob)

        // Stop any existing audio
        if (audioRef.current) {
          audioRef.current.pause()
          audioRef.current = null
        }

        const audio = new Audio(audioUrl)
        audioRef.current = audio

        audio.onended = () => {
          setIsSpeaking(false)
          URL.revokeObjectURL(audioUrl)
        }

        audio.onerror = () => {
          setIsSpeaking(false)
          URL.revokeObjectURL(audioUrl)
        }

        await audio.play()
      } catch (error) {
        console.error("[v0] TTS error:", error)
        setIsSpeaking(false)
      }
    },
    [voiceOutputEnabled],
  )

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    setIsSpeaking(false)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
      if (audioRef.current) {
        audioRef.current.pause()
      }
    }
  }, [])

  return {
    // Speech-to-text
    isRecording,
    isSupported,
    startRecording,
    stopRecording,
    toggleRecording,
    // Text-to-speech
    isSpeaking,
    speak,
    stopSpeaking,
    // Settings
    voiceOutputEnabled,
    setVoiceOutputEnabled,
  }
}
