"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

export type WorkflowStep =
  | "welcome"
  | "processing"
  | "goal-progress"
  | "additional-info"
  | "generating"
  | "draft-review"
  | "myslp-review"
  | "finalize"

export interface StudentInfo {
  name: string
  grade: string
  primaryDisability: string
  secondaryDisability?: string
  dob?: string
  dateOfBirth?: string
  age?: string
  school?: string
  district?: string
}

export interface Goal {
  id: string
  area: string
  description?: string
  goal_text?: string
  baseline: string
  target: string
  progress?: string
  status?: "met" | "progressing" | "not-met" | "unknown"
}

export interface Service {
  id?: string
  type: string
  frequency: string
  duration: string
  provider: string
  location?: string
}

export interface PLAAFP {
  strengths?: string
  concerns?: string
  academic?: string
  functional?: string
}

export interface Placement {
  setting?: string
  percent_general_ed?: string
}

export interface Eligibility {
  primary_disability?: string
  secondary_disability?: string
}

export interface Compliance {
  status?: "COMPLIANT" | "NEEDS_REVISION" | "NON_COMPLIANT"
  issues?: string[]
  recommendations?: string[]
}

export interface ComplianceIssue {
  id: string
  severity: "error" | "warning" | "info"
  section: string
  message: string
  citation?: string
}

export interface RawIEPData {
  student?: StudentInfo
  eligibility?: Eligibility
  plaafp?: PLAAFP
  goals?: Goal[]
  services?: Service[]
  accommodations?: string[]
  placement?: Placement
}

export interface IEPDraft {
  studentInfo: StudentInfo
  presentLevels: string
  goals: Goal[]
  services: Service[]
  accommodations: string[]
  complianceScore: number
  complianceIssues: ComplianceIssue[]
}

export interface ExtractedIEPData {
  studentInfo: StudentInfo
  eligibility?: Eligibility
  plaafp?: PLAAFP
  goals: Goal[]
  services: Service[]
  accommodations: string[]
  placement?: Placement
  compliance?: Compliance
  presentLevels?: string
  complianceScore?: number
  complianceIssues?: ComplianceIssue[]
  // Store the raw IEP object from Lambda
  rawIEP?: RawIEPData
}

export interface MySLPReview {
  approved: boolean
  commentary: string
  recommendations: string[]
  clinicalNotes?: string
}

export interface SessionLog {
  id: string
  timestamp: Date
  action: string
  hash?: string
}

interface IEPContextType {
  currentStep: WorkflowStep
  setCurrentStep: (step: WorkflowStep) => void
  uploadedFile: File | null
  setUploadedFile: (file: File | null) => void
  extractedData: ExtractedIEPData | null
  setExtractedData: (data: ExtractedIEPData | ((prev: ExtractedIEPData | null) => ExtractedIEPData) | null) => void
  goalProgressData: string
  setGoalProgressData: (data: string) => void
  additionalFiles: File[]
  setAdditionalFiles: (files: File[]) => void
  draft: IEPDraft | null
  setDraft: (draft: IEPDraft | null) => void
  myslpReview: MySLPReview | null
  setMyslpReview: (review: MySLPReview | null) => void
  sessionLogs: SessionLog[]
  addSessionLog: (action: string, hash?: string) => void
  sessionStartTime: Date | null
  resetSession: () => void
}

const IEPContext = createContext<IEPContextType | null>(null)

export function IEPProvider({ children }: { children: ReactNode }) {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>("welcome")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [extractedData, setExtractedDataState] = useState<ExtractedIEPData | null>(null)
  const [goalProgressData, setGoalProgressData] = useState("")
  const [additionalFiles, setAdditionalFiles] = useState<File[]>([])
  const [draft, setDraft] = useState<IEPDraft | null>(null)
  const [myslpReview, setMyslpReview] = useState<MySLPReview | null>(null)
  const [sessionLogs, setSessionLogs] = useState<SessionLog[]>([])
  const [sessionStartTime] = useState<Date>(new Date())

  const setExtractedData = useCallback(
    (data: ExtractedIEPData | ((prev: ExtractedIEPData | null) => ExtractedIEPData) | null) => {
      if (typeof data === "function") {
        setExtractedDataState(data)
      } else {
        setExtractedDataState(data)
      }
    },
    [],
  )

  const addSessionLog = useCallback((action: string, hash?: string) => {
    setSessionLogs((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        action,
        hash,
      },
    ])
  }, [])

  const resetSession = useCallback(() => {
    setCurrentStep("welcome")
    setUploadedFile(null)
    setExtractedDataState(null)
    setGoalProgressData("")
    setAdditionalFiles([])
    setDraft(null)
    setMyslpReview(null)
    setSessionLogs([])
  }, [])

  return (
    <IEPContext.Provider
      value={{
        currentStep,
        setCurrentStep,
        uploadedFile,
        setUploadedFile,
        extractedData,
        setExtractedData,
        goalProgressData,
        setGoalProgressData,
        additionalFiles,
        setAdditionalFiles,
        draft,
        setDraft,
        myslpReview,
        setMyslpReview,
        sessionLogs,
        addSessionLog,
        sessionStartTime,
        resetSession,
      }}
    >
      {children}
    </IEPContext.Provider>
  )
}

export function useIEP() {
  const context = useContext(IEPContext)
  if (!context) {
    throw new Error("useIEP must be used within an IEPProvider")
  }
  return context
}
