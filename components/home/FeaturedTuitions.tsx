"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowRight, BookOpen, GraduationCap, MapPin } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import type { TuitionDoc } from "@/lib/db"

interface FeaturedTuitionsProps {
  tuitions?: TuitionDoc[]
}

/** Approved, and active (supports both `isActive` and the older `status`). */
function isOpenForApplications(tuition: TuitionDoc) {
  const { isActive, status } = tuition as TuitionDoc & { isActive?: boolean }
  const active =
    typeof isActive === "boolean"
      ? isActive
      : typeof status === "string"
        ? status === "active"
        : true
  return tuition.approvalStatus === "approved" && active
}

export default function FeaturedTuitions({
  tuitions: initialTuitions = [],
}: FeaturedTuitionsProps) {
  const [fetched, setFetched] = React.useState<TuitionDoc[]>([])
  const hasInitial = initialTuitions.length > 0

  // If the parent page did not pass any tuitions, load them like the
  // Browse Tuitions page does.
  React.useEffect(() => {
    if (hasInitial) return
    let cancelled = false

    async function load() {
      try {
        const res = await fetch("/api/tuitions?scope=approved")
        if (!res.ok) return
        const json = await res.json()
        if (!cancelled) setFetched(json.tuitions ?? [])
      } catch {
        // Keep the empty state if loading fails.
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [hasInitial])

  // Show only approved and active tuitions
  const featuredTuitions = (hasInitial ? initialTuitions : fetched)
    .filter(isOpenForApplications)
    .slice(0, 6)

  return (
    <section className="w-full py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <BookOpen className="size-4" />
              Find Your Tuition
            </div>

            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Featured Tuitions
            </h2>

            <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
              Explore the latest tuition opportunities and find the right
              learning experience for you.
            </p>
          </div>

          <Link
            href="/tuitions"
            className="inline-flex w-fit shrink-0 items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Browse All Tuitions
            <ArrowRight className="size-4 shrink-0" />
          </Link>
        </div>

        {/* Tuition Cards */}
        {featuredTuitions.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featuredTuitions.map((tuition) => (
              <Card
                key={tuition._id}
                className="group overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                {tuition.bannerImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={tuition.bannerImage}
                    alt={tuition.title}
                    className="h-36 w-full object-cover"
                  />
                )}

                <CardHeader className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      {tuition.subject}
                    </span>

                    <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-600">
                      Available
                    </span>
                  </div>

                  <CardTitle className="line-clamp-2 text-lg transition-colors group-hover:text-primary">
                    {tuition.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="size-4 shrink-0 text-primary" />
                      <span>Class: {tuition.classLevel}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <BookOpen className="size-4 shrink-0 text-primary" />
                      <span>{tuition.mode}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin className="size-4 shrink-0 text-primary" />
                      <span className="truncate">
                        Tutor: {tuition.tutorName || "Experienced Tutor"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t pt-4">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Monthly Fee
                      </p>

                      <p className="text-xl font-bold text-primary">
                        ৳{tuition.monthlyFee.toLocaleString()}
                      </p>
                    </div>

                    <Link
                      href={`/tuitions/${tuition._id}`}
                      className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                      Explore
                      <ArrowRight className="size-4" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed p-10 text-center">
            <BookOpen className="mx-auto mb-3 size-10 text-muted-foreground" />

            <h3 className="font-semibold">No Featured Tuitions Yet</h3>

            <p className="mt-2 text-sm text-muted-foreground">
              New tuition opportunities will appear here.
            </p>

            <Link
              href="/tuitions"
              className="mt-4 inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              Browse Tuitions
            </Link>
          </div>
        )}

        {/* Bottom Browse Button */}
        {featuredTuitions.length > 0 && (
          <div className="mt-8 flex justify-center">
            <Link
              href="/tuitions"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold whitespace-nowrap text-primary-foreground transition-colors hover:bg-primary/90"
            >
              View All Tuitions
              <ArrowRight className="size-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}