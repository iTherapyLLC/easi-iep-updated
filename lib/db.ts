import { MongoClient, type Db, type Collection } from "mongodb"

// MongoDB connection singleton
let client: MongoClient | null = null
let db: Db | null = null

export async function connectToDatabase(): Promise<Db> {
  if (db) return db

  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error("MONGODB_URI environment variable is not set")
  }

  client = new MongoClient(uri)
  await client.connect()
  db = client.db() // Uses the database from the connection string

  return db
}

// Collection helpers
export async function getSessionsCollection(): Promise<Collection> {
  const database = await connectToDatabase()
  return database.collection("sessions")
}

export async function getDocumentsCollection(): Promise<Collection> {
  const database = await connectToDatabase()
  return database.collection("documents")
}

export async function getConversationsCollection(): Promise<Collection> {
  const database = await connectToDatabase()
  return database.collection("conversations")
}

export async function getDraftsCollection(): Promise<Collection> {
  const database = await connectToDatabase()
  return database.collection("iep_drafts")
}

export async function getAuditLogCollection(): Promise<Collection> {
  const database = await connectToDatabase()
  return database.collection("audit_log")
}

// Session management
export async function createSession(studentInfo?: {
  name?: string
  grade?: string
  primaryDisability?: string
}) {
  const sessions = await getSessionsCollection()
  const result = await sessions.insertOne({
    createdAt: new Date(),
    updatedAt: new Date(),
    studentName: studentInfo?.name || null,
    studentGrade: studentInfo?.grade || null,
    primaryDisability: studentInfo?.primaryDisability || null,
    status: "in_progress",
  })
  return result.insertedId.toString()
}

export async function updateSession(sessionId: string, data: Record<string, unknown>) {
  const sessions = await getSessionsCollection()
  await sessions.updateOne({ _id: sessionId }, { $set: { ...data, updatedAt: new Date() } })
}

// Document storage
export async function saveDocument(
  sessionId: string,
  doc: {
    filename: string
    fileType: string
    category: string
    extractedText?: string
    structuredData?: Record<string, unknown>
  },
) {
  const documents = await getDocumentsCollection()
  const result = await documents.insertOne({
    sessionId,
    ...doc,
    uploadedAt: new Date(),
  })
  return result.insertedId.toString()
}

// Conversation storage
export async function saveConversation(sessionId: string, messages: Array<{ role: string; content: string }>) {
  const conversations = await getConversationsCollection()
  await conversations.updateOne(
    { sessionId },
    {
      $set: {
        messages,
        updatedAt: new Date(),
      },
    },
    { upsert: true },
  )
}

export async function getConversation(sessionId: string) {
  const conversations = await getConversationsCollection()
  return conversations.findOne({ sessionId })
}

// Draft storage
export async function saveDraft(
  sessionId: string,
  draft: {
    content: Record<string, unknown>
    complianceScore?: number
    warnings?: string[]
  },
) {
  const drafts = await getDraftsCollection()

  // Get current version
  const existing = await drafts.findOne({ sessionId }, { sort: { version: -1 } })
  const version = existing ? (existing.version || 0) + 1 : 1

  const result = await drafts.insertOne({
    sessionId,
    content: draft.content,
    complianceScore: draft.complianceScore || 0,
    warnings: draft.warnings || [],
    version,
    createdAt: new Date(),
  })
  return result.insertedId.toString()
}

export async function getLatestDraft(sessionId: string) {
  const drafts = await getDraftsCollection()
  return drafts.findOne({ sessionId }, { sort: { version: -1 } })
}
