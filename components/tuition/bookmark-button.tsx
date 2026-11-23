"use client"

import * as React from "react"
import { Bookmark, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { useSession } from "@/lib/auth-client"
import { cn } from "@/lib/utils"

type BookmarkButtonProps = {
  tuitionId: string
  /** Initial state from the server (details page) or the list fetch. */
  saved?: boolean
  onSavedChange?: (saved: boolean) => void
  /** Render a text label next to the icon. */
  withLabel?: boolean
  className?: string
}

/**
 * Save / unsave a tuition. Only students see it; free students are limited to
 * five bookmarks (enforced by `/api/bookmarks`).
 */
export function BookmarkButton({
  tuitionId,
  saved = false,
  onSavedChange,
  withLabel = false,
  className,
}: BookmarkButtonProps) {
  const { data: session, isPending } = useSession()
  const [override, setOverride] = React.useState<boolean | null>(null)
  const [busy, setBusy] = React.useState(false)

  // Follow the `saved` prop until the user toggles the button themselves.
  const isSaved = override ?? saved

  if (isPending || session?.user.role !== "student") return null

  async function toggle() {
    setBusy(true)
    const next = !isSaved

    try {
      const res = await fetch(
        next
          ? "/api/bookmarks"
          : `/api/bookmarks?tuitionId=${encodeURIComponent(tuitionId)}`,
        next
          ? {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ tuitionId }),
            }
          : { method: "DELETE" }
      )

      const json = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(json?.error || "Could not update your saved tuitions.")
      }

      setOverride(next)
      onSavedChange?.(next)
      toast.success(next ? "Saved to your tuitions." : "Removed from saved.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size={withLabel ? "sm" : "icon-sm"}
      aria-label={isSaved ? "Remove from saved tuitions" : "Save tuition"}
      aria-pressed={isSaved}
      title={isSaved ? "Remove from saved tuitions" : "Save tuition"}
      disabled={busy}
      onClick={toggle}
      className={cn(isSaved && "border-primary/40 text-primary", className)}
    >
      {busy ? (
        <Loader2 className="animate-spin" />
      ) : (
        <Bookmark className={cn(isSaved && "fill-current")} />
      )}
      {withLabel && (isSaved ? "Saved" : "Save")}
    </Button>
  )
}

export default BookmarkButton
