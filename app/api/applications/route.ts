import { ObjectId } from "mongodb"

import { apiError, getSessionUser } from "@/lib/api"
import {
  applications,
  findUserContacts,
  serializeDoc,
  tuitions,
  type Application,
  type Tuition,
} from "@/lib/db"

/**
 * Older documents written by the Express backend use `studentNote`/`appliedAt`
 * instead of `note`/`createdAt`. Normalise both so every dashboard works.
 */
function normalizeApplication(application: Application & { _id?: unknown }) {
  const note = application.note ?? application.studentNote ?? ""
  const createdAt = application.createdAt ?? application.appliedAt ?? new Date()
  const updatedAt = application.updatedAt ?? createdAt

  return {
    ...serializeDoc(application),
    note,
    studentNote: application.studentNote ?? note,
    subject: application.subject ?? "",
    createdAt,
    appliedAt: application.appliedAt ?? createdAt,
    updatedAt,
  }
}

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
    // Match by id, or by email for rows created by the Express backend.
    const list = await collection
      .find({
        $or: [{ tutorId: user.id }, { tutorEmail: user.email }],
      })
      .sort({ createdAt: -1 })
      .toArray()

    const tuitionIds = [...new Set(list.map((a) => a.tuitionId))].filter((id) =>
      ObjectId.isValid(id)
    )

    const tuitionMap = new Map<string, Tuition>()
    if (tuitionIds.length > 0) {
      const docs = await (await tuitions())
        .find({ _id: { $in: tuitionIds.map((id) => new ObjectId(id)) } })
        .toArray()
      for (const doc of docs) tuitionMap.set(String(doc._id), doc)
    }

    return Response.json({
      applications: list.map((application) => {
        const tuition = tuitionMap.get(application.tuitionId)
        return {
          ...normalizeApplication(application),
          tuitionTitle:
            application.tuitionTitle || tuition?.title || "Untitled tuition",
          subject: application.subject || tuition?.subject || "",
          monthlyFee: application.monthlyFee ?? tuition?.monthlyFee ?? 0,
        }
      }),
    })
  }

  const list = await collection
    .find({
      $or: [{ studentId: user.id }, { studentEmail: user.email }],
    })
    .sort({ createdAt: -1 })
    .toArray()

  // Join tuition details (fee / title) and tutor contact for the student view.
  const tuitionIds = [...new Set(list.map((a) => a.tuitionId))].filter((id) =>
    ObjectId.isValid(id)
  )

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
      ...normalizeApplication(application),
      tuitionTitle:
        application.tuitionTitle || tuition?.title || "Untitled tuition",
      subject: application.subject || tuition?.subject || "",
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
 * POST /api/applications — a student applies to an approved, open tuition.
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
    studentNote?: unknown
  } | null

  const tuitionId = typeof body?.tuitionId === "string" ? body.tuitionId : ""
  const preferredSchedule =
    typeof body?.preferredSchedule === "string"
      ? body.preferredSchedule.trim()
      : ""
  const note =
    typeof body?.note === "string"
      ? body.note.trim()
      : typeof body?.studentNote === "string"
        ? body.studentNote.trim()
        : ""

  if (!ObjectId.isValid(tuitionId)) return apiError("Invalid tuition id.")
  if (!preferredSchedule) return apiError("Preferred schedule is required.")

  const tuition = await (await tuitions()).findOne({
    _id: new ObjectId(tuitionId),
  })
  if (!tuition) return apiError("Tuition not found.", 404)

  const active =
    typeof tuition.isActive === "boolean"
      ? tuition.isActive
      : tuition.status !== "closed"
  if (tuition.approvalStatus !== "approved" || !active) {
    return apiError("This tuition is not open for applications.", 400)
  }

  const collection = await applications()
  const alreadyApplied = await collection.findOne({
    tuitionId,
    $or: [{ studentId: user.id }, { studentEmail: user.email }],
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
    subject: tuition.subject,
    tutorId: tuition.tutorId,
    tutorName: tuition.tutorName || tutorContact?.name || "",
    tutorEmail: tuition.tutorEmail || tutorContact?.email || "",
    monthlyFee: tuition.monthlyFee,
    studentId: user.id,
    studentName: user.name ?? "",
    studentEmail: user.email,
    studentPhone: (user as { phone?: string | null }).phone ?? "",
    preferredSchedule,
    // Write both spellings so the Express backend and this app agree.
    note,
    studentNote: note,
    status: "pending" as const,
    createdAt: now,
    appliedAt: now,
    updatedAt: now,
  }

  const { insertedId } = await collection.insertOne(doc)

  return Response.json(
    { application: serializeDoc({ ...doc, _id: insertedId }) },
    { status: 201 }
  )
}
