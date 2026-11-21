import { ObjectId } from "mongodb"

import { apiError, requireAdmin } from "@/lib/api"
import { users } from "@/lib/db"

type RouteContext = { params: Promise<{ id: string }> }

const ROLES = ["student", "tutor", "admin"] as const
type Role = (typeof ROLES)[number]

/** PATCH /api/admin/users/[id] — change a user's role. */
export async function PATCH(req: Request, { params }: RouteContext) {
  const { error, user } = await requireAdmin()
  if (error) return error

  const { id } = await params
  if (!ObjectId.isValid(id)) return apiError("Invalid user id.")
  if (id === user.id) {
    return apiError("You cannot change your own role.", 400)
  }

  const body = (await req.json().catch(() => null)) as {
    role?: unknown
  } | null
  const role = body?.role as Role

  if (!ROLES.includes(role)) {
    return apiError("Role must be student, tutor, or admin.")
  }

  const result = await (await users()).updateOne(
    { _id: new ObjectId(id) },
    { $set: { role } }
  )

  if (result.matchedCount === 0) return apiError("User not found.", 404)

  return Response.json({ success: true, role })
}
