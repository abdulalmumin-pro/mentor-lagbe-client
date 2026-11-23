"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowRight,
  BadgeCheck,
  Calculator,
  Atom,
  Code2,
  Languages,
  GraduationCap,
  Users,
  Star,
  BookOpen,
  Quote,
} from "lucide-react"

import { cn } from "@/lib/utils"

/* ------------------------------------------------------------------ */
/* Types & default (PLACEHOLDER) data - replace with real values/API   */
/* ------------------------------------------------------------------ */

type Icon = React.ComponentType<{ className?: string }>

export type Subject = {
  name: string
  slug: string
  tutors: number
  icon: Icon
}

export type Stat = {
  label: string
  value: number
  suffix?: string
  decimals?: number
  icon: Icon
}

export type Testimonial = {
  name: string
  role: "Student" | "Tutor"
  detail: string
  quote: string
  rating: number
}

const DEFAULT_SUBJECTS: Subject[] = [
  { name: "Math", slug: "math", tutors: 320, icon: Calculator },
  { name: "Physics", slug: "physics", tutors: 210, icon: Atom },
  { name: "Programming", slug: "programming", tutors: 180, icon: Code2 },
  { name: "IELTS", slug: "ielts", tutors: 140, icon: Languages },
]

const DEFAULT_STATS: Stat[] = [
  { label: "Verified Tutors", value: 1200, suffix: "+", icon: BadgeCheck },
  { label: "Active Students", value: 5400, suffix: "+", icon: GraduationCap },
  { label: "Tuitions Posted", value: 3800, suffix: "+", icon: BookOpen },
  { label: "Average Rating", value: 4.8, decimals: 1, suffix: "/5", icon: Star },
]

const DEFAULT_TESTIMONIALS: Testimonial[] = [
  {
    name: "Student Name",
    role: "Student",
    detail: "HSC Candidate",
    quote:
      "I found a physics tutor near me in one afternoon. Filters made it easy to compare options.",
    rating: 5,
  },
  {
    name: "Tutor Name",
    role: "Tutor",
    detail: "Programming Tutor",
    quote:
      "Posting a batch took minutes, and applications started arriving the same day.",
    rating: 5,
  },
  {
    name: "Student Name",
    role: "Student",
    detail: "IELTS Learner",
    quote:
      "The verified badge gave me confidence to pick my tutor. My band score improved.",
    rating: 4,
  },
]

/* ------------------------------------------------------------------ */
/* Animated counter (runs once when scrolled into view)                */
/* ------------------------------------------------------------------ */

function useCountUp(target: number, decimals = 0, duration = 1400) {
  const ref = React.useRef<HTMLSpanElement>(null)
  const [value, setValue] = React.useState(0)

  React.useEffect(() => {
    const el = ref.current
    if (!el) return

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduce) {
      // Jump straight to the final value (inside a frame so it isn't a
      // synchronous setState in the effect body).
      const frame = requestAnimationFrame(() => setValue(target))
      return () => cancelAnimationFrame(frame)
    }

    let raf = 0
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        observer.disconnect()
        const start = performance.now()
        const tick = (now: number) => {
          const p = Math.min((now - start) / duration, 1)
          const eased = 1 - Math.pow(1 - p, 3) // ease-out cubic
          setValue(target * eased)
          if (p < 1) raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
      },
      { threshold: 0.4 }
    )
    observer.observe(el)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [target, duration])

  const text =
    decimals > 0
      ? value.toFixed(decimals)
      : Math.round(value).toLocaleString("en-US")
  return { ref, text }
}

function StatCard({ label, value, suffix, decimals, icon: Icon }: Stat) {
  const { ref, text } = useCountUp(value, decimals)
  return (
    <div className="flex flex-col items-center rounded-2xl border bg-card p-6 text-center shadow-sm">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-4 font-mono text-3xl font-bold tracking-tight">
        <span ref={ref}>{text}</span>
        {suffix}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Section                                                             */
/* ------------------------------------------------------------------ */

type SubjectsStatsSectionProps = {
  subjects?: Subject[]
  stats?: Stat[]
  testimonials?: Testimonial[]
}

export function SubjectsStatsSection({
  subjects = DEFAULT_SUBJECTS,
  stats = DEFAULT_STATS,
  testimonials = DEFAULT_TESTIMONIALS,
}: SubjectsStatsSectionProps) {
  return (
    <section id="subjects" className="bg-muted/30 px-4 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl space-y-16">
        {/* ---------- Top subjects ---------- */}
        <div>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold tracking-wide text-primary uppercase">
              Popular subjects
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Explore Top Subjects
            </h2>
            <p className="mt-3 text-sm text-muted-foreground sm:text-base">
              Find verified tutors in the subjects students search for most.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {subjects.map(({ name, slug, tutors, icon: Icon }) => (
              <Link
                key={slug}
                href={`/tuitions?q=${encodeURIComponent(slug)}`}
                className="group flex flex-col rounded-2xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-4 text-base font-semibold">{name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {tutors.toLocaleString("en-US")}+ tutors
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                  Browse
                  <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* ---------- Platform statistics ---------- */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </div>

        {/* ---------- Testimonials ---------- */}
        <div>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              What Our Community Says
            </h2>
            <p className="mt-3 text-sm text-muted-foreground sm:text-base">
              Real feedback from students and tutors on MentorLagbe.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <figure
                key={`${t.name}-${i}`}
                className="relative flex flex-col rounded-2xl border bg-card p-6 shadow-sm"
              >
                <Quote
                  aria-hidden="true"
                  className="absolute top-5 right-5 h-6 w-6 text-primary/20"
                />
                <div
                  className="flex gap-0.5"
                  role="img"
                  aria-label={`${t.rating} out of 5 stars`}
                >
                  {Array.from({ length: 5 }).map((_, n) => (
                    <Star
                      key={n}
                      className={cn(
                        "h-4 w-4",
                        n < t.rating
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted-foreground/30"
                      )}
                    />
                  ))}
                </div>

                <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {t.quote}
                </blockquote>

                <figcaption className="mt-5 flex items-center gap-3 border-t pt-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {t.name.charAt(0)}
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5 text-sm font-semibold">
                      <span className="truncate">{t.name}</span>
                      <BadgeCheck className="h-4 w-4 shrink-0 text-primary" />
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      {t.role === "Tutor" ? (
                        <Users className="h-3 w-3" />
                      ) : (
                        <GraduationCap className="h-3 w-3" />
                      )}
                      {t.role} · {t.detail}
                    </span>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default SubjectsStatsSection