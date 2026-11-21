import { ObjectId } from "mongodb"

import { apiError, getSessionUser } from "@/lib/api"
import { applications, serializeDoc, tuitions, type Tuition } from "@/lib/db"
import { parseTuitionInput } from "@/lib/tuition"

type RouteContext = { params: Promise<{ id: string }> }

/** GET /api/tuitions/[id] — one of the tutor's own posts. */
export async function GET(_req: Request, { params }: RouteContext) {
  const user = await getSessionUser()
  if (!user) return apiError("Unauthorized", 401)

  const { id } = await params
  if (!ObjectId.isValid(id)) return apiError("Invalid tuition id.")

  const tuition = await (await tuitions()).findOne({
    _id: new ObjectId(id),
    tutorId: user.id,
  })
  if (!tuition) return apiError("Tuition not found.", 404)

  return Response.json({ tuition: serializeDoc(tuition) })
}

/**
 * PATCH /api/tuitions/[id]
 * - `{ status: "active" | "closed" }` toggles visibility only.
 * - A full form payload updates the post and sends it back to `pending`.
 */
export async function PATCH(req: Request, { params }: RouteContext) {
  const user = await getSessionUser()
  if (!user) return apiError("Unauthorized", 401)

  const { id } = await params
  if (!ObjectId.isValid(id)) return apiError("Invalid tuition id.")

  const body = await req.json().catch(() => null)
  if (!body || typeof body !== "object") {
    return apiError("Invalid request body.")
  }

  const update: Partial<Tuition> = { updatedAt: new Date() }

  const status = (body as { status?: unknown }).status
  if (status === "active" || status === "closed") {
    update.status = status
  }

  const isFormUpdate = ["title", "subject", "classLevel", "mode"].some(
    (key) => key in body
  )

  if (isFormUpdate) {
    const parsed = parseTuitionInput(body)
    if ("error" in parsed) return apiError(parsed.error)

    Object.assign(update, parsed.data)
    // Edited content needs to be approved again.
    update.approvalStatus = "pending"
  }

  const updated = await (await tuitions()).findOneAndUpdate(
    { _id: new ObjectId(id), tutorId: user.id },
    { $set: update },
    { returnDocument: "after" }
  )

  if (!updated) return apiError("Tuition not found.", 404)

  return Response.json({ tuition: serializeDoc(updated) })
}

/** DELETE /api/tuitions/[id] — remove the post and its applications. */
export async function DELETE(_req: Request, { params }: RouteContext) {
  const user = await getSessionUser()
  if (!user) return apiError("Unauthorized", 401)

  const { id } = await params
  if (!ObjectId.isValid(id)) return apiError("Invalid tuition id.")

  const { deletedCount } = await (await tuitions()).deleteOne({
    _id: new ObjectId(id),
    tutorId: user.id,
  })
  if (deletedCount === 0) return apiError("Tuition not found.", 404)

  await (await applications()).deleteMany({ tuitionId: id })

  return Response.json({ success: true })
}
