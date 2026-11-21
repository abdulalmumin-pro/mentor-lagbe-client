"use client"

import { ThemeToggle } from "@/components/theme-toggle"
import { UserMenu } from "@/components/user-menu"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useSession } from "@/lib/auth-client"
import type { UserRole } from "@/lib/roles"

/** Thin dashboard top bar: sidebar toggle, workspace title, theme + profile menu. */
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
    <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b px-4">
      <div className="flex min-w-0 items-center gap-2">
        <SidebarTrigger />
        <span className="truncate text-sm font-semibold">{label}</span>
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />
        <Separator orientation="vertical" className="h-6" />
        <UserMenu />
      </div>
    </header>
  )
}

export default DashboardHeader
