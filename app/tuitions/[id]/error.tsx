"use client"

import * as React from "react"
import Link from "next/link"
import { Home, RotateCcw } from "lucide-react"

import Footer from "@/components/Footer"
import Navbar from "@/components/Navbar"
import { Button } from "@/components/ui/button"

export default function ErrorPage({
  error,
  retry,
}: {
  error: unknown
  retry: () => void
}) {
  React.useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-svh flex-col">
      <Navbar />

      <main className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-4 py-16">
        <div className="max-w-md text-center">
          <p className="text-sm font-semibold text-destructive">
            Something went wrong
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">
            We couldn&apos;t load this tuition
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            The tuition service may be temporarily unavailable. Please try
            again.
          </p>
          {error instanceof Error && error.message ? (
            <p className="mt-3 text-xs text-muted-foreground">
              {error.message}
            </p>
          ) : null}

          <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
            <Button onClick={() => retry()}>
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

      <Footer />
    </div>
  )
}
