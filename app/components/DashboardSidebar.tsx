"use client";

import type { LucideIcon } from "lucide-react";
import {
  Bookmark,
  BookOpen,
  ClipboardList,
  Compass,
  CreditCard,
  FilePlus,
  LayoutDashboard,
  LogOut,
  Settings,
  UserCheck,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/roles";
import { UserAvatar } from "@/components/user-avatar";
import { RoleBadge } from "@/components/role-badge";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { signOut, useSession } from "@/lib/auth-client";

type MenuItem = {
  id: string;
  name: string;
  url: string;
  icon: LucideIcon;
};

/** Per-role "MAIN MENU" entries (matches the dashboard mockups). */
const menuItemsByRole: Record<UserRole, MenuItem[]> = {
  student: [
    {
      id: "student-overview",
      name: "Overview",
      url: "/dashboard/student",
      icon: LayoutDashboard,
    },
    {
      id: "my-applications",
      name: "My Applications",
      url: "/dashboard/student/my-applications",
      icon: ClipboardList,
    },
    {
      id: "saved-tuitions",
      name: "Saved Tuitions",
      url: "/dashboard/student/saved-tuitions",
      icon: Bookmark,
    },
  ],
  tutor: [
    {
      id: "tutor-overview",
      name: "Overview",
      url: "/dashboard/tutor",
      icon: LayoutDashboard,
    },
    {
      id: "post-tuition",
      name: "Post Tuition",
      url: "/dashboard/tutor/post-tuition",
      icon: FilePlus,
    },
    {
      id: "my-tuitions",
      name: "My Tuitions",
      url: "/dashboard/tutor/my-tuitions",
      icon: BookOpen,
    },
    {
      id: "browse-tuitions",
      name: "Browse Tuitions",
      url: "/tuitions",
      icon: Compass,
    },
    {
      id: "applicants",
      name: "Applicants",
      url: "/dashboard/tutor/applicants",
      icon: UserCheck,
    },
  ],
  admin: [
    {
      id: "admin-overview",
      name: "Overview",
      url: "/dashboard/admin",
      icon: LayoutDashboard,
    },
    {
      id: "admin-users",
      name: "Users",
      url: "/dashboard/admin/users",
      icon: Users,
    },
    {
      id: "admin-tuitions",
      name: "Tuitions",
      url: "/dashboard/admin/tuitions",
      icon: BookOpen,
    },
    {
      id: "admin-transactions",
      name: "Transactions",
      url: "/dashboard/admin/transactions",
      icon: CreditCard,
    },
  ],
};

/** "PREFERENCES" entries — identical for every role. */
const preferenceItems: MenuItem[] = [
  {
    id: "profile",
    name: "Update Profile",
    url: "/dashboard/profile",
    icon: Settings,
  },
];

function MenuList({ items, pathname }: { items: MenuItem[]; pathname: string }) {
  return (
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.id}>
          <SidebarMenuButton
            render={<Link href={item.url} />}
            isActive={pathname === item.url}
            className="data-active:bg-primary/10! data-active:text-primary!"
          >
            <item.icon />
            <span>{item.name}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}

export function DashboardSidebar() {
  const { data: session } = useSession();
  const pathname = usePathname().replace(/\/$/, "");
  const router = useRouter();

  const user = session?.user;
  const role = (user?.role ?? "student") as UserRole;
  const menuItems = menuItemsByRole[role] ?? menuItemsByRole.student;

  const displayName = user?.name || user?.email || "User";
  const isPro = (user as { plan?: string } | undefined)?.plan === "pro";

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error(error.message || "Failed to sign out. Please try again.");
      return;
    }
    toast.success("Signed out successfully");
    router.push("/");
  };

  return (
    <Sidebar>
      <SidebarHeader className="gap-3 px-4 py-4">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 px-1">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
            ML
          </span>
          <span className="text-lg font-bold tracking-tight">MentorLagbe</span>
        </Link>

        {/* Signed-in user: avatar, name, plan badge, role chip */}
        <div className="flex items-center gap-2.5 px-1">
          <UserAvatar
            name={displayName}
            image={user?.image}
            className="size-9"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-sm leading-tight font-semibold">
                {displayName}
              </span>
              <span
                className={cn(
                  "shrink-0 rounded-full px-1.5 py-0.5 text-[10px] leading-none font-bold",
                  isPro
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {isPro ? "PRO" : "FREE"}
              </span>
            </div>
            <RoleBadge role={role} className="mt-1.5" />
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-[11px] tracking-wider text-muted-foreground uppercase">
            Main Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <MenuList items={menuItems} pathname={pathname} />
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-[11px] tracking-wider text-muted-foreground uppercase">
            Preferences
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <MenuList items={preferenceItems} pathname={pathname} />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleSignOut}
              className="text-destructive hover:text-destructive"
            >
              <LogOut />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
