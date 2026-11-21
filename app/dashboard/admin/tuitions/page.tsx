"use client"

import * as React from "react"
import { BookOpen, Loader2 } from "lucide-react"
import { toast } from "sonner"

import {
  ApprovalBadge,
  TuitionStatusBadge,
} from "@/components/tutor/status-badges"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { ApprovalStatus, TuitionDoc } from "@/lib/db"

type Filter = "all" | ApprovalStatus

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All Tuitions" },
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
]

function formatDate(value: string | Date) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export default function AdminTuitionsPage() {
  const [tuitions, setTuitions] = React.useState<TuitionDoc[]>([])
  const [filter, setFilter] = React.useState<Filter>("all")
  const [loading, setLoading] = React.useState(true)
  const [busyId, setBusyId] = React.useState<string | null>(null)

  React.useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await fetch("/api/admin/tuitions")
        const json = await res.json().catch(() => null)
        if (!res.ok) {
          throw new Error(json?.error || "Could not load tuitions.")
        }
        if (!cancelled) setTuitions(json.tuitions ?? [])
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

  async function updateApproval(
    tuition: TuitionDoc,
    approvalStatus: ApprovalStatus
  ) {
    setBusyId(tuition._id)
    try {
      const res = await fetch(`/api/admin/tuitions/${tuition._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvalStatus }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(json?.error || "Could not update the tuition.")
      }

      setTuitions((prev) =>
        prev.map((t) =>
          t._id === tuition._id
            ? { ...t, approvalStatus }
            : t
        )
      )
      toast.success(
        approvalStatus === "approved"
          ? "Tuition approved and visible to students."
          : "Tuition rejected."
      )
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.")
    } finally {
      setBusyId(null)
    }
  }

  const counts = {
    all: tuitions.length,
    pending: tuitions.filter((t) => t.approvalStatus === "pending").length,
    approved: tuitions.filter((t) => t.approvalStatus === "approved").length,
    rejected: tuitions.filter((t) => t.approvalStatus === "rejected").length,
  }

  const visible =
    filter === "all"
      ? tuitions
      : tuitions.filter((t) => t.approvalStatus === filter)

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Tuition Moderation
        </h1>
        <p className="text-sm text-muted-foreground">
          Review, approve, or reject tuition listings submitted by tutors before
          they become visible to students.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
              filter === item.id
                ? "border-primary bg-primary text-primary-foreground"
                : "bg-background hover:bg-muted"
            )}
          >
            {item.label}
            <span
              className={cn(
                "rounded-full px-1.5 text-xs",
                filter === item.id
                  ? "bg-primary-foreground/20"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {counts[item.id]}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading tuitions…
        </div>
      ) : visible.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="size-4" />
              No tuitions here
            </CardTitle>
            <CardDescription>
              {filter === "all"
                ? "No tuition posts have been submitted yet."
                : `No ${filter} tuition posts.`}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Card className="py-0">
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="border-b bg-muted/50 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Subject</th>
                  <th className="px-4 py-3 font-medium">Tutor</th>
                  <th className="px-4 py-3 font-medium">Monthly Fee</th>
                  <th className="px-4 py-3 font-medium">Approval</th>
                  <th className="px-4 py-3 font-medium">Active</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((tuition) => {
                  const busy = busyId === tuition._id
                  return (
                    <tr key={tuition._id} className="border-b last:border-0">
                      <td className="max-w-56 px-4 py-3">
                        <p className="truncate font-medium">{tuition.title}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {tuition.mode} · {tuition.classLevel}
                        </p>
                      </td>
                      <td className="px-4 py-3">{tuition.subject}</td>
                      <td className="max-w-52 px-4 py-3">
                        <p className="truncate">
                          {tuition.tutorName || "Tutor"}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {tuition.tutorEmail || "—"}
                        </p>
                      </td>
                      <td className="px-4 py-3 font-medium">
                        ৳{tuition.monthlyFee.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <ApprovalBadge status={tuition.approvalStatus} />
                      </td>
                      <td className="px-4 py-3">
                        <TuitionStatusBadge status={tuition.status} />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(tuition.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Button
                            size="xs"
                            disabled={
                              busy || tuition.approvalStatus === "approved"
                            }
                            onClick={() =>
                              updateApproval(tuition, "approved")
                            }
                          >
                            {busy && (
                              <Loader2 className="animate-spin" />
                            )}
                            Approve
                          </Button>
                          <Button
                            size="xs"
                            variant="destructive"
                            disabled={
                              busy || tuition.approvalStatus === "rejected"
                            }
                            onClick={() =>
                              updateApproval(tuition, "rejected")
                            }
                          >
                            Reject
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
