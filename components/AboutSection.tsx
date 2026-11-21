"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  GraduationCap,
  MessageSquareText,
  Search,
  Send,
  UserPlus,
  Users,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import Footer from "./Footer"
import Navbar from "./Navbar"

type Audience = "student" | "tutor"

type Step = {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}

const WORKFLOWS: Record<
  Audience,
  {
    label: string
    icon: React.ComponentType<{ className?: string }>
    cta: { label: string; href: string }
    steps: Step[]
  }
> = {
  student: {
    label: "I'm a Student",
    icon: GraduationCap,
    cta: { label: "Find a Tutor", href: "/sign-up" },
    steps: [
      {
        title: "Create your account",
        description:
          "Sign up for free with email or Google and pick the Student role.",
        icon: UserPlus,
      },
      {
        title: "Search & filter tutors",
        description:
          "Browse tuitions by subject, class, location and budget to find the right fit.",
        icon: Search,
      },
      {
        title: "Apply directly",
        description:
          "Send a request to the tutor or tuition post and chat to confirm details.",
        icon: Send,
      },
      {
        title: "Start learning",
        description:
          "Begin your classes, then leave a review to help other students.",
        icon: BookOpen,
      },
    ],
  },
  tutor: {
    label: "I'm a Tutor",
    icon: Users,
    cta: { label: "Post a Batch", href: "/sign-up" },
    steps: [
      {
        title: "Create your profile",
        description:
          "Sign up as a Tutor and add your subjects, education and experience.",
        icon: UserPlus,
      },
      {
        title: "Post your batch",
        description:
          "Publish a tuition post with schedule, fee, class level and location.",
        icon: BookOpen,
      },
      {
        title: "Receive applications",
        description:
          "Students find you through search and send applications you can review.",
        icon: MessageSquareText,
      },
      {
        title: "Get verified & grow",
        description:
          "Collect reviews and upgrade to PRO for a golden badge and priority listing.",
        icon: BadgeCheck,
      },
    ],
  },
}

export function HowItWorksSection() {
  const [audience, setAudience] = React.useState<Audience>("student")
  const flow = WORKFLOWS[audience]

  return (
    <div className="flex min-h-svh flex-col">
      <Navbar />

      <section id="how-it-works" className="px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold tracking-wide text-primary uppercase">
              How it works
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              How MentorLagbe Works
            </h2>
            <p className="mt-3 text-sm text-muted-foreground sm:text-base">
              Whether you are looking for guidance or ready to teach, getting
              started takes just a few minutes.
            </p>
          </div>

          {/* Audience toggle */}
          <div
            role="tablist"
            aria-label="Choose your workflow"
            className="mx-auto mt-8 grid max-w-sm grid-cols-2 rounded-lg bg-muted p-1 text-sm font-medium"
          >
            {(Object.keys(WORKFLOWS) as Audience[]).map((key) => {
              const { label, icon: Icon } = WORKFLOWS[key]
              const active = audience === key
              return (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setAudience(key)}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-md px-3 py-2 transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                    active
                      ? "bg-background shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              )
            })}
          </div>

          {/* Steps */}
          <ol className="relative mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {/* connector line (desktop only) */}
            <div
              aria-hidden="true"
              className="absolute top-8 right-[12.5%] left-[12.5%] hidden border-t-2 border-dashed border-primary/30 lg:block"
            />

            {flow.steps.map(({ title, description, icon: Icon }, i) => (
              <li
                key={`${audience}-${title}`}
                className="relative flex flex-col items-center text-center"
              >
                <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-primary/20 bg-card text-primary shadow-sm">
                  <Icon className="h-7 w-7" />
                  <span className="absolute -top-2.5 -right-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                </div>
                <h3 className="mt-5 text-base font-semibold">{title}</h3>
                <p className="mt-2 max-w-[16rem] text-sm text-muted-foreground">
                  {description}
                </p>
              </li>
            ))}
          </ol>

          <div className="mt-12 text-center">
            <Link
              href={flow.cta.href}
              className={cn(
                buttonVariants({ size: "lg" }),
                "inline-flex items-center justify-center gap-2 px-8 whitespace-nowrap"
              )}
            >
              <span>{flow.cta.label}</span>
              <ArrowRight className="h-4 w-4 shrink-0" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default HowItWorksSection
