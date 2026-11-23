"use client"

import * as React from "react"
import Link from "next/link"
import {
  BookOpen,
  CalendarDays,
  FilePlus,
  Loader2,
  MapPin,
  Pencil,
  Power,
  Trash2,
  Wallet,
} from "lucide-react"
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
import type { TuitionDoc } from "@/lib/db"

export default function MyTuitionsPage() {
  const [tuitions, setTuitions] = React.useState<TuitionDoc[]>([])
  const [loading, setLoading] = React.useState(true)
  const [busyId, setBusyId] = React.useState<string | null>(null)

  React.useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await fetch("/api/tuitions")
        const json = await res.json().catch(() => null)
        if (!res.ok) throw new Error(json?.error || "Could not load tuitions.")
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

  async function toggleStatus(tuition: TuitionDoc) {
    const isActive =
      typeof tuition.isActive === "boolean"
        ? tuition.isActive
        : tuition.status === "active"
    const next = isActive ? "closed" : "active"
    setBusyId(tuition._id)
    try {
      const res = await fetch(`/api/tuitions/${tuition._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.error || "Could not update status.")

      setTuitions((prev) =>
        prev.map((t) => (t._id === tuition._id ? json.tuition : t))
      )
      toast.success(
        next === "active" ? "Tuition reopened." : "Tuition closed."
      )
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.")
    } finally {
      setBusyId(null)
    }
  }

  async function deleteTuition(tuition: TuitionDoc) {
    if (
      !window.confirm(
        `Delete "${tuition.title}"? Its applications will be removed too.`
      )
    ) {
      return
    }

    setBusyId(tuition._id)
    try {
      const res = await fetch(`/api/tuitions/${tuition._id}`, {
        method: "DELETE",
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.error || "Could not delete tuition.")

      setTuitions((prev) => prev.filter((t) => t._id !== tuition._id))
      toast.success("Tuition deleted.")
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
          <h1 className="text-2xl font-bold tracking-tight">My Tuitions</h1>
          <p className="text-sm text-muted-foreground">
            Edit, delete, or open/close the tuitions you&apos;ve posted.
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

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading your tuitions…
        </div>
      ) : tuitions.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="size-4" />
              No tuitions yet
            </CardTitle>
            <CardDescription>
              Post your first tuition to start receiving applications.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              render={<Link href="/dashboard/tutor/post-tuition" />}
              nativeButton={false}
            >
              <FilePlus />
              Post Tuition
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {tuitions.map((tuition) => {
            const busy = busyId === tuition._id
            return (
              <Card key={tuition._id} size="sm">
                <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  {/* Banner */}
                  <div className="flex h-24 w-full shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted sm:w-40">
                    {tuition.bannerImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={tuition.bannerImage}
                        alt={tuition.title}
                        className="size-full object-cover"
                      />
                    ) : (
                      <BookOpen className="size-6 text-muted-foreground" />
                    )}
                  </div>

                  {/* Details */}
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-semibold">
                        {tuition.title}
                      </h2>
                      <ApprovalBadge status={tuition.approvalStatus} />
                      <TuitionStatusBadge status={tuition.status} />
                    </div>

                    <p className="text-sm text-muted-foreground">
                      {tuition.subject} · {tuition.classLevel} ·{" "}
                      {tuition.mode}
                    </p>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-3.5" />
                        {tuition.location}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Wallet className="size-3.5" />
                        ৳{tuition.monthlyFee.toLocaleString()} / month
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="size-3.5" />
                        {tuition.daysPerWeek} days / week
                      </span>
                    </div>

                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {tuition.description}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 sm:flex-col">
                    <Button
                      variant="outline"
                      size="sm"
                      render={
                        <Link
                          href={`/dashboard/tutor/my-tuitions/${tuition._id}/edit`}
                        />
                      }
                      nativeButton={false}
                    >
                      <Pencil />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busy}
                      onClick={() => toggleStatus(tuition)}
                    >
                      {busy ? <Loader2 className="animate-spin" /> : <Power />}
                      {tuition.isActive === false ||
                      (tuition.isActive === undefined &&
                        tuition.status !== "active")
                        ? "Reopen"
                        : "Close"}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={busy}
                      onClick={() => deleteTuition(tuition)}
                    >
                      <Trash2 />
                      Delete
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
