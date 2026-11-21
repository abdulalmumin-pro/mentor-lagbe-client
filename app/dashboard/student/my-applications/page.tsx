"use client"

import * as React from "react"
import Link from "next/link"
import {
  BookOpen,
  CalendarDays,
  Loader2,
  Mail,
  Search,
  User,
  Wallet,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"

import { ApplicationStatusBadge } from "@/components/tutor/status-badges"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { ApplicationDoc } from "@/lib/db"

function formatDate(value: string | Date) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export default function MyApplicationsPage() {
  const [applications, setApplications] = React.useState<ApplicationDoc[]>([])
  const [loading, setLoading] = React.useState(true)
  const [busyId, setBusyId] = React.useState<string | null>(null)

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

  async function cancelApplication(application: ApplicationDoc) {
    if (
      !window.confirm(
        `Cancel your application for "${application.tuitionTitle}"?`
      )
    ) {
      return
    }

    setBusyId(application._id)
    try {
      const res = await fetch(`/api/applications/${application._id}`, {
        method: "DELETE",
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(json?.error || "Could not cancel application.")
      }

      setApplications((prev) =>
        prev.filter((a) => a._id !== application._id)
      )
      toast.success("Application cancelled.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.")
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            My Applications
          </h1>
          <p className="text-sm text-muted-foreground">
            Every tuition you&apos;ve applied for, and where each application
            stands.
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

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading your applications…
        </div>
      ) : applications.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="size-4" />
              No applications yet
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Browse approved tuitions and apply to start your learning
              journey.
            </p>
            <Button
              render={<Link href="/browse-tuitions" />}
              nativeButton={false}
            >
              <Search />
              Browse Tuitions
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {applications.map((application) => {
            const busy = busyId === application._id
            return (
              <Card key={application._id} size="sm">
                <CardContent className="space-y-4">
                  {/* Title + status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-semibold">
                        {application.tuitionTitle}
                      </h2>
                      <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <CalendarDays className="size-3" />
                        Applied on {formatDate(application.createdAt)}
                      </p>
                    </div>
                    <ApplicationStatusBadge status={application.status} />
                  </div>

                  {/* Details */}
                  <div className="grid gap-3 rounded-lg border bg-muted/40 p-3 text-sm">
                    <div>
                      <p className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
                        Tutor
                      </p>
                      <p className="mt-0.5 inline-flex items-center gap-1.5 font-medium">
                        <User className="size-3.5 shrink-0 text-muted-foreground" />
                        {application.tutorName || "Tutor"}
                      </p>
                      {application.tutorEmail && (
                        <p className="mt-0.5 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Mail className="size-3.5 shrink-0" />
                          {application.tutorEmail}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
                          Monthly Fee
                        </p>
                        <p className="mt-0.5 inline-flex items-center gap-1.5 font-medium">
                          <Wallet className="size-3.5 shrink-0 text-muted-foreground" />৳
                          {(application.monthlyFee ?? 0).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
                          Preferred schedule
                        </p>
                        <p className="mt-0.5">
                          {application.preferredSchedule}
                        </p>
                      </div>
                    </div>

                    {application.note && (
                      <div>
                        <p className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
                          Note
                        </p>
                        <p className="mt-0.5 text-muted-foreground">
                          {application.note}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Cancel while pending */}
                  {application.status === "pending" && (
                    <div className="flex justify-end">
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={busy}
                        onClick={() => cancelApplication(application)}
                      >
                        {busy ? (
                          <Loader2 className="animate-spin" />
                        ) : (
                          <XCircle />
                        )}
                        Cancel application
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
