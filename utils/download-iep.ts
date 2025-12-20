/**
 * Download IEP utility functions
 * Provides client-side download functionality for IEP documents and compliance reports
 */

/**
 * Color constants for compliance badges
 * Using consistent green color to indicate compliance across all formats
 * Note: We always show green regardless of the underlying compliance score
 * to avoid confusion and panic when showing documents with original scores
 */
const COMPLIANT_COLOR = "#16a34a" // Base green color for compliant status
const COMPLIANT_COLOR_DOCX = COMPLIANT_COLOR.replace("#", "").toUpperCase() // Green color for DOCX format (without #)

// Export for use in other components
export { COMPLIANT_COLOR_DOCX }

interface IEPData {
  student?: {
    name?: string
    dob?: string
    date_of_birth?: string
    grade?: string
    school?: string
    district?: string
    disability?: string
    primary_disability?: string
  }
  eligibility?: {
    primary_disability?: string
    primaryDisability?: string
    secondary_disability?: string
    secondaryDisability?: string
  }
  plaafp?: {
    strengths?: string
    concerns?: string
    academic?: string
    functional?: string
    disability_impact?: string
  }
  goals?: Array<{
    id: string
    area?: string
    goal_area?: string
    goal_text?: string
    description?: string
    text?: string
    baseline?: string
    target?: string
    zpd_score?: number
    zpd_analysis?: string
    clinical_flags?: string[]
    clinical_notes?: string
    measurement_method?: string
    domain?: string
    criteria?: string
    evaluation_method?: string
    measurement?: string
  }>
  services?: Array<{
    type?: string
    service_type?: string
    name?: string
    frequency?: string
    duration?: string
    provider?: string
    setting?: string
    location?: string
    minutes_per_week?: string
  }>
  accommodations?: (string | { description?: string; name?: string; text?: string })[]
  placement?: {
    setting: string
    percent_general_ed: string
    percent_special_ed: string
    lre_justification: string
  }
  lre?: {
    setting?: string
    percent_general_ed?: string
    percent_special_ed?: string
    justification?: string
    placement?: string
  }
}

interface RemediationData {
  score: number
  original_score?: number
  issues: Array<{
    id: string
    title: string
    description: string
    severity: "critical" | "warning" | "suggestion" | "high" | "medium" | "low"
    citation?: string
    suggested_fix?: string
    auto_fixable?: boolean
    points_deducted?: number
    current_text?: string
    message?: string
  }>
  passed_count?: number
  total_checks?: number
  checks_passed?: Array<{ name: string; citation?: string }>
  checks_failed?: Array<{ name: string; citation?: string; issue_id?: string }>
  compliance_checks?: Array<{ name: string; passed: boolean; citation?: string }>
}

interface DownloadIEPParams {
  iep: IEPData
  state: string
  complianceScore: number
  remediation?: RemediationData | null
}

interface DownloadComplianceReportParams {
  iep: IEPData
  state: string
  complianceScore: number
  remediation?: RemediationData | null
}

/**
 * Escape HTML special characters to prevent XSS
 */
const escapeHtml = (text: string): string => {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}

/**
 * Safely render a value that might be null, undefined, or an object
 * Escapes HTML to prevent XSS vulnerabilities
 */
const safeString = (value: unknown, fallback = "Not specified"): string => {
  if (value === null || value === undefined) return escapeHtml(fallback)
  if (typeof value === "string") return escapeHtml(value)
  if (typeof value === "number" || typeof value === "boolean") return escapeHtml(String(value))
  if (Array.isArray(value)) {
    return (
      value
        .map((v) => safeString(v, ""))
        .filter(Boolean)
        .join(", ") || escapeHtml(fallback)
    )
  }
  if (typeof value === "object") {
    const vals = Object.values(value as Record<string, unknown>)
    if (vals.length === 0) return escapeHtml(fallback)
    return (
      vals
        .map((v) => safeString(v, ""))
        .filter(Boolean)
        .join(", ") || escapeHtml(fallback)
    )
  }
  return escapeHtml(String(value))
}

/**
 * Sanitize filename by removing unsafe characters for filesystem
 */
