import { apiError, getSessionUser } from "@/lib/api"
import { serializeDoc, tuitions } from "@/lib/db"
import { parseTuitionInput } from "@/lib/tuition"

/** GET /api/tuitions — the signed-in tutor's own posts. */
export async function GET() {
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
 * New posts always start as `pending` (admin approval) and `active`.
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
    if (existing >= 2) {
      return apiError(
        "Free plan allows up to 2 tuition posts. Upgrade to Pro for unlimited posts.",
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
    createdAt: now,
    updatedAt: now,
  }

  const { insertedId } = await collection.insertOne(doc)

  return Response.json(
    { tuition: serializeDoc({ ...doc, _id: insertedId }) },
    { status: 201 }
  )
}
