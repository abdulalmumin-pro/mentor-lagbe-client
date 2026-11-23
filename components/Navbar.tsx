"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, LogOut, Menu, Settings } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { useSession, signOut } from "@/lib/auth-client"
import { UserAvatar } from "@/components/user-avatar"
import { RoleBadge } from "@/components/role-badge"
import { UserMenu } from "@/components/user-menu"
import { ThemeToggle } from "@/components/theme-toggle"
import type { UserRole } from "@/lib/roles"

/**
 * IMPORTANT: replace LOGO_CLASSES with the exact classes used for the
 * "MentorLagbe" heading/logo on the home page so size and style match.
 */
const LOGO_CLASSES = "text-2xl font-bold tracking-tight"

/*
 * NOTE: this shadcn setup is built on Base UI, which uses the `render` prop
 * instead of Radix's `asChild`. Passing `asChild` makes React render a
 * nested <a><a> / <button><button> and causes hydration errors.
 */

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()

  const role = (session?.user.role ?? "student") as UserRole
  const displayName = session?.user.name || session?.user.email || "User"
  const dashboardHref = `/dashboard/${role}`

  const navItems = [
    { label: "Home", href: "/" },
    { label: "Browse Tuitions", href: "/tuitions" },
    { label: "Pricing", href: "/pricing" },
    { label: "About", href: "/about" },
  ]

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href)

  const handleSignOut = async () => {
    const { error } = await signOut()

    if (error) {
      toast.error(error.message || "Failed to sign out. Please try again.")
      return
    }

    toast.success("Signed out successfully")
    router.push("/")
  }
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className={LOGO_CLASSES}>
          MentorLagbe
        </Link>

        {/* Desktop navigation */}
        <NavigationMenu className="hidden lg:flex">
          <NavigationMenuList>
            {navItems.map((item) => (
              <NavigationMenuItem key={item.href}>
                <NavigationMenuLink
                  render={
                    <Link
                      href={item.href}
                      aria-current={isActive(item.href) ? "page" : undefined}
                    />
                  }
                  className={cn(
                    navigationMenuTriggerStyle(),
                    isActive(item.href) && "bg-accent text-accent-foreground"
                  )}
                >
                  {item.label}
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          {/* Desktop auth */}
          <div className="hidden items-center gap-2 lg:flex">
            {session?.user ? (
              <UserMenu />
            ) : (
              <>
                <Button
                  variant="ghost"
                  render={<Link href="/sign-in" />}
                  nativeButton={false}
                >
                  Sign In
                </Button>
                <Button render={<Link href="/sign-up" />} nativeButton={false}>
                  Sign Up
                </Button>
              </>
            )}
          </div>

          {/* Mobile navigation */}
          <Sheet>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  aria-label="Open menu"
                />
              }
            >
              <Menu className="h-6 w-6" />
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle>
                  <SheetClose
                    render={<Link href="/" className={LOGO_CLASSES} />}
                  >
                    MentorLagbe
                  </SheetClose>
                </SheetTitle>
              </SheetHeader>
              <nav className="mt-6 flex flex-col gap-1 px-4">
                {navItems.map((item) => (
                  <SheetClose
                    key={item.href}
                    render={
                      <Link
                        href={item.href}
                        aria-current={isActive(item.href) ? "page" : undefined}
                        className={cn(
                          "rounded-md px-3 py-2 text-base font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                          isActive(item.href) &&
                            "bg-accent text-accent-foreground"
                        )}
                      />
                    }
                  >
                    {item.label}
                  </SheetClose>
                ))}
              </nav>
              <div className="mt-6 flex flex-col gap-2 border-t px-4 pt-6">
                {session?.user ? (
                  <>
                    {/* Avatar + name + role badge */}
                    <div className="mb-2 flex items-center gap-3 px-1">
                      <UserAvatar
                        name={displayName}
                        image={session.user.image}
                        className="size-10 text-sm"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {displayName}
                        </p>
                        <RoleBadge role={role} className="mt-1" />
                      </div>
                    </div>

                    <SheetClose
                      render={
                        <Button
                          variant="ghost"
                          className="justify-start"
                          render={<Link href={dashboardHref} />}
                          nativeButton={false}
                        />
                      }
                    >
                      <LayoutDashboard />
                      Dashboard
                    </SheetClose>
                    <SheetClose
                      render={
                        <Button
                          variant="ghost"
                          className="justify-start"
                          render={<Link href="/dashboard/profile" />}
                          nativeButton={false}
                        />
                      }
                    >
                      <Settings />
                      Update Profile
                    </SheetClose>
                    <SheetClose
                      render={
                        <Button
                          variant="ghost"
                          className="justify-start text-destructive hover:text-destructive"
                          onClick={handleSignOut}
                          nativeButton={false}
                        />
                      }
                    >
                      <LogOut />
                      Sign Out
                    </SheetClose>
                  </>
                ) : (
                  <>
                    <SheetClose
                      render={
                        <Button
                          variant="outline"
                          className="w-full"
                          render={<Link href="/sign-in" />}
                          nativeButton={false}
                        />
                      }
                    >
                      Sign In
                    </SheetClose>
                    <SheetClose
                      render={
                        <Button
                          className="w-full"
                          render={<Link href="/sign-up" />}
                          nativeButton={false}
                        />
                      }
                    >
                      Sign Up
                    </SheetClose>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}

export default Navbar