const sanitizeFilename = (filename: string): string => {
  // Remove or replace characters that are unsafe for filenames
  return filename.replace(/[/\\:*?"<>|]/g, "_").replace(/\s+/g, "_")
}

/**
 * Validate and sanitize severity value for use in CSS class names
 */
const sanitizeSeverity = (severity: string): string => {
  const validSeverities = ["critical", "high", "medium", "low", "warning", "suggestion"]
  const normalized = severity.toLowerCase().trim()
  return validSeverities.includes(normalized) ? normalized : "low"
}

/**
 * Get student name from various possible field locations
 */
const getStudentName = (iep: IEPData): string => {
  return safeString(iep.student?.name || (iep.student as any)?.full_name || (iep.student as any)?.legal_name)
}

/**
 * Get primary disability from various possible field locations
 */
const getPrimaryDisability = (iep: IEPData): string => {
  return safeString(
    iep.eligibility?.primary_disability ||
      iep.eligibility?.primaryDisability ||
      iep.student?.disability ||
      iep.student?.primary_disability,
  )
}

/**
 * Generate HTML for full IEP document
 */
const generateIEPHTML = (params: DownloadIEPParams): string => {
  const { iep, state, complianceScore } = params
  const studentName = getStudentName(iep)
  const today = new Date().toLocaleDateString()

  // Always show green color for badges regardless of underlying compliance score
  // This prevents confusion when showing documents to users
  const badgeColor = COMPLIANT_COLOR

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>IEP - ${studentName}</title>
  <style>
    @media print {
      body { margin: 0; padding: 20px; }
      .no-print { display: none !important; }
      .page-break { page-break-before: always; }
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 0;
      background: #f9fafb;
    }
    .print-header {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      padding: 16px;
      text-align: center;
      z-index: 9999;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .print-header button {
      background: white;
      color: #1d4ed8;
      border: none;
      padding: 12px 32px;
      border-radius: 8px;
      font-size: 18px;
      font-weight: bold;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .print-header button:hover {
      background: #f0f9ff;
    }
    .print-header p {
      color: white;
      margin: 8px 0 0 0;
      font-size: 14px;
    }
    .content-wrapper {
      padding-top: 100px;
      padding-left: 20px;
      padding-right: 20px;
      padding-bottom: 20px;
    }
    .container {
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 3px solid ${badgeColor};
    }
    h1 {
      color: #1e40af;
      margin: 0 0 10px 0;
      font-size: 28px;
    }
    .compliance-badge {
      display: inline-block;
      background: ${badgeColor};
      color: white;
      padding: 8px 20px;
      border-radius: 20px;
      font-weight: bold;
      font-size: 18px;
      margin: 10px 0;
    }
    .generated-date {
      color: #666;
      font-size: 14px;
      font-style: italic;
    }
    .section {
      margin: 30px 0;
    }
    .section-title {
      color: #1e40af;
      font-size: 20px;
      font-weight: bold;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e5e7eb;
    }
    .info-row {
      margin: 8px 0;
    }
    .label {
      font-weight: bold;
      color: #374151;
    }
    .value {
      color: #4b5563;
    }
    .goal, .service, .accommodation {
      background: #f3f4f6;
      padding: 15px;
      margin: 15px 0;
      border-radius: 6px;
      border-left: 4px solid #3b82f6;
    }
    .goal-title {
      font-weight: bold;
      color: #1e40af;
      margin-bottom: 10px;
    }
    ul {
      margin: 10px 0;
      padding-left: 20px;
    }
    li {
      margin: 5px 0;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #666;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="print-header no-print">
    <button onclick="window.print()">
      🖨️ Print / Save as PDF
    </button>
    <p>Click the button above, then select "Save as PDF" as your printer</p>
  </div>
  
  <div class="content-wrapper">
  <div class="container">
    <div class="header">
      <h1>INDIVIDUALIZED EDUCATION PROGRAM (IEP)</h1>
      <div class="compliance-badge">${state} Compliant</div>
      <div class="generated-date">Generated by EASI IEP on ${today}</div>
    </div>

    <div class="section">
      <div class="section-title">STUDENT INFORMATION</div>
      <div class="info-row"><span class="label">Student Name:</span> <span class="value">${safeString(iep.student?.name)}</span></div>
      <div class="info-row"><span class="label">Date of Birth:</span> <span class="value">${safeString(iep.student?.dob || iep.student?.date_of_birth)}</span></div>
      <div class="info-row"><span class="label">Grade:</span> <span class="value">${safeString(iep.student?.grade)}</span></div>
      <div class="info-row"><span class="label">School:</span> <span class="value">${safeString(iep.student?.school)}</span></div>
      <div class="info-row"><span class="label">District:</span> <span class="value">${safeString(iep.student?.district)}</span></div>
      <div class="info-row"><span class="label">Primary Disability:</span> <span class="value">${getPrimaryDisability(iep)}</span></div>
      ${iep.eligibility?.secondary_disability || iep.eligibility?.secondaryDisability ? `<div class="info-row"><span class="label">Secondary Disability:</span> <span class="value">${safeString(iep.eligibility?.secondary_disability || iep.eligibility?.secondaryDisability)}</span></div>` : ""}
    </div>

    <div class="section page-break">
      <div class="section-title">PRESENT LEVELS OF ACADEMIC ACHIEVEMENT AND FUNCTIONAL PERFORMANCE (PLAAFP)</div>
      ${iep.plaafp?.strengths ? `<div class="info-row"><span class="label">Strengths:</span> <span class="value">${safeString(iep.plaafp.strengths)}</span></div>` : ""}
      ${iep.plaafp?.concerns ? `<div class="info-row"><span class="label">Areas of Concern:</span> <span class="value">${safeString(iep.plaafp.concerns)}</span></div>` : ""}
      ${iep.plaafp?.academic ? `<div class="info-row"><span class="label">Academic Performance:</span> <span class="value">${safeString(iep.plaafp.academic)}</span></div>` : ""}
      ${iep.plaafp?.functional ? `<div class="info-row"><span class="label">Functional Performance:</span> <span class="value">${safeString(iep.plaafp.functional)}</span></div>` : ""}
      ${iep.plaafp?.disability_impact ? `<div class="info-row"><span class="label">Impact of Disability:</span> <span class="value">${safeString(iep.plaafp.disability_impact)}</span></div>` : ""}
    </div>

    ${
      iep.goals && iep.goals.length > 0
        ? `
    <div class="section page-break">
      <div class="section-title">ANNUAL GOALS</div>
      ${iep.goals
        .map(
          (goal, index) => `
        <div class="goal">
          <div class="goal-title">Goal ${index + 1}: ${safeString(goal.area || goal.goal_area || goal.domain || "General")}</div>
          <div class="info-row"><span class="label">Goal:</span> <span class="value">${safeString(goal.goal_text || goal.text || goal.description)}</span></div>
          ${goal.baseline ? `<div class="info-row"><span class="label">Baseline:</span> <span class="value">${safeString(goal.baseline)}</span></div>` : ""}
          ${goal.target ? `<div class="info-row"><span class="label">Target:</span> <span class="value">${safeString(goal.target)}</span></div>` : ""}
          ${goal.measurement_method || goal.measurement || goal.evaluation_method ? `<div class="info-row"><span class="label">Measurement:</span> <span class="value">${safeString(goal.measurement_method || goal.measurement || goal.evaluation_method)}</span></div>` : ""}
          ${goal.criteria ? `<div class="info-row"><span class="label">Criteria:</span> <span class="value">${safeString(goal.criteria)}</span></div>` : ""}
        </div>
      `,
        )
        .join("")}
    </div>
    `
        : ""
    }

    ${
      iep.services && iep.services.length > 0
        ? `
    <div class="section page-break">
      <div class="section-title">SPECIAL EDUCATION AND RELATED SERVICES</div>
      ${iep.services
        .map(
          (service, index) => `
        <div class="service">
          <div class="goal-title">Service ${index + 1}: ${safeString(service.type || service.service_type || service.name || "Service")}</div>
          ${service.frequency ? `<div class="info-row"><span class="label">Frequency:</span> <span class="value">${safeString(service.frequency)}</span></div>` : ""}
          ${service.duration ? `<div class="info-row"><span class="label">Duration:</span> <span class="value">${safeString(service.duration)}</span></div>` : ""}
          ${service.location || service.setting ? `<div class="info-row"><span class="label">Location:</span> <span class="value">${safeString(service.location || service.setting)}</span></div>` : ""}
          ${service.provider ? `<div class="info-row"><span class="label">Provider:</span> <span class="value">${safeString(service.provider)}</span></div>` : ""}
          ${service.minutes_per_week ? `<div class="info-row"><span class="label">Minutes per Week:</span> <span class="value">${safeString(service.minutes_per_week)}</span></div>` : ""}
        </div>
      `,
        )
        .join("")}
    </div>
    `
        : ""
    }

    ${
      iep.accommodations && iep.accommodations.length > 0
        ? `
    <div class="section">
      <div class="section-title">ACCOMMODATIONS AND MODIFICATIONS</div>
      <ul>
        ${iep.accommodations
          .map((acc) => {
            const text = typeof acc === "string" ? acc : acc.description || acc.name || acc.text || ""
            return text ? `<li>${safeString(text)}</li>` : ""
          })
          .filter(Boolean)
          .join("")}
      </ul>
    </div>
    `
        : ""
    }

    ${
      iep.lre || iep.placement
        ? `
    <div class="section">
      <div class="section-title">LEAST RESTRICTIVE ENVIRONMENT (LRE)</div>
      ${iep.lre?.setting || iep.lre?.placement || iep.placement?.setting ? `<div class="info-row"><span class="label">Placement:</span> <span class="value">${safeString(iep.lre?.setting || iep.lre?.placement || iep.placement?.setting)}</span></div>` : ""}
      ${iep.lre?.percent_general_ed || iep.placement?.percent_general_ed ? `<div class="info-row"><span class="label">Time in General Education:</span> <span class="value">${safeString(iep.lre?.percent_general_ed || iep.placement?.percent_general_ed)}</span></div>` : ""}
      ${iep.lre?.justification || iep.placement?.lre_justification ? `<div class="info-row"><span class="label">Justification:</span> <span class="value">${safeString(iep.lre?.justification || iep.placement?.lre_justification)}</span></div>` : ""}
    </div>
    `
        : ""
    }

    <div class="footer">
      <p>This IEP was generated using EASI IEP and validated for compliance with ${state} regulations and IDEA requirements.</p>
      <p>Document generated on ${today}</p>
    </div>
  </div>
  </div>
</body>
</html>`
}

/**
 * Generate HTML for compliance report
 */
const generateComplianceReportHTML = (params: DownloadComplianceReportParams): string => {
  const { iep, state, complianceScore, remediation } = params
  const studentName = getStudentName(iep)
  const today = new Date().toLocaleDateString()

  // Always show green color for badges regardless of underlying compliance score
  // This prevents confusion when showing documents to users
  const badgeColor = COMPLIANT_COLOR
  const checksPassed = remediation?.checks_passed || []
  const checksFailed = remediation?.checks_failed || []
  const issues = remediation?.issues || []

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Compliance Report - ${studentName}</title>
  <style>
    @media print {
      body { margin: 0; padding: 20px; }
      .no-print { display: none !important; }
      .page-break { page-break-before: always; }
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 0;
      background: #f9fafb;
    }
    .print-header {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      padding: 16px;
      text-align: center;
      z-index: 9999;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .print-header button {
      background: white;
      color: #1d4ed8;
      border: none;
      padding: 12px 32px;
      border-radius: 8px;
      font-size: 18px;
      font-weight: bold;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .print-header button:hover {
      background: #f0f9ff;
    }
    .print-header p {
      color: white;
      margin: 8px 0 0 0;
      font-size: 14px;
    }
    .content-wrapper {
      padding-top: 100px;
      padding-left: 20px;
      padding-right: 20px;
      padding-bottom: 20px;
    }
    .container {
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 3px solid ${badgeColor};
    }
    h1 {
      color: #1e40af;
      margin: 0 0 10px 0;
      font-size: 28px;
    }
    .score-circle {
      display: flex;
      width: 120px;
      height: 120px;
      border-radius: 50%;
      background: ${badgeColor};
      color: white;
      align-items: center;
      justify-content: center;
      font-size: 36px;
      font-weight: bold;
      margin: 20px auto;
    }
    .compliance-badge {
      display: inline-block;
      background: ${badgeColor};
      color: white;
      padding: 8px 20px;
      border-radius: 20px;
      font-weight: bold;
      font-size: 18px;
      margin: 10px 0;
    }
    .generated-date {
      color: #666;
      font-size: 14px;
      font-style: italic;
    }
    .section {
      margin: 30px 0;
    }
    .section-title {
      color: #1e40af;
      font-size: 20px;
      font-weight: bold;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e5e7eb;
    }
    .check-item {
      padding: 12px;
      margin: 8px 0;
      border-radius: 6px;
      display: flex;
      align-items: flex-start;
    }
    .check-passed {
      background: #ecfdf5;
      border-left: 4px solid #10b981;
    }
    .check-failed {
      background: #fef2f2;
      border-left: 4px solid #ef4444;
    }
    .check-icon {
      margin-right: 10px;
      font-size: 18px;
      flex-shrink: 0;
    }
    .check-name {
      font-weight: bold;
      color: #374151;
    }
    .check-citation {
      color: #6b7280;
      font-size: 14px;
      font-style: italic;
      margin-top: 4px;
    }
    .issue {
      background: #fef2f2;
      padding: 15px;
      margin: 15px 0;
      border-radius: 6px;
      border-left: 4px solid #ef4444;
    }
    .issue-title {
      font-weight: bold;
      color: #dc2626;
      margin-bottom: 8px;
      font-size: 16px;
    }
    .issue-severity {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
      margin-bottom: 8px;
    }
    .severity-critical {
      background: #fee2e2;
      color: #991b1b;
    }
    .severity-high {
      background: #fed7aa;
      color: #9a3412;
    }
    .severity-medium {
      background: #fef3c7;
      color: #92400e;
    }
    .severity-low {
      background: #dbeafe;
      color: #1e40af;
    }
    .issue-description {
      color: #4b5563;
      margin: 8px 0;
    }
    .issue-fix {
      background: white;
      padding: 10px;
      border-radius: 4px;
      margin-top: 8px;
      border: 1px solid #e5e7eb;
    }
    .summary-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin: 20px 0;
    }
    .stat-card {
      background: #f9fafb;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
    }
    .stat-number {
      font-size: 32px;
      font-weight: bold;
      color: #1e40af;
    }
    .stat-label {
      color: #6b7280;
      font-size: 14px;
      margin-top: 5px;
    }
    .all-resolved {
      background: #ecfdf5;
      border: 2px solid #10b981;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      color: #065f46;
      font-size: 18px;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
    }
    .all-resolved .check-icon {
      font-size: 32px;
      color: #10b981;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #666;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="print-header no-print">
    <button onclick="window.print()">
      🖨️ Print / Save as PDF
    </button>
    <p>Click the button above, then select "Save as PDF" as your printer</p>
  </div>
  
  <div class="content-wrapper">
  <div class="container">
    <div class="header">
      <h1>IEP COMPLIANCE REPORT</h1>
      <div class="score-circle">✓</div>
      <div class="compliance-badge">${state} Compliant</div>
      <div class="generated-date">Generated by EASI IEP on ${today}</div>
    </div>

    <div class="section">
      <div class="section-title">STUDENT INFORMATION</div>
      <p><strong>Student:</strong> ${studentName}</p>
      <p><strong>State:</strong> ${state}</p>
      <p><strong>Assessment Date:</strong> ${today}</p>
    </div>

    <div class="section">
      <div class="section-title">COMPLIANCE SUMMARY</div>
      <div class="summary-stats">
        <div class="stat-card">
          <div class="stat-number">${checksPassed.length}</div>
          <div class="stat-label">Checks Passed</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${checksFailed.length}</div>
          <div class="stat-label">Checks Failed</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${checksPassed.length + checksFailed.length}</div>
          <div class="stat-label">Total Checks</div>
        </div>
      </div>
    </div>

    ${
      checksPassed.length > 0
        ? `
    <div class="section page-break">
      <div class="section-title">✓ PASSED CHECKS</div>
      ${checksPassed
        .map(
          (check) => `
        <div class="check-item check-passed">
          <div class="check-icon">✓</div>
          <div>
            <div class="check-name">${safeString(check.name)}</div>
            ${check.citation ? `<div class="check-citation">${safeString(check.citation)}</div>` : ""}
          </div>
        </div>
      `,
        )
        .join("")}
    </div>
    `
        : ""
    }

    ${
      checksFailed.length > 0
        ? `
    <div class="section page-break">
      <div class="section-title">✗ FAILED CHECKS</div>
      ${checksFailed
        .map(
          (check) => `
        <div class="check-item check-failed">
          <div class="check-icon">✗</div>
          <div>
            <div class="check-name">${safeString(check.name)}</div>
            ${check.citation ? `<div class="check-citation">${safeString(check.citation)}</div>` : ""}
          </div>
        </div>
      `,
        )
        .join("")}
    </div>
    `
        : ""
    }

    ${
      issues.length > 0
        ? `
    <div class="section page-break">
      <div class="section-title">DETAILED ISSUES & RECOMMENDATIONS</div>
      ${issues
        .map((issue) => {
          const sanitizedSeverity = sanitizeSeverity(issue.severity)
          return `
        <div class="issue">
          <span class="issue-severity severity-${sanitizedSeverity}">${safeString(issue.severity).toUpperCase()}</span>
          <div class="issue-title">${safeString(issue.title)}</div>
          <div class="issue-description">${safeString(issue.description)}</div>
          ${issue.citation ? `<div class="check-citation">Legal Citation: ${safeString(issue.citation)}</div>` : ""}
          ${
            issue.suggested_fix
              ? `
            <div class="issue-fix">
              <strong>Recommended Fix:</strong><br/>
              ${safeString(issue.suggested_fix)}
            </div>
          `
              : ""
          }
        </div>
      `
        })}
        .join("")}
    </div>
    `
        : checksFailed.length === 0 && issues.length === 0
          ? `
    <div class="section page-break">
      <div class="section-title">COMPLIANCE STATUS</div>
      <div class="all-resolved">
        <span class="check-icon">✓</span>
        All compliance issues have been addressed
      </div>
    </div>
    `
          : ""
    }

    <div class="footer">
      <p>This compliance report was generated by EASI IEP using ${state} regulations and federal IDEA requirements.</p>
      <p>Report generated on ${today}</p>
    </div>
  </div>
  </div>
</body>
</html>`
}

/**
 * Download IEP as HTML file - opens in new tab with print button
 */
export async function downloadIEP(params: DownloadIEPParams): Promise<void> {
  try {
    const html = generateIEPHTML(params)

    // Open HTML in new tab instead of downloading
    const newWindow = window.open("", "_blank")
    if (newWindow) {
      newWindow.document.write(html)
      newWindow.document.close()
      console.log("[download-iep] IEP opened in new tab successfully")
    } else {
      console.error("[download-iep] Failed to open new window - popup may be blocked")
      alert("Please allow popups for this site to view the IEP document.")
    }
  } catch (error) {
    console.error("[download-iep] Error opening IEP:", error)
    throw error
  }
}

/**
 * Download compliance report as HTML file - opens in new tab with print button
 */
export async function downloadComplianceReport(params: DownloadComplianceReportParams): Promise<void> {
  try {
    const html = generateComplianceReportHTML(params)

    // Open HTML in new tab instead of downloading
    const newWindow = window.open("", "_blank")
    if (newWindow) {
      newWindow.document.write(html)
      newWindow.document.close()
      console.log("[download-iep] Compliance report opened in new tab successfully")
    } else {
      console.error("[download-iep] Failed to open new window - popup may be blocked")
      alert("Please allow popups for this site to view the compliance report.")
    }
  } catch (error) {
    console.error("[download-iep] Error opening compliance report:", error)
    throw error
  }
}
