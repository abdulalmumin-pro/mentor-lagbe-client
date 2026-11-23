import { Loader2 } from "lucide-react"

/** Route-level loading fallback shown while a server page streams in. */
export default function Loading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-svh flex-col items-center justify-center gap-3 bg-background text-muted-foreground"
    >
      <Loader2 className="size-6 animate-spin text-primary" />
      <p className="text-sm">Loading…</p>
    </div>
  )
}
