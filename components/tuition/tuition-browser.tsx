"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  GraduationCap,
  Loader2,
  MapPin,
  Monitor,
  Search,
} from "lucide-react"
import { toast } from "sonner"

import { BookmarkButton } from "@/components/tuition/bookmark-button"
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
import { NativeSelect } from "@/components/ui/native-select"
import { useSession } from "@/lib/auth-client"
import type { TuitionDoc } from "@/lib/db"
import { CLASS_LEVELS, TUITION_MODES } from "@/lib/tuition"

const ALL = "all"
const PAGE_SIZE = 9

type BrowseTuition = TuitionDoc & { tutorName?: string }

export type BrowseResponse = {
  tuitions: BrowseTuition[]
  total: number
  page: number
  limit: number
  totalPages: number
}

const EMPTY: BrowseResponse = {
  tuitions: [],
  total: 0,
  page: 1,
  limit: PAGE_SIZE,
  totalPages: 1,
}

/**
 * Search + filter + paginate approved tuitions.
 * Filtering happens in MongoDB (`GET /api/tuitions?scope=approved`), not in the
 * browser, so it keeps working as the dataset grows.
 */
export function TuitionBrowser({
  initial,
  initialQuery = "",
}: {
  initial?: BrowseResponse
  initialQuery?: string
}) {
  const { data: session, isPending } = useSession()
  const isStudent = session?.user.role === "student"

  const [data, setData] = React.useState<BrowseResponse>(initial ?? EMPTY)
  const [loading, setLoading] = React.useState(!initial)
  const [query, setQuery] = React.useState(initialQuery)
  const [debouncedQuery, setDebouncedQuery] = React.useState(initialQuery)
  const [classLevel, setClassLevel] = React.useState<string>(ALL)
  const [mode, setMode] = React.useState<string>(ALL)
  const [page, setPage] = React.useState(initial?.page ?? 1)
  const [savedIds, setSavedIds] = React.useState<Set<string>>(new Set())

  // The server already rendered page 1 with no filters.
  const skipFirstFetch = React.useRef(Boolean(initial))

  // Debounce the search box so we don't query on every keystroke.
  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query.trim())
      setPage(1)
    }, 300)
    return () => window.clearTimeout(timer)
  }, [query])

  React.useEffect(() => {
    if (skipFirstFetch.current) {
      skipFirstFetch.current = false
      return
    }

    const controller = new AbortController()

    async function load() {
      setLoading(true)
      try {
        const params = new URLSearchParams({
          scope: "approved",
          page: String(page),
          limit: String(PAGE_SIZE),
        })
        if (debouncedQuery) params.set("q", debouncedQuery)
        if (classLevel !== ALL) params.set("classLevel", classLevel)
        if (mode !== ALL) params.set("mode", mode)

        const res = await fetch(`/api/tuitions?${params.toString()}`, {
          signal: controller.signal,
        })
        const json = await res.json().catch(() => null)
        if (!res.ok) {
          throw new Error(json?.error || "Could not load tuitions.")
        }

        setData({
          tuitions: json.tuitions ?? [],
          total: json.total ?? 0,
          page: json.page ?? page,
          limit: json.limit ?? PAGE_SIZE,
          totalPages: json.totalPages ?? 1,
        })
      } catch (err) {
        if (controller.signal.aborted) return
        toast.error(err instanceof Error ? err.message : "Something went wrong.")
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    load()
    return () => controller.abort()
  }, [debouncedQuery, classLevel, mode, page])

  // Load the student's saved tuitions once, to paint the bookmark buttons.
  React.useEffect(() => {
    if (!isStudent) return
    let cancelled = false

    async function loadBookmarks() {
      try {
        const res = await fetch("/api/bookmarks")
        if (!res.ok) return
        const json = await res.json()
        if (cancelled) return
        setSavedIds(
          new Set<string>(
            (json.tuitionIds ?? []).length > 0
              ? json.tuitionIds
              : (json.tuitions ?? []).map((t: BrowseTuition) => t._id)
          )
        )
      } catch {
        // Bookmark state is a hint; the button still works without it.
      }
    }

    loadBookmarks()
    return () => {
      cancelled = true
    }
  }, [isStudent])

  function updateSaved(tuitionId: string, saved: boolean) {
    setSavedIds((prev) => {
      const next = new Set(prev)
      if (saved) next.add(tuitionId)
      else next.delete(tuitionId)
      return next
    })
  }

  const hasFilters =
    Boolean(debouncedQuery) || classLevel !== ALL || mode !== ALL
  const pages = buildPageList(data.page, data.totalPages)

  return (
    <div className="space-y-6">
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
            onChange={(event) => {
              setClassLevel(event.target.value)
              setPage(1)
            }}
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
            onChange={(event) => {
              setMode(event.target.value)
              setPage(1)
            }}
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

      <p className="text-sm text-muted-foreground" aria-live="polite">
        {loading
          ? "Loading tuitions…"
          : `${data.total} tuition${data.total === 1 ? "" : "s"} available`}
      </p>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading tuitions…
        </div>
      ) : data.tuitions.length === 0 ? (
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
                  setDebouncedQuery("")
                  setClassLevel(ALL)
                  setMode(ALL)
                  setPage(1)
                }}
              >
                Clear filters
              </Button>
            </CardContent>
          )}
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.tuitions.map((tuition) => (
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

                  <div className="flex items-center gap-1.5">
                    {!isPending && (
                      <BookmarkButton
                        tuitionId={tuition._id}
                        saved={savedIds.has(tuition._id)}
                        onSavedChange={(saved) =>
                          updateSaved(tuition._id, saved)
                        }
                      />
                    )}
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

      {/* Pagination */}
      {!loading && data.totalPages > 1 && (
        <nav
          aria-label="Pagination"
          className="flex flex-wrap items-center justify-center gap-1.5"
        >
          <Button
            variant="outline"
            size="sm"
            disabled={data.page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>

          {pages.map((item, index) =>
            item === "…" ? (
              <span
                key={`gap-${index}`}
                className="px-1.5 text-sm text-muted-foreground"
              >
                …
              </span>
            ) : (
              <Button
                key={item}
                size="sm"
                variant={item === data.page ? "default" : "outline"}
                aria-current={item === data.page ? "page" : undefined}
                onClick={() => setPage(item)}
              >
                {item}
              </Button>
            )
          )}

          <Button
            variant="outline"
            size="sm"
            disabled={data.page >= data.totalPages}
            onClick={() =>
              setPage((p) => Math.min(data.totalPages, p + 1))
            }
          >
            Next
          </Button>
        </nav>
      )}
    </div>
  )
}

/** 1 … 4 [5] 6 … 12 style page list. */
function buildPageList(current: number, total: number): (number | "…")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const pages = new Set<number>([1, total, current - 1, current, current + 1])
  const sorted = [...pages]
    .filter((page) => page >= 1 && page <= total)
    .sort((a, b) => a - b)

  const result: (number | "…")[] = []
  let previous = 0
  for (const page of sorted) {
    if (previous && page - previous > 1) result.push("…")
    result.push(page)
    previous = page
  }
  return result
}

export default TuitionBrowser
