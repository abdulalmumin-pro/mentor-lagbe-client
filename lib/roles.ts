import type { LucideIcon } from "lucide-react"
import { GraduationCap, ShieldCheck, UserRound } from "lucide-react"

export type UserRole = "student" | "tutor" | "admin"

/** Label + icon shown for each role (navbar badge, sidebar chip, …). */
export const ROLE_META: Record<UserRole, { label: string; icon: LucideIcon }> = {
  student: { label: "Student", icon: GraduationCap },
  tutor: { label: "Tutor", icon: UserRound },
  admin: { label: "Admin", icon: ShieldCheck },
}
