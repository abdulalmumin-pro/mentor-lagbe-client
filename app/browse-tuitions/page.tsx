"use client"

import * as React from "react"
import Link from "next/link"
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  FilePlus,
  GraduationCap,
  Loader2,
  MapPin,
  Monitor,
  Search,
  Send,
  Users,
} from "lucide-react"
import { toast } from "sonner"

import Footer from "@/components/Footer"
import Navbar from "@/components/Navbar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect } from "@/components/ui/native-select"
import { Textarea } from "@/components/ui/textarea"
import { useSession } from "@/lib/auth-client"
import type { TuitionDoc } from "@/lib/db"
import { CLASS_LEVELS, TUITION_MODES } from "@/lib/tuition"

const ALL = "all"

/** A tuition returned by `GET /api/tuitions?scope=approved`. */
type ApprovedTuition = TuitionDoc & { tutorName?: string }

/**
 * Browse every approved, active tuition.
 * Visible to signed-out visitors, students, tutors, and admins; only students
 * get the apply form.
 */
export default function BrowseTuitionsPage() {
  const { data: session, isPending } = useSession()
  const role = session?.user.role
  const isStudent = role === "student"

  const [tuitions, setTuitions] = React.useState<ApprovedTuition[]>([])
  const [loading, setLoading] = React.useState(true)
  const [query, setQuery] = React.useState("")
  const [classLevel, setClassLevel] = React.useState<string>(ALL)
  const [mode, setMode] = React.useState<string>(ALL)

  const [appliedIds, setAppliedIds] = React.useState<Set<string>>(new Set())
  const [openApplyId, setOpenApplyId] = React.useState<string | null>(null)
  const [schedule, setSchedule] = React.useState("")
  const [note, setNote] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)

  // Pre-fill the search from ?subject=math (set by the homepage subject cards).
  React.useEffect(() => {
    const subject = new URLSearchParams(window.location.search).get("subject")
    if (subject) setQuery(subject)
  }, [])

  React.useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await fetch("/api/tuitions?scope=approved")
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

  // Mark the student's existing applications so they can't apply twice.
  React.useEffect(() => {
    if (!isStudent) return
    let cancelled = false

    async function loadApplications() {
      try {
        const res = await fetch("/api/applications")
        if (!res.ok) return
        const json = await res.json()
        if (cancelled) return
        setAppliedIds(
          new Set(
            (json.applications ?? []).map(
              (application: { tuitionId: string }) => application.tuitionId
            )
          )
        )
      } catch {
        // Only the "Applied" hint depends on this; POST still validates.
      }
    }

    loadApplications()
    return () => {
      cancelled = true
    }
  }, [isStudent])

  const visible = React.useMemo(() => {
    const q = query.trim().toLowerCase()

    return tuitions.filter((tuition) => {
      const haystack = [
        tuition.title,
        tuition.subject,
        tuition.location,
        tuition.tutorName ?? "",
      ]
        .join(" ")
        .toLowerCase()

      return (
        (!q || haystack.includes(q)) &&
        (classLevel === ALL || tuition.classLevel === classLevel) &&
        (mode === ALL || tuition.mode === mode)
      )
    })
  }, [tuitions, query, classLevel, mode])

  function startApply(tuitionId: string) {
    setOpenApplyId(tuitionId)
    setSchedule("")
    setNote("")
  }

  async function submitApplication(tuition: ApprovedTuition) {
    if (!schedule.trim()) {
      toast.error("Please add your preferred schedule.")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tuitionId: tuition._id,
          preferredSchedule: schedule.trim(),
          note: note.trim(),
        }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(json?.error || "Could not submit your application.")
      }

      setAppliedIds((prev) => new Set(prev).add(tuition._id))
      setOpenApplyId(null)
      toast.success(`Applied to "${tuition.title}".`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.")
    } finally {
      setSubmitting(false)
    }
  }

  const hasFilters = Boolean(query) || classLevel !== ALL || mode !== ALL

  return (
    <div className="flex min-h-svh flex-col">
      <Navbar />

      <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Browse Tuitions
            </h1>
            <p className="text-sm text-muted-foreground">
              Every admin-approved tuition that is currently open for
              applications.
            </p>
          </div>
          {role === "tutor" && (
            <Button
              render={<Link href="/dashboard/tutor/post-tuition" />}
              nativeButton={false}
            >
              <FilePlus />
              Post a Tuition
            </Button>
          )}
        </div>

        {/* Filters */}
        <Card size="sm">
          <CardContent className="grid gap-3 sm:grid-cols-[1fr_180px_160px]">
            <div className="relative">
              <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by title, subject, tutor, or location"
                aria-label="Search tuitions"
                className="pl-8"
              />
            </div>

            <NativeSelect
              aria-label="Filter by class level"
              value={classLevel}
              onChange={(event) => setClassLevel(event.target.value)}
            >
              <option value={ALL}>All class levels</option>
              {CLASS_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </NativeSelect>

            <NativeSelect
              aria-label="Filter by mode"
              value={mode}
              onChange={(event) => setMode(event.target.value)}
            >
              <option value={ALL}>All modes</option>
              {TUITION_MODES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </NativeSelect>
          </CardContent>
        </Card>

        <p className="text-sm text-muted-foreground">
          {loading
            ? "Loading tuitions…"
            : `${visible.length} tuition${visible.length === 1 ? "" : "s"} available`}
        </p>

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
                No tuitions to show
              </CardTitle>
              <CardDescription>
                {hasFilters
                  ? "No approved tuition matches your filters. Try clearing them."
                  : "Approved tuition posts will appear here as soon as an admin reviews them."}
              </CardDescription>
            </CardHeader>
            {hasFilters && (
              <CardContent>
                <Button
                  variant="outline"
                  onClick={() => {
                    setQuery("")
                    setClassLevel(ALL)
                    setMode(ALL)
                  }}
                >
                  Clear filters
                </Button>
              </CardContent>
            )}
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visible.map((tuition) => {
              const applied = appliedIds.has(tuition._id)
              const applying = openApplyId === tuition._id

              return (
                <Card key={tuition._id} size="sm" className="flex flex-col">
                  {tuition.bannerImage && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={tuition.bannerImage}
                      alt={tuition.title}
                      className="h-36 w-full object-cover"
                    />
                  )}

                  <CardContent className="flex flex-1 flex-col gap-3">
                    <div className="space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <h2 className="text-base leading-snug font-semibold">
                          {tuition.title}
                        </h2>
                        <Badge
                          variant="outline"
                          className="shrink-0 border-primary/30 bg-primary/10 text-primary"
                        >
                          {tuition.subject}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        By {tuition.tutorName || "Tutor"}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <GraduationCap className="size-3.5" />
                        {tuition.classLevel}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Monitor className="size-3.5" />
                        {tuition.mode}
                      </span>
                      <span className="inline-flex min-w-0 items-center gap-1">
                        <MapPin className="size-3.5 shrink-0" />
                        <span className="truncate">{tuition.location}</span>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="size-3.5" />
                        {tuition.daysPerWeek} days/week
                      </span>
                    </div>

                    <p className="line-clamp-3 text-sm text-muted-foreground">
                      {tuition.description}
                    </p>

                    <div className="mt-auto flex items-center justify-between gap-2 border-t pt-3">
                      <p className="text-base font-bold">
                        ৳{tuition.monthlyFee.toLocaleString()}
                        <span className="text-xs font-normal text-muted-foreground">
                          {" "}
                          /month
                        </span>
                      </p>

                      {isPending ? null : applied ? (
                        <Badge
                          variant="outline"
                          className="border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                        >
                          <CheckCircle2 />
                          Applied
                        </Badge>
                      ) : isStudent ? (
                        <Button
                          size="sm"
                          disabled={applying}
                          onClick={() => startApply(tuition._id)}
                        >
                          <Send />
                          Apply
                        </Button>
                      ) : session?.user ? (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Users className="size-3.5" />
                          Tutor listing
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          render={<Link href="/sign-in" />}
                          nativeButton={false}
                        >
                          Sign in to apply
                        </Button>
                      )}
                    </div>

                    {isStudent && applying && (
                      <div className="space-y-2 rounded-lg border bg-muted/40 p-3">
                        <div className="space-y-1">
                          <Label
                            htmlFor={`schedule-${tuition._id}`}
                            className="text-xs"
                          >
                            Preferred schedule
                          </Label>
                          <Input
                            id={`schedule-${tuition._id}`}
                            value={schedule}
                            onChange={(event) => setSchedule(event.target.value)}
                            placeholder="e.g. Sat–Mon, 6–8 PM"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label
                            htmlFor={`note-${tuition._id}`}
                            className="text-xs"
                          >
                            Note (optional)
                          </Label>
                          <Textarea
                            id={`note-${tuition._id}`}
                            rows={2}
                            value={note}
                            onChange={(event) => setNote(event.target.value)}
                            placeholder="Anything the tutor should know"
                          />
                        </div>

                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={submitting}
                            onClick={() => setOpenApplyId(null)}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            disabled={submitting}
                            onClick={() => submitApplication(tuition)}
                          >
                            {submitting ? (
                              <Loader2 className="animate-spin" />
                            ) : (
                              <Send />
                            )}
                            Submit application
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}