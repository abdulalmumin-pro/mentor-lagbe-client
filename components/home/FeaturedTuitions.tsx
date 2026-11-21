import Link from "next/link"
import { ArrowRight, BookOpen, GraduationCap, MapPin } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import type { TuitionDoc } from "@/lib/db"

interface FeaturedTuitionsProps {
  tuitions?: TuitionDoc[]
}

export default function FeaturedTuitions({
  tuitions = [],
}: FeaturedTuitionsProps) {
  // Show only approved and active tuitions
  const featuredTuitions = (tuitions ?? [])
    .filter(
      (tuition) =>
        tuition.approvalStatus === "approved" && tuition.status === "active"
    )
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

          <Button
            asChild
            variant="outline"
            className="w-fit shrink-0 whitespace-nowrap"
          >
            <Link
              href="/browse-tuitions"
              className="flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <span>Browse All Tuitions</span>
              <ArrowRight className="size-4 shrink-0" />
            </Link>
          </Button>
        </div>

        {/* Tuition Cards */}
        {featuredTuitions.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featuredTuitions.map((tuition) => (
              <Card
                key={tuition._id}
                className="group overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
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

                    <Button asChild size="sm">
                      <Link href="/browse-tuitions">
                        Explore
                        <ArrowRight className="ml-2 size-4" />
                      </Link>
                    </Button>
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

            <Button asChild variant="outline" className="mt-4">
              <Link href="/browse-tuitions">Browse Tuitions</Link>
            </Button>
          </div>
        )}

        {/* Bottom Browse Button */}
        {featuredTuitions.length > 0 && (
          <div className="mt-8 flex justify-center">
            <Button asChild size="lg" className="whitespace-nowrap">
              <Link
                href="/browse-tuitions"
                className="flex items-center gap-2 whitespace-nowrap"
              >
                View All Tuitions
                <ArrowRight className="size-4 shrink-0" />
              </Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}
