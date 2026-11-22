import Footer from "@/components/Footer"
import Navbar from "@/components/Navbar"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="flex min-h-svh flex-col">
      <Navbar />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <Skeleton className="aspect-video w-full rounded-xl" />

            <div className="space-y-3">
              <div className="flex gap-2">
                <Skeleton className="h-5 w-24 rounded-4xl" />
                <Skeleton className="h-5 w-24 rounded-4xl" />
                <Skeleton className="h-5 w-20 rounded-4xl" />
              </div>
              <Skeleton className="h-9 w-3/4" />
              <Skeleton className="h-4 w-40" />
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-20 rounded-xl" />
              ))}
            </div>

            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-40 rounded-xl" />
          </div>

          <Skeleton className="h-72 rounded-xl" />
        </div>
      </main>

      <Footer />
    </div>
  )
}
