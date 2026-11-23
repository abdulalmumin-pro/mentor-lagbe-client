"use client"

import * as React from "react"
import Link from "next/link"
import { AlertTriangle, Home, RotateCcw } from "lucide-react"

import { Button } from "@/components/ui/button"

/**
 * Global error boundary. Next.js renders this when a server or client
 * component throws outside a more specific boundary.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  React.useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-6">
      <div className="max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex size-20 items-center justify-center rounded-full bg-destructive/10 text-destructive ring-1 ring-destructive/20">
            <AlertTriangle className="size-9" />
          </div>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight">
          Something went wrong
        </h1>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          An unexpected error stopped this page from loading. You can try again,
          or head back to the homepage.
        </p>

        {error.digest && (
          <p className="mt-2 font-mono text-xs text-muted-foreground">
            Error ID: {error.digest}
          </p>
        )}

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button onClick={reset}>
            <RotateCcw />
            Try again
          </Button>
          <Button
            variant="outline"
            render={<Link href="/" />}
            nativeButton={false}
          >
            <Home />
            Back to Home
          </Button>
        </div>
      </div>
    </main>
  )
}
