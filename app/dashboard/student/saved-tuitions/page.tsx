"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowRight,
  Bookmark,
  CalendarDays,
  GraduationCap,
  Loader2,
  MapPin,
  Monitor,
  Search,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { TuitionDoc } from "@/lib/db"
import { FREE_BOOKMARK_LIMIT } from "@/lib/tuition"

export default function SavedTuitionsPage() {
  const [tuitions, setTuitions] = React.useState<TuitionDoc[]>([])
  const [loading, setLoading] = React.useState(true)
  const [busyId, setBusyId] = React.useState<string | null>(null)

  React.useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await fetch("/api/bookmarks")
        const json = await res.json().catch(() => null)
        if (!res.ok) {
          throw new Error(json?.error || "Could not load your saved tuitions.")
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

  async function remove(tuitionId: string) {
    setBusyId(tuitionId)
    try {
      const res = await fetch(
        `/api/bookmarks?tuitionId=${encodeURIComponent(tuitionId)}`,
        { method: "DELETE" }
      )
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(json?.error || "Could not remove this tuition.")
      }

      setTuitions((prev) => prev.filter((tuition) => tuition._id !== tuitionId))
      toast.success("Removed from saved tuitions.")
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
          <h1 className="text-2xl font-bold tracking-tight">Saved Tuitions</h1>
          <p className="text-sm text-muted-foreground">
            Bookmark tuitions you like and come back to them later. Free
            accounts can save up to {FREE_BOOKMARK_LIMIT} tuitions.
          </p>
        </div>
        <Button render={<Link href="/tuitions" />} nativeButton={false}>
          <Search />
          Browse Tuitions
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading saved tuitions…
        </div>
      ) : tuitions.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bookmark className="size-4" />
              No saved tuitions yet
            </CardTitle>
            <CardDescription>
              Browse tuitions and save the ones you want to revisit.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              render={<Link href="/tuitions" />}
              nativeButton={false}
            >
              <Search />
              Find a Tuition
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {tuitions.map((tuition) => (
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
                    <Link
                      href={`/tuitions/${tuition._id}`}
                      className="line-clamp-2 text-base leading-snug font-semibold hover:text-primary"
                    >
                      {tuition.title}
                    </Link>
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

                <div className="mt-auto flex items-center justify-between gap-2 border-t pt-3">
                  <p className="text-base font-bold">
                    ৳{tuition.monthlyFee.toLocaleString()}
                    <span className="text-xs font-normal text-muted-foreground">
                      {" "}
                      /month
                    </span>
                  </p>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="icon-sm"
                      aria-label={`Remove ${tuition.title} from saved tuitions`}
                      title="Remove from saved tuitions"
                      disabled={busyId === tuition._id}
                      onClick={() => remove(tuition._id)}
                    >
                      {busyId === tuition._id ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <Trash2 />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      render={<Link href={`/tuitions/${tuition._id}`} />}
                      nativeButton={false}
                    >
                      View
                      <ArrowRight />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
