"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowRight,
  Bookmark,
  BookOpen,
  CheckCircle2,
  Clock,
  Compass,
  Crown,
  Lightbulb,
  Search,
} from "lucide-react"
import { toast } from "sonner"

import { useSession } from "@/lib/auth-client"
import { StatCard } from "@/components/dashboard/stat-card"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { ApplicationDoc } from "@/lib/db"

const quickActions = [
  {
    href: "/dashboard/student/my-applications",
    icon: BookOpen,
    title: "My Applications",
    description: "Track and manage submissions",
  },
  {
    href: "/dashboard/student/saved-tuitions",
    icon: Bookmark,
    title: "Saved Tuitions",
    description: "Your bookmarked subjects",
  },
  {
    href: "/browse-tuitions",
    icon: Compass,
    title: "Explore Mentors",
    description: "Find experienced tutors",
  },
]

export default function StudentOverviewPage() {
  const { data: session } = useSession()

  const [applications, setApplications] = React.useState<ApplicationDoc[]>([])
  const [loading, setLoading] = React.useState(true)

  const isPro = session?.user.plan === "pro"
  const displayName =
    session?.user.name || session?.user.email || "Student"

  React.useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await fetch("/api/applications")
        const json = await res.json().catch(() => null)
        if (!res.ok) {
          throw new Error(json?.error || "Could not load your applications.")
        }
        if (!cancelled) setApplications(json.applications ?? [])
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

  const accepted = applications.filter((a) => a.status === "accepted").length
  const pending = applications.filter((a) => a.status === "pending").length

  const stats = [
    {
      label: "Total Applied Tuitions",
      value: loading ? "—" : applications.length,
      icon: BookOpen,
      accent: "primary" as const,
      hint: "Total tuition posts applied for",
    },
    {
      label: "Accepted Applications",
      value: loading ? "—" : accepted,
      icon: CheckCircle2,
      accent: "emerald" as const,
      hint: "Approved applications by tutors",
    },
    {
      label: "Pending Applications",
      value: loading ? "—" : pending,
      icon: Clock,
      accent: "amber" as const,
      hint: "Awaiting tutor review and confirmation",
    },
    {
      label: "Current Plan",
      value: isPro ? "Pro" : "Free",
      icon: Crown,
      accent: "sky" as const,
      hint: isPro
        ? "Priority perks unlocked"
        : "Upgrade to Pro for priority perks",
    },
  ]

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6">
      {/* Welcome */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {displayName}! 👋
          </h1>
          <p className="text-sm text-muted-foreground">
            Track your applied tuitions, applications, reviews, and learning
            journey.
          </p>
        </div>
        <Button
          render={<Link href="/browse-tuitions" />}
          nativeButton={false}
        >
          <Search />
          Browse Tuitions
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            accent={stat.accent}
            hint={stat.hint}
          />
        ))}
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Everything you need to keep your applications moving.
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

          {/* Tip */}
          <div className="flex items-start gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <Lightbulb className="size-4" />
            </span>
            <div>
              <p className="text-sm font-medium">Boost your success rate</p>
              <p className="text-xs text-muted-foreground">
                Keep your student profile and contact details up-to-date so
                mentors can contact you quickly.{" "}
                <Link
                  href="/dashboard/profile"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  Update profile
                </Link>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
