import { MongoClient, ObjectId, type Collection, type Db } from "mongodb"

const DB_NAME = "mentor-lagbe-db"

export type ApprovalStatus = "pending" | "approved" | "rejected"
export type TuitionStatus = "active" | "closed"
export type ApplicationStatus = "pending" | "accepted" | "rejected"
export type TuitionMode = "Online" | "Offline" | "Both"

/** A tuition post created by a tutor. */
export type Tuition = {
  tutorId: string
  tutorName?: string
  tutorEmail?: string
  title: string
  subject: string
  classLevel: string
  mode: TuitionMode
  location: string
  monthlyFee: number
  daysPerWeek: number
  description: string
  bannerImage?: string | null
  /** Set by the admin approval flow. */
  approvalStatus: ApprovalStatus
  /** Tutor can open/close a post. */
  status: TuitionStatus
  /**
   * Boolean mirror of `status` used by the Express backend / seed data.
   * A post is closed when either `status === "closed"` or `isActive === false`.
   */
  isActive?: boolean
  createdAt: Date
  updatedAt: Date
}

/** A student's application to a tuition post. */
export type Application = {
  tuitionId: string
  tuitionTitle: string
  tutorId: string
  /** Snapshotted when the student applies (used by the student dashboard). */
  tutorName?: string
  tutorEmail?: string
  monthlyFee?: number
  studentId: string
  studentName: string
  studentEmail: string
  studentPhone?: string
  preferredSchedule: string
  /** Current field name. `studentNote` is the Express/seed alias. */
  note?: string
  studentNote?: string
  subject?: string
  status: ApplicationStatus
  createdAt: Date
  /** Express/seed alias for `createdAt`. */
  appliedAt?: Date
  updatedAt: Date
}

/**
 * Reuse one Mongo connection across hot reloads in development.
 * `lib/auth.ts` opens its own client for Better Auth; this one is for the
 * app's own collections (tuitions, applications).
 */
declare global {
  var __mlMongoClientPromise: Promise<MongoClient> | undefined
}

function getClient(): Promise<MongoClient> {
  const uri = process.env.BETTER_AUTH_DB_URI
  if (!uri) throw new Error("BETTER_AUTH_DB_URI is not set")

  if (!globalThis.__mlMongoClientPromise) {
    globalThis.__mlMongoClientPromise = new MongoClient(uri).connect()
  }
  return globalThis.__mlMongoClientPromise
}

export async function getDb(): Promise<Db> {
  const client = await getClient()
  return client.db(DB_NAME)
}

export async function tuitions(): Promise<Collection<Tuition>> {
  return (await getDb()).collection<Tuition>("tuitions")
}

export async function applications(): Promise<Collection<Application>> {
  return (await getDb()).collection<Application>("applications")
}

/** Better Auth's account collection (`usePlural: false` → "user"). */
export async function users(): Promise<Collection<AppUser>> {
  return (await getDb()).collection<AppUser>("user")
}

export async function payments(): Promise<Collection<Payment>> {
  return (await getDb()).collection<Payment>("payments")
}

/**
 * Tutor contact details live in Better Auth's `user` collection (Mongo adapter
 * stores `_id` as an ObjectId, `usePlural: false`). Used to enrich applications
 * with the tutor's name/email without an extra auth API call.
 */
export type UserContact = { name?: string; email?: string; role?: string }

export async function findUserContacts(
  ids: string[]
): Promise<Map<string, UserContact>> {
  const unique = [...new Set(ids)].filter((id) => ObjectId.isValid(id))
  const map = new Map<string, UserContact>()
  if (unique.length === 0) return map

  const docs = await (await users())
    .find({ _id: { $in: unique.map((id) => new ObjectId(id)) } })
    .toArray()

  for (const doc of docs) {
    map.set(doc._id.toHexString(), {
      name: doc.name,
      email: doc.email,
      role: doc.role,
    })
  }
  return map
}

/** Looks up an account by email (case-insensitive fallback for old rows). */
export async function findUserByEmail(email: string): Promise<AppUser | null> {
  if (!email) return null
  const collection = await users()
  return (
    (await collection.findOne({ email })) ??
    (await collection.findOne({ email: email.toLowerCase() }))
  )
}

/** The public tutor card data for a tuition details page. */
export async function findTutorSummaryByEmail(email: string) {
  const user = await findUserByEmail(email)
  if (!user) return null

  return {
    name: user.name,
    image: user.image ?? null,
    bio: user.bio ?? "",
    plan: user.plan ?? "free",
  }
}

/** Tuition as returned by the API (`_id` is a string). */
export type TuitionDoc = Tuition & { _id: string }

/** Reads one tuition straight from MongoDB (used as an Express fallback). */
export async function findTuitionById(id: string): Promise<TuitionDoc | null> {
  if (!ObjectId.isValid(id)) return null
  const doc = await (await tuitions()).findOne({ _id: new ObjectId(id) })
  return doc ? serializeDoc(doc) : null
}

/** Application as returned by the API (`_id` is a string). */
export type ApplicationDoc = Application & { _id: string }

/** A registered account (Better Auth `user` collection). */
export type AppUser = {
  name?: string
  email: string
  role?: string
  plan?: string
  image?: string | null
  bio?: string | null
  phone?: string | null
  /** Saved tuition ids (stored on the user doc to stay within 4 collections). */
  bookmarks?: string[]
  createdAt?: Date
}

export type AppUserDoc = AppUser & { _id: string }

/** A Stripe subscription payment record (written by the Stripe webhook). */
export type Payment = {
  userId?: string
  userName?: string
  userEmail?: string
  userRole?: string
  planName: string
  /** Amount in major currency units (e.g. 9.99). */
  amount: number
  currency?: string
  transactionId: string
  stripeSessionId?: string
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  /** Express/webhook aliases for the plan + payer email. */
  plan?: string
  audience?: string
  email?: string
  status?: "succeeded" | "pending" | "failed" | "paid"
  /** Express/webhook alias for `status`. */
  paymentStatus?: "paid" | "succeeded" | "pending" | "failed"
  /** Current field name. */
  paymentDate?: Date
  /** Express/webhook alias for `paymentDate`. */
  paidAt?: Date
  createdAt?: Date
}

export type PaymentDoc = Payment & { _id: string }

/** Mongo `_id` (ObjectId) → JSON-safe string. */
export function serializeDoc<T extends { _id?: unknown }>(
  doc: T
): T & { _id: string } {
  return { ...doc, _id: String(doc._id) } as T & { _id: string }
}
