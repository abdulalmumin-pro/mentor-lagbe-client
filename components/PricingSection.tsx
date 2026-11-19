"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowRight, CircleCheck, Loader2, Sparkles } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"

type Audience = "tutor" | "student"

const PRO_PRICE: Record<Audience, number> = { tutor: 15, student: 10 }

const FREE_FEATURES = [
  "Up to 2 tuition posts (Tutor)",
  "Up to 5 tuition bookmarks (Student)",
  "Direct tuition applications",
  "Basic profile & search filters",
]

const PRO_FEATURES = [
  "Unlimited tuition posts & bookmarks",
  "Golden PRO verification badge",
  "Priority listing in search & category filters",
  "Priority applicant notifications & reviews",
]

type PricingSectionProps = {
  /** Pre-select the audience (e.g. from the signed-in user's role). */
  defaultAudience?: Audience
  /**
   * Override the checkout call. Must resolve to a Stripe Checkout URL.
   * Default: POST /api/stripe/checkout { audience } -> { url }
   */
  onSubscribe?: (audience: Audience) => Promise<string>
}

async function defaultCheckout(audience: Audience): Promise<string> {
  const res = await fetch("/api/stripe/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ audience }),
  })
  if (res.status === 401) throw new Error("Please sign in to subscribe.")
  if (!res.ok) throw new Error("Could not start checkout.")
  const { url } = (await res.json()) as { url?: string }
  if (!url) throw new Error("Checkout URL missing.")
  return url
}

export function PricingSection({
  defaultAudience = "tutor",
  onSubscribe = defaultCheckout,
}: PricingSectionProps) {
  const [audience, setAudience] = React.useState<Audience>(defaultAudience)
  const [loading, setLoading] = React.useState(false)

  async function handleSubscribe() {
    setLoading(true)
    try {
      const url = await onSubscribe(audience)
      window.location.href = url // keep loading on; we're leaving the page
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.")
      setLoading(false)
    }
  }

  return (
    <section id="pricing" className="bg-muted/30 px-4 py-16 sm:py-20">
      <div className="mx-auto max-w-4xl">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Choose Your Plan
          </h2>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            Simple, transparent plans designed for committed students and
            ambitious academic tutors.
          </p>
        </div>

        <div className="mt-12 grid gap-6 pt-3 md:grid-cols-2">
          {/* ---------- Starter ---------- */}
          <div className="flex flex-col rounded-2xl border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Starter Plan</h3>
              <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                Free Forever
              </span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Perfect for students and tutors looking to test the platform.
            </p>

            <p className="mt-6 flex items-baseline gap-1">
              <span className="font-mono text-4xl font-bold">$0</span>
              <span className="text-xs text-muted-foreground">/ month</span>
            </p>

            <ul className="mt-6 flex-1 space-y-3 text-sm">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5">
                  <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary/60" />
                  <span className="text-muted-foreground">{f}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6 border-t pt-6">
              <Link
                href="/sign-up"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "w-full whitespace-nowrap"
                )}
              >
                Get Started Free
              </Link>
            </div>
          </div>

          {/* ---------- Pro ---------- */}
          <div className="relative flex flex-col rounded-2xl border-2 border-primary bg-card p-6 shadow-lg shadow-primary/10">
            <span className="absolute -top-3 right-5 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-[11px] font-semibold tracking-wide text-primary-foreground uppercase">
              <Sparkles className="h-3 w-3" />
              Recommended
            </span>

            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">MentorLagbe PRO</h3>
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-medium text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
                PRO Badge
              </span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Unlimited reach, verified credential badges, and priority
              matching.
            </p>

            {/* Price: click either to choose who you're subscribing as */}
            <div
              role="radiogroup"
              aria-label="Subscribe as"
              className="mt-6 flex items-end gap-3"
            >
              {(["tutor", "student"] as const).map((a, i) => {
                const active = audience === a
                return (
                  <React.Fragment key={a}>
                    {i === 1 && (
                      <span className="pb-4 text-xs text-muted-foreground">
                        or
                      </span>
                    )}
                    <button
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setAudience(a)}
                      className={cn(
                        "rounded-lg px-2 py-1 text-left transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                        active
                          ? "bg-primary/10 ring-1 ring-primary/30"
                          : "opacity-70 hover:opacity-100"
                      )}
                    >
                      <span
                        className={cn(
                          "font-mono font-bold",
                          active
                            ? "text-4xl text-primary"
                            : "text-2xl text-foreground"
                        )}
                      >
                        ${PRO_PRICE[a]}
                      </span>
                      <span className="block text-[10px] text-muted-foreground">
                        /mo for {a === "tutor" ? "Tutors" : "Students"}
                      </span>
                    </button>
                  </React.Fragment>
                )
              })}
            </div>

            <ul className="mt-6 flex-1 space-y-3 text-sm">
              {PRO_FEATURES.map((f, i) => (
                <li key={f} className="flex items-start gap-2.5">
                  <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span className={cn(i === 0 && "font-semibold")}>{f}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6 border-t pt-6">
              <Button
                className="inline-flex w-full items-center justify-center gap-2 whitespace-nowrap"
                onClick={handleSubscribe}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                    <span>Redirecting to Stripe...</span>
                  </>
                ) : (
                  <>
                    <span>Subscribe with Stripe</span>
                    <ArrowRight className="h-4 w-4 shrink-0" />
                  </>
                )}
              </Button>
              <p className="mt-2 text-center text-[11px] text-muted-foreground">
                Secure checkout by Stripe. Cancel anytime.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default PricingSection