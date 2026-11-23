import type { Filter } from "mongodb"

import { apiError, getSessionUser } from "@/lib/api"
import {
  findUserContacts,
  serializeDoc,
  tuitions,
  type Tuition,
} from "@/lib/db"
import { FREE_TUITION_LIMIT, parseTuitionInput } from "@/lib/tuition"

const MAX_LIMIT = 24
const DEFAULT_LIMIT = 9

/** Escape user input before using it in a Mongo `$regex`. */
function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function positiveInt(value: string | null, fallback: number) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

/**
 * GET /api/tuitions
 * - `?scope=approved` → public marketplace: every approved, open post.
 *   Supports server-side search/filter/pagination:
 *   `q`, `classLevel`, `mode`, `page`, `limit`.
 * - default → the signed-in tutor's own posts (My Tuitions / dashboard).
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const scope = searchParams.get("scope")

  if (scope === "approved") {
    const q = (searchParams.get("q") ?? "").trim()
    const classLevel = (searchParams.get("classLevel") ?? "").trim()
    const mode = (searchParams.get("mode") ?? "").trim()
    const page = positiveInt(searchParams.get("page"), 1)
    const limit = Math.min(
      positiveInt(searchParams.get("limit"), DEFAULT_LIMIT),
      MAX_LIMIT
    )

    // `$ne` also matches documents where the field is missing, so posts written
    // by either this app (`status`) or the Express backend (`isActive`) work.
    const filter: Filter<Tuition> = {
      approvalStatus: "approved",
      status: { $ne: "closed" },
      isActive: { $ne: false },
    }

    if (classLevel) filter.classLevel = classLevel
    if (mode) filter.mode = mode as Tuition["mode"]
    if (q) {
      const regex = new RegExp(escapeRegex(q), "i")
      filter.$or = [
        { title: regex },
        { subject: regex },
        { location: regex },
        { tutorName: regex },
      ]
    }

    const collection = await tuitions()
    const [total, list] = await Promise.all([
      collection.countDocuments(filter),
      collection
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),
    ])

    // Fill in the tutor's name for older posts that didn't snapshot it.
    const contacts = await findUserContacts(list.map((t) => t.tutorId))

    return Response.json({
      tuitions: list.map((tuition) => ({
        ...serializeDoc(tuition),
        tutorName:
          tuition.tutorName || contacts.get(tuition.tutorId)?.name || "Tutor",
      })),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    })
  }

  const user = await getSessionUser()
  if (!user) return apiError("Unauthorized", 401)

  const list = await (await tuitions())
    .find({ tutorId: user.id })
    .sort({ createdAt: -1 })
    .toArray()

  return Response.json({ tuitions: list.map(serializeDoc) })
}

/**
 * POST /api/tuitions — create a tuition post.
 * New posts always start as `pending` (admin approval) and active.
 * Free-plan tutors are capped at 2 posts; Pro is unlimited.
 */
export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user) return apiError("Unauthorized", 401)
  if (user.role !== "tutor") {
    return apiError("Only tutors can post a tuition.", 403)
  }

  const body = await req.json().catch(() => null)
  const parsed = parseTuitionInput(body)
  if ("error" in parsed) return apiError(parsed.error)

  const collection = await tuitions()
  const plan = (user as { plan?: string }).plan ?? "free"

  if (plan !== "pro") {
    const existing = await collection.countDocuments({ tutorId: user.id })
    if (existing >= FREE_TUITION_LIMIT) {
      return apiError(
        `Free plan allows up to ${FREE_TUITION_LIMIT} tuition posts. Upgrade to Pro for unlimited posts.`,
        403
      )
    }
  }

  const now = new Date()
  const doc = {
    ...parsed.data,
    tutorId: user.id,
    tutorName: user.name ?? "",
    tutorEmail: user.email,
    approvalStatus: "pending" as const,
    status: "active" as const,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  }

  const { insertedId } = await collection.insertOne(doc)

  return Response.json(
    { tuition: serializeDoc({ ...doc, _id: insertedId }) },
    { status: 201 }
  )
}
