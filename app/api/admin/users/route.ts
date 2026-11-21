import { requireAdmin } from "@/lib/api"
import { serializeDoc, users } from "@/lib/db"

/** GET /api/admin/users — every registered account. */
export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  const list = await (await users()).find({}).sort({ createdAt: -1 }).toArray()

  return Response.json({
    users: list.map((user) => ({
      ...serializeDoc(user),
      name: user.name ?? "",
      role: user.role ?? "student",
      plan: user.plan ?? "free",
      image: user.image ?? null,
    })),
  })
}
