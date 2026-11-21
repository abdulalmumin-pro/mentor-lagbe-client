"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { useSession } from "@/lib/auth-client"
import { ROLE_META, type UserRole } from "@/lib/roles"

/** Thin dashboard top bar: sidebar toggle + workspace title per role. */
export function DashboardHeader() {
  const { data: session } = useSession()
  const role = (session?.user.role ?? "student") as UserRole
  const label = `${ROLE_META[role]?.label ?? "Student"} Workspace`

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger />
      <span className="text-sm font-semibold">{label}</span>
    </header>
  )
}

export default DashboardHeader
