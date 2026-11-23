"use client"

import * as React from "react"
import { CreditCard, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { PaymentDoc } from "@/lib/db"

function formatDate(value: string | Date) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function formatAmount(payment: PaymentDoc) {
  const amount = Number(payment.amount) || 0
  if (payment.currency) {
    return `${amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} ${payment.currency.toUpperCase()}`
  }
  return `$${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = React.useState<PaymentDoc[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await fetch("/api/admin/transactions")
        const json = await res.json().catch(() => null)
        if (!res.ok) {
          throw new Error(json?.error || "Could not load transactions.")
        }
        if (!cancelled) setTransactions(json.transactions ?? [])
      } catch (err) {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : "Something went wrong.")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const total = transactions
    .filter((t) => t.status !== "failed")
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
          <p className="text-sm text-muted-foreground">
            Stripe subscription payments recorded in the payments collection.
          </p>
        </div>
        <div className="rounded-lg border bg-muted/40 px-4 py-2 text-right">
          <p className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
            Total Revenue
          </p>
          <p className="text-lg font-bold">
            ${total.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading transactions…
        </div>
      ) : transactions.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="size-4" />
              No transactions yet
            </CardTitle>
            <CardDescription>
              Subscription payments will appear here once users upgrade to Pro
              through Stripe.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Card className="py-0">
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="border-b bg-muted/50 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">User Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Plan</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Transaction ID</th>
                  <th className="px-4 py-3 font-medium">Payment Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((payment) => (
                  <tr key={payment._id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium">
                      {payment.userName || "User"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {payment.userEmail || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="capitalize">
                        {payment.userRole || "student"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">{payment.planName || "—"}</td>
                    <td className="px-4 py-3 font-medium">
                      {formatAmount(payment)}
                    </td>
                    <td
                      className="max-w-48 truncate px-4 py-3 font-mono text-xs text-muted-foreground"
                      title={payment.transactionId}
                    >
                      {payment.transactionId}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {payment.paymentDate ? formatDate(payment.paymentDate) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
