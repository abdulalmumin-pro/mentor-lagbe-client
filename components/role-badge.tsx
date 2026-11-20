import { cn } from "@/lib/utils"
import { ROLE_META, type UserRole } from "@/lib/roles"

/** Small pill showing a user's role, e.g. "🎓 Student". */
export function RoleBadge({
  role,
  className,
}: {
  role: UserRole
  className?: string
}) {
  const meta = ROLE_META[role] ?? ROLE_META.student
  const Icon = meta.icon

  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary",
        className
      )}
    >
      <Icon className="size-3" />
      {meta.label}
    </span>
  )
}

export default RoleBadge
