"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Settings,
} from "lucide-react"
import { toast } from "sonner"

import { signOut, useSession } from "@/lib/auth-client"
import { cn } from "@/lib/utils"
import { RoleBadge } from "@/components/role-badge"
import { UserAvatar } from "@/components/user-avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { UserRole } from "@/lib/roles"

/**
 * Avatar dropdown used in the public navbar and every dashboard header.
 * Header: name, email, role badge. Actions: Update Profile, Dashboard, Sign Out.
 */
export function UserMenu({ className }: { className?: string }) {
  const { data: session } = useSession()
  const router = useRouter()
  const user = session?.user

  if (!user) return null

  const role = (user.role ?? "student") as UserRole
  const displayName = user.name || user.email || "User"
  const email = user.email
  const dashboardHref = `/dashboard/${role}`

  async function handleSignOut() {
    const { error } = await signOut()

    if (error) {
      toast.error(error.message || "Failed to sign out. Please try again.")
      return
    }

    toast.success("Signed out successfully")
    router.push("/")
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            className={cn(
              "h-auto gap-2 rounded-full py-1 pr-2 pl-1",
              className
            )}
            aria-label="Open user menu"
          />
        }
      >
        <UserAvatar
          name={displayName}
          image={user.image}
          className="size-8"
        />
        <span className="hidden max-w-32 truncate text-sm font-medium sm:inline">
          {displayName}
        </span>
        <ChevronDown className="size-4 text-muted-foreground" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        {/* Header: name, email, role badge */}
        <div className="flex flex-col gap-1 px-2 py-2">
          <p className="truncate text-sm font-semibold">{displayName}</p>
          {email && email !== displayName && (
            <p className="truncate text-xs text-muted-foreground">{email}</p>
          )}
          <RoleBadge role={role} className="mt-1" />
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem render={<Link href="/dashboard/profile" />}>
          <Settings />
          Update Profile
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href={dashboardHref} />}>
          <LayoutDashboard />
          Dashboard
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem variant="destructive" onClick={handleSignOut}>
          <LogOut />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default UserMenu
