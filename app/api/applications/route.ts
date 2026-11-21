import { ObjectId } from "mongodb"

import { apiError, getSessionUser } from "@/lib/api"
import {
  applications,
  findUserContacts,
  serializeDoc,
  tuitions,
  type Tuition,
} from "@/lib/db"

/**
 * GET /api/applications
 * - Tutor: applications received on their posts.
 * - Student: their own applications, enriched with the tuition's fee and the
 *   tutor's name/email (older rows may not have those snapshotted).
 */
export async function GET() {
  const user = await getSessionUser()
  if (!user) return apiError("Unauthorized", 401)

  const collection = await applications()

  if (user.role === "tutor") {
    const list = await collection
      .find({ tutorId: user.id })
      .sort({ createdAt: -1 })
      .toArray()

    return Response.json({ applications: list.map(serializeDoc) })
  }

  const list = await collection
    .find({ studentId: user.id })
    .sort({ createdAt: -1 })
    .toArray()

  // Join tuition details (fee / title) and tutor contact for the student view.
  const tuitionIds = [
    ...new Set(list.map((a) => a.tuitionId)),
  ].filter((id) => ObjectId.isValid(id))

  const tuitionMap = new Map<string, Tuition>()
  if (tuitionIds.length > 0) {
    const docs = await (await tuitions())
      .find({ _id: { $in: tuitionIds.map((id) => new ObjectId(id)) } })
      .toArray()
    for (const doc of docs) tuitionMap.set(String(doc._id), doc)
  }

  const contacts = await findUserContacts(list.map((a) => a.tutorId))

  const enriched = list.map((application) => {
    const tuition = tuitionMap.get(application.tuitionId)
    const contact = contacts.get(application.tutorId)

    return {
      ...serializeDoc(application),
      tuitionTitle:
        application.tuitionTitle || tuition?.title || "Untitled tuition",
      monthlyFee: application.monthlyFee ?? tuition?.monthlyFee ?? 0,
      tutorName:
        application.tutorName ||
        tuition?.tutorName ||
        contact?.name ||
        "Tutor",
      tutorEmail:
        application.tutorEmail || tuition?.tutorEmail || contact?.email || "",
    }
  })

  return Response.json({ applications: enriched })
}

/**
 * POST /api/applications — a student applies to an approved, active tuition.
 * Body: `{ tuitionId, preferredSchedule, note? }`
 */
export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user) return apiError("Unauthorized", 401)
  if (user.role !== "student") {
    return apiError("Only students can apply to a tuition.", 403)
  }

  const body = (await req.json().catch(() => null)) as {
    tuitionId?: unknown
    preferredSchedule?: unknown
    note?: unknown
  } | null

  const tuitionId = typeof body?.tuitionId === "string" ? body.tuitionId : ""
  const preferredSchedule =
    typeof body?.preferredSchedule === "string"
      ? body.preferredSchedule.trim()
      : ""
  const note = typeof body?.note === "string" ? body.note.trim() : ""

  if (!ObjectId.isValid(tuitionId)) return apiError("Invalid tuition id.")
  if (!preferredSchedule) return apiError("Preferred schedule is required.")

  const tuition = await (await tuitions()).findOne({
    _id: new ObjectId(tuitionId),
  })
  if (!tuition) return apiError("Tuition not found.", 404)
  if (tuition.approvalStatus !== "approved" || tuition.status !== "active") {
    return apiError("This tuition is not open for applications.", 400)
  }

  const collection = await applications()
  const alreadyApplied = await collection.findOne({
    tuitionId,
    studentId: user.id,
  })
  if (alreadyApplied) {
    return apiError("You have already applied to this tuition.", 409)
  }

  // Snapshot the tutor contact + fee so the student dashboard can show them
  // without another lookup.
  const tutorContact = (await findUserContacts([tuition.tutorId])).get(
    tuition.tutorId
  )

  const now = new Date()
  const doc = {
    tuitionId,
    tuitionTitle: tuition.title,
    tutorId: tuition.tutorId,
    tutorName: tuition.tutorName || tutorContact?.name || "",
    tutorEmail: tuition.tutorEmail || tutorContact?.email || "",
    monthlyFee: tuition.monthlyFee,
    studentId: user.id,
    studentName: user.name ?? "",
    studentEmail: user.email,
    studentPhone: (user as { phone?: string | null }).phone ?? "",
    preferredSchedule,
    note,
    status: "pending" as const,
    createdAt: now,
    updatedAt: now,
  }

  const { insertedId } = await collection.insertOne(doc)

  return Response.json(
    { application: serializeDoc({ ...doc, _id: insertedId }) },
    { status: 201 }
  )
}
