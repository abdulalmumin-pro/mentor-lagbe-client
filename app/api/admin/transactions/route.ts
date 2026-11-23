import { requireAdmin } from "@/lib/api"
import {
  findUserByEmail,
  findUserContacts,
  payments,
  serializeDoc,
} from "@/lib/db"

/**
 * GET /api/admin/transactions — Stripe subscription payment records from the
 * `payments` collection, enriched with the payer's current name/email/role.
 * Supports both field names used by this app and the Express webhook.
 */
export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  const list = await (await payments())
    .find({})
    .sort({ paidAt: -1, paymentDate: -1, createdAt: -1 })
    .toArray()

  const contacts = await findUserContacts(
    list.map((p) => p.userId ?? "").filter(Boolean)
  )

  // Rows written by the Express webhook may only carry `userEmail` or `email`.
  const emailContacts = new Map<
    string,
    { name?: string; role?: string }
  >()
  const emails = [
    ...new Set(
      list
        .flatMap((p) => [p.userEmail, p.email])
        .filter(Boolean) as string[]
    ),
  ]
  await Promise.all(
    emails.map(async (email) => {
      const user = await findUserByEmail(email)
      if (user) emailContacts.set(email, { name: user.name, role: user.role })
    })
  )

  const enriched = list.map((payment) => {
    const contact = payment.userId ? contacts.get(payment.userId) : undefined
    const payerEmail = payment.userEmail || payment.email || ""
    const byEmail = payerEmail ? emailContacts.get(payerEmail) : undefined
    const paidAt =
      payment.paidAt ?? payment.paymentDate ?? payment.createdAt ?? null
    const planName =
      payment.planName ||
      (payment.plan
        ? `Pro${payment.audience ? ` (${payment.audience})` : ""}`
        : "—")

    return {
      ...serializeDoc(payment),
      userName: payment.userName || contact?.name || byEmail?.name || "User",
      userEmail: payerEmail || contact?.email || "",
      userRole:
        payment.userRole || contact?.role || byEmail?.role || "student",
      planName,
      amount: Number(payment.amount) || 0,
      transactionId:
        payment.transactionId ||
        payment.stripeSessionId ||
        String(payment._id),
      status: payment.status ?? payment.paymentStatus ?? "succeeded",
      paymentDate: paidAt,
    }
  })

  return Response.json({ transactions: enriched })
}
