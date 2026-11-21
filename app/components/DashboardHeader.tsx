"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { useSession } from "@/lib/auth-client"
import type { UserRole } from "@/lib/roles"

/** Thin dashboard top bar: sidebar toggle + workspace title per role. */
const WORKSPACE_LABEL: Record<UserRole, string> = {
  student: "Student Workspace",
  tutor: "Tutor Workspace",
  admin: "Platform Admin",
}

export function DashboardHeader() {
  const { data: session } = useSession()
  const role = (session?.user.role ?? "student") as UserRole
  const label = WORKSPACE_LABEL[role] ?? "Dashboard"

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger />
      <span className="text-sm font-semibold">{label}</span>
    </header>
  )
}

export default DashboardHeader
