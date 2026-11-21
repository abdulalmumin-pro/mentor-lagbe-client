
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

import type {
  ApprovalStatus,
  TuitionDoc,
} from "@/lib/db"

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

        if (!cancelled) {
          setTuitions(json.tuitions ?? [])
        }
      } catch (err) {
        if (!cancelled) {
          toast.error(
            err instanceof Error
              ? err.message
              : "Something went wrong."
          )
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
      const res = await fetch(
        `/api/admin/tuitions/${tuition._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ approvalStatus }),
        }
      )

      const json = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(
          json?.error || "Could not update the tuition."
        )
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
      toast.error(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      )
    } finally {
      setBusyId(null)
    }
  }

  const counts = {
    all: tuitions.length,
    pending: tuitions.filter(
      (t) => t.approvalStatus === "pending"
    ).length,
    approved: tuitions.filter(
      (t) => t.approvalStatus === "approved"
    ).length,
    rejected: tuitions.filter(
      (t) => t.approvalStatus === "rejected"
    ).length,
  }

  const visible =
    filter === "all"
      ? tuitions
      : tuitions.filter(
          (t) => t.approvalStatus === filter
        )

  const Actions = ({ tuition }: { tuition: TuitionDoc }) => {
    const busy = busyId === tuition._id

    return (
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          disabled={
            busy || tuition.approvalStatus === "approved"
          }
          onClick={() =>
            updateApproval(tuition, "approved")
          }
        >
          {busy && (
            <Loader2 className="mr-1 size-3 animate-spin" />
          )}
          Approve
        </Button>

        <Button
          size="sm"
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
    )
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 p-4 sm:p-6 lg:p-8">

      {/* Page Heading */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Tuition Moderation
        </h1>

        <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">
          Review, approve, or reject tuition listings submitted
          by tutors before they become visible to students.
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              filter === item.id
                ? "border-primary bg-primary text-primary-foreground"
                : "bg-background hover:bg-muted"
            }`}
          >
            {item.label}

            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                filter === item.id
                  ? "bg-primary-foreground/20"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {counts[item.id]}
            </span>
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          Loading tuitions...
        </div>
      ) : visible.length === 0 ? (

        /* Empty State */
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="size-5" />
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
        <>
          {/* MOBILE & TABLET CARDS */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:hidden">
            {visible.map((tuition) => (
              <Card key={tuition._id} className="overflow-hidden">
                <CardHeader className="space-y-3 pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <CardTitle className="break-words text-base">
                        {tuition.title}
                      </CardTitle>

                      <CardDescription className="mt-1">
                        {tuition.mode} · {tuition.classLevel}
                      </CardDescription>
                    </div>

                    <div className="shrink-0">
                      <ApprovalBadge
                        status={tuition.approvalStatus}
                      />
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">

                  <div className="grid grid-cols-2 gap-4">
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">
                        Subject
                      </p>
                      <p className="mt-1 break-words text-sm font-medium">
                        {tuition.subject}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">
                        Monthly Fee
                      </p>
                      <p className="mt-1 text-sm font-semibold">
                        ৳{tuition.monthlyFee.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      Tutor
                    </p>

                    <p className="break-words text-sm font-medium">
                      {tuition.tutorName || "Tutor"}
                    </p>

                    <p className="break-all text-xs text-muted-foreground">
                      {tuition.tutorEmail || "—"}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
                    <div>
                      <p className="mb-1 text-xs text-muted-foreground">
                        Listing Status
                      </p>
                      <TuitionStatusBadge status={tuition.status} />
                    </div>

                    <div className="text-right">
                      <p className="mb-1 text-xs text-muted-foreground">
                        Created
                      </p>
                      <p className="text-sm">
                        {formatDate(tuition.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="border-t pt-3">
                    <Actions tuition={tuition} />
                  </div>

                </CardContent>
              </Card>
            ))}
          </div>

          {/* DESKTOP TABLE */}
          <Card className="hidden overflow-hidden py-0 lg:block">
            <CardContent className="overflow-x-auto p-0">
              <table className="w-full min-w-[1050px] text-sm">
                <thead className="border-b bg-muted/50 text-left">
                  <tr>
                    <th className="px-4 py-4 font-medium">Title</th>
                    <th className="px-4 py-4 font-medium">Subject</th>
                    <th className="px-4 py-4 font-medium">Tutor</th>
                    <th className="px-4 py-4 font-medium">Monthly Fee</th>
                    <th className="px-4 py-4 font-medium">Approval</th>
                    <th className="px-4 py-4 font-medium">Active</th>
                    <th className="px-4 py-4 font-medium">Created</th>
                    <th className="px-4 py-4 font-medium">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {visible.map((tuition) => (
                    <tr
                      key={tuition._id}
                      className="border-b last:border-0 hover:bg-muted/30"
                    >
                      <td className="max-w-56 px-4 py-4">
                        <p className="truncate font-medium">
                          {tuition.title}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {tuition.mode} · {tuition.classLevel}
                        </p>
                      </td>

                      <td className="px-4 py-4">
                        {tuition.subject}
                      </td>

                      <td className="max-w-52 px-4 py-4">
                        <p className="truncate">
                          {tuition.tutorName || "Tutor"}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {tuition.tutorEmail || "—"}
                        </p>
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 font-medium">
                        ৳{tuition.monthlyFee.toLocaleString()}
                      </td>

                      <td className="px-4 py-4">
                        <ApprovalBadge
                          status={tuition.approvalStatus}
                        />
                      </td>

                      <td className="px-4 py-4">
                        <TuitionStatusBadge
                          status={tuition.status}
                        />
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-muted-foreground">
                        {formatDate(tuition.createdAt)}
                      </td>

                      <td className="px-4 py-4">
                        <Actions tuition={tuition} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
