import { requireAdmin } from "@/lib/api"
import { findUserContacts, serializeDoc, tuitions } from "@/lib/db"

/** GET /api/admin/tuitions — every tuition post, newest first. */
export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  const list = await (await tuitions())
    .find({})
    .sort({ createdAt: -1 })
    .toArray()

  const contacts = await findUserContacts(list.map((t) => t.tutorId))

  const enriched = list.map((tuition) => {
    const contact = contacts.get(tuition.tutorId)
    return {
      ...serializeDoc(tuition),
      tutorName: tuition.tutorName || contact?.name || "Tutor",
      tutorEmail: tuition.tutorEmail || contact?.email || "",
    }
  })

  return Response.json({ tuitions: enriched })
}
