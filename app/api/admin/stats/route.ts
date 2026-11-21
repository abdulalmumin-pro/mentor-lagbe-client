import { requireAdmin } from "@/lib/api"
import { payments, tuitions, users } from "@/lib/db"

/** GET /api/admin/stats — platform-wide counts for the admin overview. */
export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  const userCol = await users()
  const [totalUsers, totalTutors, totalStudents, totalAdmins] =
    await Promise.all([
      userCol.countDocuments({}),
      userCol.countDocuments({ role: "tutor" }),
      userCol.countDocuments({ role: "student" }),
      userCol.countDocuments({ role: "admin" }),
    ])

  const tuitionCol = await tuitions()
  const [totalTuitions, pendingTuitions, approvedTuitions, rejectedTuitions] =
    await Promise.all([
      tuitionCol.countDocuments({}),
      tuitionCol.countDocuments({ approvalStatus: "pending" }),
      tuitionCol.countDocuments({ approvalStatus: "approved" }),
      tuitionCol.countDocuments({ approvalStatus: "rejected" }),
    ])

  const paymentDocs = await (await payments())
    .find({})
    .project({ amount: 1, status: 1 })
    .toArray()

  const totalRevenue = paymentDocs
    .filter((p) => p.status !== "failed")
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0)

  return Response.json({
    totalUsers,
    totalTutors,
    totalStudents,
    totalAdmins,
    totalTuitions,
    pendingTuitions,
    approvedTuitions,
    rejectedTuitions,
    totalRevenue,
  })
}
