import { ObjectId } from "mongodb"

import { apiError, getSessionUser } from "@/lib/api"
import {
  findUserByEmail,
  serializeDoc,
  tuitions,
  users,
} from "@/lib/db"
import { FREE_BOOKMARK_LIMIT } from "@/lib/tuition"

/**
 * Saved tuitions live on the signed-in user's document (`bookmarks: string[]`)
 * so the project keeps its four-collection design.
 */

async function loadUser(email: string) {
  return findUserByEmail(email)
}

/** GET /api/bookmarks — the student's saved tuitions, newest bookmark first. */
export async function GET() {
  const sessionUser = await getSessionUser()
  if (!sessionUser) return apiError("Unauthorized", 401)

  const user = await loadUser(sessionUser.email)
  if (!user) return apiError("User not found.", 404)

  const ids = (user.bookmarks ?? []).filter((id) => ObjectId.isValid(id))
  if (ids.length === 0) {
    return Response.json({ tuitionIds: [], tuitions: [] })
  }

  const docs = await (await tuitions())
    .find({ _id: { $in: ids.map((id) => new ObjectId(id)) } })
    .toArray()

  const byId = new Map(docs.map((doc) => [String(doc._id), doc]))
  const ordered = ids
    .map((id) => byId.get(id))
    .filter((doc): doc is NonNullable<typeof doc> => Boolean(doc))
    .map(serializeDoc)

  return Response.json({ tuitionIds: ids, tuitions: ordered })
}

/** POST /api/bookmarks — save a tuition. Body: `{ tuitionId }`. */
export async function POST(req: Request) {
  const sessionUser = await getSessionUser()
  if (!sessionUser) return apiError("Unauthorized", 401)
  if (sessionUser.role !== "student") {
    return apiError("Only students can save tuitions.", 403)
  }

  const body = (await req.json().catch(() => null)) as {
    tuitionId?: unknown
  } | null
  const tuitionId =
    typeof body?.tuitionId === "string" ? body.tuitionId : ""

  if (!ObjectId.isValid(tuitionId)) return apiError("Invalid tuition id.")

  const user = await loadUser(sessionUser.email)
  if (!user) return apiError("User not found.", 404)

  const bookmarks = user.bookmarks ?? []
  if (bookmarks.includes(tuitionId)) {
    return Response.json({ bookmarks })
  }

  if (user.plan !== "pro" && bookmarks.length >= FREE_BOOKMARK_LIMIT) {
    return apiError(
      `Free plan allows up to ${FREE_BOOKMARK_LIMIT} saved tuitions. Upgrade to Pro for unlimited bookmarks.`,
      403
    )
  }

  const tuition = await (await tuitions()).findOne({
    _id: new ObjectId(tuitionId),
  })
  if (!tuition) return apiError("Tuition not found.", 404)

  await (await users()).updateOne(
    { email: user.email },
    { $addToSet: { bookmarks: tuitionId } }
  )

  return Response.json({ bookmarks: [...bookmarks, tuitionId] })
}

/** DELETE /api/bookmarks?tuitionId=… — remove a saved tuition. */
export async function DELETE(req: Request) {
  const sessionUser = await getSessionUser()
  if (!sessionUser) return apiError("Unauthorized", 401)

  const { searchParams } = new URL(req.url)
  const body = (await req.json().catch(() => null)) as {
    tuitionId?: unknown
  } | null
  const tuitionId =
    searchParams.get("tuitionId") ??
    (typeof body?.tuitionId === "string" ? body.tuitionId : "")

  if (!ObjectId.isValid(tuitionId)) return apiError("Invalid tuition id.")

  const user = await loadUser(sessionUser.email)
  if (!user) return apiError("User not found.", 404)

  await (await users()).updateOne(
    { email: user.email },
    { $pull: { bookmarks: tuitionId } }
  )

  return Response.json({
    bookmarks: (user.bookmarks ?? []).filter((id) => id !== tuitionId),
  })
}
