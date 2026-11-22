import Link from "next/link"
import { Home, SearchX } from "lucide-react"

import Footer from "@/components/Footer"
import Navbar from "@/components/Navbar"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col">
      <Navbar />

      <main className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-4 py-16">
        <div className="max-w-md text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-muted">
            <SearchX className="size-8 text-muted-foreground" />
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight">
            Tuition not found
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This tuition may have been removed, closed, or is no longer approved
            for applications.
          </p>

          <div className="mt-6 flex justify-center">
            <Button render={<Link href="/" />} nativeButton={false}>
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
