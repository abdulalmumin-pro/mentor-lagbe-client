import { ObjectId } from "mongodb"

import { apiError, requireAdmin } from "@/lib/api"
import { serializeDoc, tuitions } from "@/lib/db"

type RouteContext = { params: Promise<{ id: string }> }

const STATUSES = ["pending", "approved", "rejected"] as const
type ApprovalStatus = (typeof STATUSES)[number]

/** PATCH /api/admin/tuitions/[id] — approve or reject a tuition post. */
export async function PATCH(req: Request, { params }: RouteContext) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await params
  if (!ObjectId.isValid(id)) return apiError("Invalid tuition id.")

  const body = (await req.json().catch(() => null)) as {
    approvalStatus?: unknown
  } | null
  const approvalStatus = body?.approvalStatus as ApprovalStatus

  if (!STATUSES.includes(approvalStatus)) {
    return apiError("Approval status must be pending, approved, or rejected.")
  }

  const updated = await (await tuitions()).findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: { approvalStatus, updatedAt: new Date() } },
    { returnDocument: "after" }
  )

  if (!updated) return apiError("Tuition not found.", 404)

  return Response.json({ tuition: serializeDoc(updated) })
}
