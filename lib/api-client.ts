// Client-side API helper functions

export interface StudentInfo {
  name: string
  grade: string
  primaryDisability: string
  dateOfBirth?: string
  school?: string
}

export interface Goal {
  id: string
  area: string
  description: string
  baseline: string
  target: string
  status?: string
}

export interface ExtractedIEPData {
  studentInfo: StudentInfo
  goals: Goal[]
  presentLevels: string
  services: Array<{
    type: string
    frequency: string
    duration: string
    provider: string
  }>
  accommodations: string[]
}

export interface IEPDraft {
  studentInfo: StudentInfo
  presentLevels: string
  goals: Goal[]
  services: Array<{
    type: string
    frequency: string
    duration: string
    provider: string
  }>
  accommodations: string[]
  assessmentParticipation?: string
  transition?: string
}

export interface ComplianceReview {
  approved: boolean
  score: number
  commentary: string
  recommendations: string[]
  issues: Array<{
    section: string
    issue: string
    severity: "warning" | "error"
    citation?: string
  }>
  complianceChecks: Record<
    string,
    {
      passed: boolean
      note: string
    }
  >
}

// Upload and parse IEP document
export async function uploadIEP(file: File): Promise<{ success: boolean; data?: ExtractedIEPData; error?: string }> {
  const formData = new FormData()
  formData.append("file", file)

  const response = await fetch("/api/upload-iep", {
    method: "POST",
    body: formData,
  })

  return response.json()
}

// Chat with IEP Guardian
export async function sendChatMessage(
  messages: Array<{ role: string; content: string }>,
  studentContext?: Record<string, unknown>,
  sessionId?: string,
): Promise<{ success: boolean; response?: string; error?: string }> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, studentContext, sessionId }),
  })

  return response.json()
}

// Generate IEP draft
export async function generateDraft(data: {
  studentInfo?: StudentInfo
  extractedData?: ExtractedIEPData
  progressData?: string
  additionalDocuments?: string[]
}): Promise<{ success: boolean; draft?: IEPDraft; complianceScore?: number; warnings?: string[]; error?: string }> {
  const response = await fetch("/api/generate-draft", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })

  return response.json()
}

// Request MySLP review
export async function requestMySLPReview(
  draft: IEPDraft,
  studentInfo?: StudentInfo,
  sessionId?: string,
): Promise<{ success: boolean; review?: ComplianceReview; error?: string }> {
  const response = await fetch("/api/myslp-review", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ draft, studentInfo, sessionId }),
  })

  return response.json()
}

// Log action to hash chain
export async function logAction(
  eventType: string,
  eventData: Record<string, unknown>,
  sessionId?: string,
): Promise<{ success: boolean; hash?: string; timestamp?: string; error?: string }> {
  const response = await fetch("/api/log-action", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ eventType, eventData, sessionId }),
  })

  return response.json()
}

// Generate PDF
export async function generatePDF(
  draft: IEPDraft,
  studentInfo?: StudentInfo,
  format: "pdf" | "docx" = "pdf",
): Promise<{ success: boolean; downloadUrl?: string; filename?: string; error?: string }> {
  const response = await fetch("/api/generate-pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ draft, studentInfo, format }),
  })

  return response.json()
}

// Update progress data
export async function updateProgress(data: {
  sessionId?: string
  progressText?: string
  progressFiles?: string[]
}): Promise<{ success: boolean; error?: string }> {
  const response = await fetch("/api/update-progress", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })

  return response.json()
}
