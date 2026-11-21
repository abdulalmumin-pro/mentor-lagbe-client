"use client"

import * as React from "react"
import Link from "next/link"
import { Lock, Sparkles } from "lucide-react"

import { useSession } from "@/lib/auth-client"
import { TuitionForm } from "@/components/tutor/tuition-form"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const FREE_PLAN_LIMIT = 2

export default function PostTuitionPage() {
  const { data: session } = useSession()
  const isPro = session?.user.plan === "pro"

  const [count, setCount] = React.useState<number | null>(null)

  React.useEffect(() => {
    let cancelled = false
    fetch("/api/tuitions")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!cancelled) setCount(json?.tuitions?.length ?? 0)
      })
      .catch(() => {
        if (!cancelled) setCount(null)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const limitReached =
    !isPro && count !== null && count >= FREE_PLAN_LIMIT

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Post a Tuition</h1>
        <p className="text-sm text-muted-foreground">
          New posts are reviewed by an admin before students can see them.
        </p>
      </div>

      {/* Plan note */}
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-2">
            <Sparkles className="mt-0.5 size-4 text-amber-500" />
            <div>
              <p className="text-sm font-medium">
                {isPro ? "Pro plan — unlimited posts" : "Free plan — up to 2 posts"}
              </p>
              <p className="text-xs text-muted-foreground">
                {isPro
                  ? "You can post as many tuitions as you like."
                  : count !== null
                    ? `${count} of ${FREE_PLAN_LIMIT} posts used.`
                    : "Upgrade to Pro for unlimited tuition posts."}
              </p>
            </div>
          </div>
          {!isPro && (
            <Button
              variant="outline"
              size="sm"
              render={<Link href="/pricing" />}
              nativeButton={false}
            >
              Upgrade to Pro
            </Button>
          )}
        </CardContent>
      </Card>

      {limitReached ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="size-4" />
              Free plan limit reached
            </CardTitle>
            <CardDescription>
              Free tutors can post up to {FREE_PLAN_LIMIT} tuitions. Upgrade to
              Pro to create unlimited posts, or delete an existing post to free
              a slot.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button render={<Link href="/pricing" />} nativeButton={false}>
              <Sparkles />
              Upgrade to Pro
            </Button>
            <Button
              variant="outline"
              render={<Link href="/dashboard/tutor/my-tuitions" />}
              nativeButton={false}
            >
              Manage my tuitions
            </Button>
          </CardContent>
        </Card>
      ) : (
        <TuitionForm mode="create" />
      )}
    </div>
  )
}
