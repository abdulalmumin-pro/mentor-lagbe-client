"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowRight,
  BookOpen,
  CreditCard,
  GraduationCap,
  Users,
} from "lucide-react"
import { toast } from "sonner"

import { StatCard } from "@/components/dashboard/stat-card"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type AdminStats = {
  totalUsers: number
  totalTutors: number
  totalStudents: number
  totalAdmins: number
  totalTuitions: number
  pendingTuitions: number
  approvedTuitions: number
  rejectedTuitions: number
  totalRevenue: number
}

const quickActions = [
  {
    href: "/dashboard/admin/users",
    icon: Users,
    title: "User Management",
    description: "Review accounts and change roles",
  },
  {
    href: "/dashboard/admin/tuitions",
    icon: BookOpen,
    title: "Tuition Moderation",
    description: "Approve or reject tuition posts",
  },
  {
    href: "/dashboard/admin/transactions",
    icon: CreditCard,
    title: "Transactions",
    description: "View Stripe subscription payments",
  },
]

export default function AdminOverviewPage() {
  const [stats, setStats] = React.useState<AdminStats | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await fetch("/api/admin/stats")
        const json = await res.json().catch(() => null)
        if (!res.ok) {
          throw new Error(json?.error || "Could not load platform stats.")
        }
        if (!cancelled) setStats(json)
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

  const cards = [
    {
      label: "Total Users",
      value: loading ? "—" : (stats?.totalUsers ?? 0),
      icon: Users,
      accent: "primary" as const,
      hint: `${stats?.totalStudents ?? 0} students · ${stats?.totalAdmins ?? 0} admins`,
    },
    {
      label: "Total Tutors",
      value: loading ? "—" : (stats?.totalTutors ?? 0),
      icon: GraduationCap,
      accent: "emerald" as const,
      hint: "Registered tutor accounts",
    },
    {
      label: "Pending vs Approved Tuitions",
      value: loading
        ? "—"
        : `${stats?.pendingTuitions ?? 0} / ${stats?.approvedTuitions ?? 0}`,
      icon: BookOpen,
      accent: "amber" as const,
      hint: `${stats?.rejectedTuitions ?? 0} rejected · ${stats?.totalTuitions ?? 0} total`,
    },
    {
      label: "Total Stripe Revenue",
      value: loading
        ? "—"
        : `$${(stats?.totalRevenue ?? 0).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`,
      icon: CreditCard,
      accent: "sky" as const,
      hint: "From subscription payments",
    },
  ]

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Platform Overview</h1>
        <p className="text-sm text-muted-foreground">
          Users, tuition moderation, and revenue at a glance.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <StatCard
            key={card.label}
            label={card.label}
            value={card.value}
            icon={card.icon}
            accent={card.accent}
            hint={card.hint}
          />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Admin tools</CardTitle>
          <CardDescription>
            Manage the platform&apos;s users, tuitions, and payments.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/60"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <action.icon className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">
                  {action.title}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {action.description}
                </span>
              </span>
              <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
