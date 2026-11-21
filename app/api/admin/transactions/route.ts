import { requireAdmin } from "@/lib/api"
import { findUserContacts, payments, serializeDoc } from "@/lib/db"

/**
 * GET /api/admin/transactions — Stripe subscription payment records from the
 * `payments` collection, enriched with the payer's current name/email/role.
 */
export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  const list = await (await payments())
    .find({})
    .sort({ paymentDate: -1 })
    .toArray()

  const contacts = await findUserContacts(list.map((p) => p.userId))

  const enriched = list.map((payment) => {
    const contact = contacts.get(payment.userId)
    return {
      ...serializeDoc(payment),
      userName: payment.userName || contact?.name || "User",
      userEmail: payment.userEmail || contact?.email || "",
      userRole: payment.userRole || contact?.role || "student",
      planName: payment.planName || "—",
      amount: Number(payment.amount) || 0,
      transactionId: payment.transactionId || String(payment._id),
    }
  })

  return Response.json({ transactions: enriched })
}
