"use client"

import * as React from "react"
import Link from "next/link"
import { Dialog } from "@base-ui/react/dialog"
import {
  CalendarDays,
  CheckCircle2,
  Loader2,
  MapPin,
  Send,
  Wallet,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { API_BASE_URL } from "@/lib/api-url"
import type { TuitionDetail, Viewer } from "@/lib/tuition-detail"

const PHONE_PATTERN = /^\+?[0-9][0-9\s()-]{5,19}$/

async function getJwt() {
  const res = await fetch("/api/auth/token", {
    credentials: "include",
    cache: "no-store",
  })
  if (!res.ok) throw new Error("Please sign in again to continue.")

  const json = (await res.json().catch(() => null)) as { token?: string } | null
  if (!json?.token) throw new Error("Could not create a secure session token.")
  return json.token
}

type ApplicationPayload = {
  tuitionId: string
  tuitionTitle: string
  subject: string
  monthlyFee: number
  tutorEmail: string
  studentName: string
  studentEmail: string
  studentPhone: string
  preferredSchedule: string
  studentNote: string
}

/**
 * Has this student already applied? Prefers the Express endpoint but falls
 * back to the Next.js route handler when the backend doesn't expose it.
 */
async function checkAlreadyApplied(tuitionId: string): Promise<boolean> {
  try {
    const token = await getJwt()
    const res = await fetch(
      `${API_BASE_URL}/applications/check?tuitionId=${encodeURIComponent(tuitionId)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      }
    )
    if (res.ok) {
      const json = (await res.json()) as { applied?: boolean }
      return Boolean(json.applied)
    }
    if (res.status !== 404 && res.status !== 405) return false
  } catch {
    // Express is unreachable — try the Next.js route below.
  }

  try {
    const res = await fetch("/api/applications", { cache: "no-store" })
    if (!res.ok) return false
    const json = (await res.json().catch(() => null)) as {
      applications?: { tuitionId?: string }[]
    } | null
    return (json?.applications ?? []).some(
      (application) => application.tuitionId === tuitionId
    )
  } catch {
    return false
  }
}

/**
 * Submit the application through the Express backend, or through the Next.js
 * route handler when the backend route is missing/unreachable.
 */
async function postApplication(payload: ApplicationPayload): Promise<Response> {
  try {
    const token = await getJwt()
    const res = await fetch(`${API_BASE_URL}/applications`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })
    if (res.status !== 404 && res.status !== 405) return res
  } catch {
    // Express is unreachable — fall through to the Next.js route.
  }

  return fetch("/api/applications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tuitionId: payload.tuitionId,
      preferredSchedule: payload.preferredSchedule,
      note: payload.studentNote,
    }),
  })
}

type FieldErrors = {
  phone?: string
  schedule?: string
  note?: string
}

export function ApplyPanel({
  tuition,
  viewer,
}: {
  tuition: TuitionDetail
  viewer: Viewer | null
}) {
  const [open, setOpen] = React.useState(false)
  const [checking, setChecking] = React.useState(false)
  const [applied, setApplied] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)

  const [phone, setPhone] = React.useState(viewer?.phone ?? "")
  const [schedule, setSchedule] = React.useState("")
  const [note, setNote] = React.useState("")
  const [errors, setErrors] = React.useState<FieldErrors>({})

  React.useEffect(() => {
    if (viewer?.role !== "student") return
    let cancelled = false

    async function check() {
      setChecking(true)
      try {
        const alreadyApplied = await checkAlreadyApplied(tuition._id)
        if (!cancelled) setApplied(alreadyApplied)
      } catch {
        // POST still re-checks duplicates on the server.
      } finally {
        if (!cancelled) setChecking(false)
      }
    }

    check()
    return () => {
      cancelled = true
    }
  }, [tuition._id, viewer?.role])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!viewer) return

    const nextErrors: FieldErrors = {}
    if (!phone.trim()) nextErrors.phone = "Phone number is required."
    else if (!PHONE_PATTERN.test(phone.trim())) {
      nextErrors.phone = "Enter a valid phone number."
    }
    if (!schedule.trim()) {
      nextErrors.schedule = "Preferred schedule is required."
    }
    if (note.length > 300) {
      nextErrors.note = "Note must be 300 characters or fewer."
    }

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    try {
      const res = await postApplication({
        tuitionId: tuition._id,
        tuitionTitle: tuition.title,
        subject: tuition.subject,
        monthlyFee: tuition.monthlyFee,
        tutorEmail: tuition.tutorEmail ?? "",
        studentName: viewer.name,
        studentEmail: viewer.email,
        studentPhone: phone.trim(),
        preferredSchedule: schedule.trim(),
        studentNote: note.trim(),
      })

      const json = (await res.json().catch(() => null)) as {
        error?: string
      } | null
      if (!res.ok) {
        if (res.status === 409) setApplied(true)
        throw new Error(json?.error || "Could not submit your application.")
      }

      setApplied(true)
      setOpen(false)
      setSchedule("")
      setNote("")
      setErrors({})
      toast.success("Application submitted successfully.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.")
    } finally {
      setSubmitting(false)
    }
  }

  const signInHref = `/sign-in?redirect=${encodeURIComponent(
    `/tuitions/${tuition._id}`
  )}`

  return (
    <>
      <Card className="lg:sticky lg:top-24">
        <CardHeader>
          <CardTitle>Fee Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                Monthly Fee
              </p>
              <p className="mt-1 text-3xl font-bold">
                ৳{tuition.monthlyFee.toLocaleString()}
              </p>
            </div>
            <Badge variant="secondary">{tuition.mode}</Badge>
          </div>

          <div className="grid gap-2 border-t pt-3 text-sm">
            <p className="inline-flex items-center gap-2 text-muted-foreground">
              <Wallet className="size-4 shrink-0" />
              ৳{tuition.monthlyFee.toLocaleString()} per month
            </p>
            <p className="inline-flex items-center gap-2 text-muted-foreground">
              <CalendarDays className="size-4 shrink-0" />
              {tuition.daysPerWeek} days per week
            </p>
            <p className="inline-flex items-center gap-2 text-muted-foreground">
              <MapPin className="size-4 shrink-0" />
              <span className="line-clamp-2">{tuition.location}</span>
            </p>
          </div>

          <div className="space-y-2 border-t pt-3">
            {!viewer ? (
              <Button
                className="w-full"
                render={<Link href={signInHref} />}
                nativeButton={false}
              >
                Sign in to apply
              </Button>
            ) : viewer.role !== "student" ? (
              <>
                <Button className="w-full" disabled>
                  Apply for Tuition
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Only students can apply.
                </p>
              </>
            ) : applied ? (
              <Button variant="outline" className="w-full" disabled>
                <CheckCircle2 />
                Already Applied
              </Button>
            ) : (
              <Button
                className="w-full"
                disabled={checking}
                onClick={() => setOpen(true)}
              >
                {checking ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Send />
                )}
                Apply for Tuition
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog.Root
        open={open}
        onOpenChange={(next) => {
          if (!submitting) setOpen(next)
        }}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
          <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border bg-background p-5 shadow-lg outline-none">
            <Dialog.Title className="text-lg font-semibold">
              Apply for Tuition
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-muted-foreground">
              Send your application to {tuition.tutorName || "the tutor"}.
            </Dialog.Description>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4" noValidate>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="student-name">Student name</Label>
                  <Input
                    id="student-name"
                    value={viewer?.name ?? ""}
                    readOnly
                    className="bg-muted/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="student-email">Student email</Label>
                  <Input
                    id="student-email"
                    type="email"
                    value={viewer?.email ?? ""}
                    readOnly
                    className="bg-muted/50"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="student-phone">Phone number</Label>
                <Input
                  id="student-phone"
                  type="tel"
                  value={phone}
                  onChange={(event) => {
                    setPhone(event.target.value)
                    if (errors.phone) {
                      setErrors((prev) => ({ ...prev, phone: undefined }))
                    }
                  }}
                  placeholder="+880 1XXX-XXXXXX"
                  aria-invalid={Boolean(errors.phone)}
                  aria-describedby={errors.phone ? "phone-error" : undefined}
                  required
                />
                {errors.phone && (
                  <p id="phone-error" className="text-xs text-destructive">
                    {errors.phone}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="preferred-schedule">Preferred schedule</Label>
                <Input
                  id="preferred-schedule"
                  value={schedule}
                  onChange={(event) => {
                    setSchedule(event.target.value)
                    if (errors.schedule) {
                      setErrors((prev) => ({ ...prev, schedule: undefined }))
                    }
                  }}
                  placeholder="e.g. Sat–Mon, 6–8 PM"
                  aria-invalid={Boolean(errors.schedule)}
                  aria-describedby={
                    errors.schedule ? "schedule-error" : undefined
                  }
                  required
                />
                {errors.schedule && (
                  <p id="schedule-error" className="text-xs text-destructive">
                    {errors.schedule}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="student-note">Note (optional)</Label>
                  <span
                    className={
                      note.length > 300
                        ? "text-xs text-destructive"
                        : "text-xs text-muted-foreground"
                    }
                  >
                    {note.length}/300
                  </span>
                </div>
                <Textarea
                  id="student-note"
                  rows={3}
                  maxLength={300}
                  value={note}
                  onChange={(event) => {
                    setNote(event.target.value)
                    if (errors.note) {
                      setErrors((prev) => ({ ...prev, note: undefined }))
                    }
                  }}
                  placeholder="Anything the tutor should know"
                  aria-invalid={Boolean(errors.note)}
                  aria-describedby={errors.note ? "note-error" : undefined}
                />
                {errors.note && (
                  <p id="note-error" className="text-xs text-destructive">
                    {errors.note}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 border-t pt-4">
                <Dialog.Close
                  render={
                    <Button type="button" variant="ghost" disabled={submitting} />
                  }
                >
                  Cancel
                </Dialog.Close>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <Send />
                  )}
                  Submit application
                </Button>
              </div>
            </form>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
}

export default ApplyPanel
