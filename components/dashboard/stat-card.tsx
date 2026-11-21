import type { LucideIcon } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type Accent = "primary" | "emerald" | "amber" | "sky"

const accentClasses: Record<Accent, string> = {
  primary: "bg-primary/10 text-primary",
  emerald: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  amber: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  sky: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
}

type StatCardProps = {
  label: string
  value: React.ReactNode
  icon: LucideIcon
  hint?: string
  accent?: Accent
}

/** Reusable dashboard stat card (overview pages for every role). */
export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  accent = "primary",
}: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
            {label}
          </p>
          <p className="mt-2 text-2xl leading-none font-bold">{value}</p>
          {hint && (
            <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>
          )}
        </div>
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg",
            accentClasses[accent]
          )}
        >
          <Icon className="size-5" />
        </span>
      </CardContent>
    </Card>
  )
}

export default StatCard
