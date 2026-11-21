import { ObjectId } from "mongodb"

import { apiError, getSessionUser } from "@/lib/api"
import { applications, serializeDoc } from "@/lib/db"

type RouteContext = { params: Promise<{ id: string }> }

const ALLOWED = ["pending", "accepted", "rejected"] as const
type Status = (typeof ALLOWED)[number]

/** PATCH /api/applications/[id] — tutor accepts or rejects an application. */
export async function PATCH(req: Request, { params }: RouteContext) {
  const user = await getSessionUser()
  if (!user) return apiError("Unauthorized", 401)
  if (user.role !== "tutor") {
    return apiError("Only the tutor can review applications.", 403)
  }

  const { id } = await params
  if (!ObjectId.isValid(id)) return apiError("Invalid application id.")

  const body = (await req.json().catch(() => null)) as {
    status?: unknown
  } | null
  const status = body?.status as Status

  if (!ALLOWED.includes(status)) {
    return apiError("Status must be pending, accepted, or rejected.")
  }

  const updated = await (await applications()).findOneAndUpdate(
    { _id: new ObjectId(id), tutorId: user.id },
    { $set: { status, updatedAt: new Date() } },
    { returnDocument: "after" }
  )

  if (!updated) return apiError("Application not found.", 404)

  return Response.json({ application: serializeDoc(updated) })
}

/**
 * DELETE /api/applications/[id]
 * A student can cancel their own application only while it is still pending.
 */
export async function DELETE(_req: Request, { params }: RouteContext) {
  const user = await getSessionUser()
  if (!user) return apiError("Unauthorized", 401)

  const { id } = await params
  if (!ObjectId.isValid(id)) return apiError("Invalid application id.")

  const collection = await applications()
  const application = await collection.findOne({ _id: new ObjectId(id) })

  if (!application) return apiError("Application not found.", 404)
  if (application.studentId !== user.id) {
    return apiError("You can only cancel your own application.", 403)
  }
  if (application.status !== "pending") {
    return apiError("Only pending applications can be cancelled.", 400)
  }

  await collection.deleteOne({ _id: new ObjectId(id) })

  return Response.json({ success: true })
}
