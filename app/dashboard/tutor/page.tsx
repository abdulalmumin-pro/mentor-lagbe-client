"use client"

import * as React from "react"
import Link from "next/link"
import {
  BookOpen,
  CheckCircle2,
  FilePlus,
  Sparkles,
  UserCheck,
  Users,
} from "lucide-react"
import { toast } from "sonner"

import { useSession } from "@/lib/auth-client"
import { StatCard } from "@/components/dashboard/stat-card"
import { ApprovalBadge } from "@/components/tutor/status-badges"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { ApplicationDoc, TuitionDoc } from "@/lib/db"

export default function TutorOverviewPage() {
  const { data: session } = useSession()

  const [tuitions, setTuitions] = React.useState<TuitionDoc[]>([])
  const [applications, setApplications] = React.useState<ApplicationDoc[]>([])
  const [loading, setLoading] = React.useState(true)

  const isPro = session?.user.plan === "pro"

  React.useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const [tuitionsRes, applicationsRes] = await Promise.all([
          fetch("/api/tuitions"),
          fetch("/api/applications"),
        ])
        if (!tuitionsRes.ok || !applicationsRes.ok) {
          throw new Error("Could not load your dashboard.")
        }
        const tuitionsJson = await tuitionsRes.json()
        const applicationsJson = await applicationsRes.json()
        if (cancelled) return
        setTuitions(tuitionsJson.tuitions ?? [])
        setApplications(applicationsJson.applications ?? [])
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

  const activeApproved = tuitions.filter(
    (t) => t.approvalStatus === "approved" && t.status === "active"
  ).length
  const pendingCount = tuitions.filter(
    (t) => t.approvalStatus === "pending"
  ).length

  const stats = [
    {
      label: "Total Tuitions Posted",
      value: loading ? "—" : tuitions.length,
      icon: BookOpen,
      accent: "primary" as const,
      hint: pendingCount ? `${pendingCount} awaiting approval` : "All reviewed",
    },
    {
      label: "Active / Approved Tuitions",
      value: loading ? "—" : activeApproved,
      icon: CheckCircle2,
      accent: "emerald" as const,
      hint: "Visible to students",
    },
    {
      label: "Total Applicants Received",
      value: loading ? "—" : applications.length,
      icon: Users,
      accent: "sky" as const,
      hint: applications.filter((a) => a.status === "pending").length
        ? `${applications.filter((a) => a.status === "pending").length} pending review`
        : "No pending review",
    },
    {
      label: "Current Plan",
      value: isPro ? "Pro" : "Free",
      icon: Sparkles,
      accent: "amber" as const,
      hint: isPro ? "Unlimited tuition posts" : "Up to 2 tuition posts",
    },
  ]

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6">
      {/* Page header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
          <p className="text-sm text-muted-foreground">
            Welcome back{session?.user.name ? `, ${session.user.name}` : ""} —
            here&apos;s how your tuitions are doing.
          </p>
        </div>
        <Button
          render={<Link href="/dashboard/tutor/post-tuition" />}
          nativeButton={false}
        >
          <FilePlus />
          Post Tuition
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

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Recent tuitions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent tuitions</CardTitle>
            <CardDescription>Your latest posts and their status.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : tuitions.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center">
                <p className="text-sm font-medium">No tuitions posted yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Post your first tuition to start receiving applications.
                </p>
                <Button
                  className="mt-4"
                  size="sm"
                  render={<Link href="/dashboard/tutor/post-tuition" />}
                  nativeButton={false}
                >
                  <FilePlus />
                  Post Tuition
                </Button>
              </div>
            ) : (
              tuitions.slice(0, 5).map((tuition) => (
                <div
                  key={tuition._id}
                  className="flex items-center justify-between gap-3 rounded-lg border p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {tuition.title}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {tuition.subject} · {tuition.classLevel} ·{" "}
                      {tuition.mode}
                    </p>
                  </div>
                  <ApprovalBadge status={tuition.approvalStatus} />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Quick links / plan */}
        <Card>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
            <CardDescription>Jump straight to your tools.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button
              variant="outline"
              className="justify-start"
              render={<Link href="/dashboard/tutor/my-tuitions" />}
              nativeButton={false}
            >
              <BookOpen />
              Manage my tuitions
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              render={<Link href="/dashboard/tutor/applicants" />}
              nativeButton={false}
            >
              <UserCheck />
              Review applicants
            </Button>
            {!isPro && (
              <Button
                variant="outline"
                className="justify-start"
                render={<Link href="/pricing" />}
                nativeButton={false}
              >
                <Sparkles />
                Upgrade to Pro
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
