import type { Metadata } from "next"
import Link from "next/link"
import { GraduationCap } from "lucide-react"

import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Page Not Found | Mentor Lagbe",
}

const CURRENT_YEAR = new Date().getFullYear()

export default function NotFound() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-6">
      <div className="max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex size-20 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/20">
            <GraduationCap className="size-10" />
          </div>
        </div>

        <h1 className="text-8xl font-bold tracking-tight">404</h1>

        <h2 className="mt-4 text-2xl font-semibold">Oops! Page Not Found</h2>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          We couldn&apos;t find the page you were looking for. Let&apos;s get you
          back on track to finding the right tuition.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button render={<Link href="/" />} nativeButton={false}>
            Back to Home
          </Button>
          <Button
            variant="outline"
            render={<Link href="/tuitions" />}
            nativeButton={false}
          >
            Browse Tuitions
          </Button>
        </div>

        <p className="mt-8 text-sm text-muted-foreground">
          © {CURRENT_YEAR} Mentor Lagbe. All rights reserved.
        </p>
      </div>
    </main>
  )
}
