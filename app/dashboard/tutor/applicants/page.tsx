"use client"

import * as React from "react"
import Link from "next/link"
import {
  BookOpen,
  Check,
  Loader2,
  Mail,
  Phone,
  UserCheck,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { ApplicationStatusBadge } from "@/components/tutor/status-badges"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { ApplicationDoc, ApplicationStatus } from "@/lib/db"

export default function ApplicantsPage() {
  const [applications, setApplications] = React.useState<ApplicationDoc[]>([])
  const [loading, setLoading] = React.useState(true)
  const [busyId, setBusyId] = React.useState<string | null>(null)

  React.useEffect(() => {
    let cancelled = false

    fetch("/api/applications")
      .then(async (res) => {
        const json = await res.json().catch(() => null)
        if (!res.ok) {
          throw new Error(json?.error || "Could not load applications.")
        }
        return (json.applications ?? []) as ApplicationDoc[]
      })
      .then((data) => {
        if (!cancelled) setApplications(data)
      })
      .catch((err) => {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : "Something went wrong.")
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  async function updateStatus(
    application: ApplicationDoc,
    status: ApplicationStatus
  ) {
    setBusyId(application._id)
    try {
      const res = await fetch(`/api/applications/${application._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.error || "Could not update status.")

      setApplications((prev) =>
        prev.map((a) => (a._id === application._id ? json.application : a))
      )
      toast.success(
        status === "accepted"
          ? "Application accepted."
          : "Application rejected."
      )
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.")
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Applicants</h1>
        <p className="text-sm text-muted-foreground">
          Students who applied to your tuition posts. Accept or reject each
          application.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading applicants…
        </div>
      ) : applications.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="size-4" />
              No applications yet
            </CardTitle>
            <CardDescription>
              Once students apply to your approved tuitions, they&apos;ll appear
              here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              render={<Link href="/dashboard/tutor/my-tuitions" />}
              nativeButton={false}
            >
              <BookOpen />
              View my tuitions
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {applications.map((application) => {
            const busy = busyId === application._id
            return (
              <Card key={application._id} size="sm">
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-base font-semibold">
                        {application.studentName || "Student"}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Mail className="size-3.5" />
                          {application.studentEmail}
                        </span>
                        {application.studentPhone && (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="size-3.5" />
                            {application.studentPhone}
                          </span>
                        )}
                      </div>
                    </div>
                    <ApplicationStatusBadge status={application.status} />
                  </div>

                  <div className="grid gap-3 rounded-lg border bg-muted/40 p-3 text-sm sm:grid-cols-2">
                    <div>
                      <p className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
                        Tuition
                      </p>
                      <p className="mt-0.5 font-medium">
                        {application.tuitionTitle}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
                        Preferred schedule
                      </p>
                      <p className="mt-0.5">{application.preferredSchedule}</p>
                    </div>
                    {application.note && (
                      <div className="sm:col-span-2">
                        <p className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
                          Note
                        </p>
                        <p className="mt-0.5 text-muted-foreground">
                          {application.note}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy || application.status === "rejected"}
                      onClick={() => updateStatus(application, "rejected")}
                    >
                      {busy ? <Loader2 className="animate-spin" /> : <X />}
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      disabled={busy || application.status === "accepted"}
                      onClick={() => updateStatus(application, "accepted")}
                    >
                      {busy ? <Loader2 className="animate-spin" /> : <Check />}
                      Accept
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
