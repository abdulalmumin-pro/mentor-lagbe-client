import { Badge } from "@/components/ui/badge"
import type {
  ApplicationStatus,
  ApprovalStatus,
  TuitionStatus,
} from "@/lib/db"

const base = "border"

const approvalStyles: Record<ApprovalStatus, string> = {
  pending: "border-amber-500/30 bg-amber-500/15 text-amber-600 dark:text-amber-400",
  approved:
    "border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  rejected: "border-red-500/30 bg-red-500/15 text-red-600 dark:text-red-400",
}

const applicationStyles: Record<ApplicationStatus, string> = {
  pending: "border-amber-500/30 bg-amber-500/15 text-amber-600 dark:text-amber-400",
  accepted:
    "border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  rejected: "border-red-500/30 bg-red-500/15 text-red-600 dark:text-red-400",
}

/** Admin approval state of a tuition post. */
export function ApprovalBadge({ status }: { status: ApprovalStatus }) {
  return (
    <Badge variant="outline" className={`${base} ${approvalStyles[status]}`}>
      {status}
    </Badge>
  )
}

/** Tutor-controlled Active / Closed state. */
export function TuitionStatusBadge({ status }: { status: TuitionStatus }) {
  return (
    <Badge
      variant="outline"
      className={
        status === "active"
          ? "border-sky-500/30 bg-sky-500/15 text-sky-600 dark:text-sky-400"
          : "border-border bg-muted text-muted-foreground"
      }
    >
      {status}
    </Badge>
  )
}

/** Student application state. */
export function ApplicationStatusBadge({
  status,
}: {
  status: ApplicationStatus
}) {
  return (
    <Badge variant="outline" className={`${base} ${applicationStyles[status]}`}>
      {status}
    </Badge>
  )
}
