import { redirect } from "next/navigation"

import { getSessionUser } from "@/lib/api"
export type Role = "student" | "tutor" | "admin"

/**
 * পেজ/layout-এর জন্য গার্ড (Server Component-এ ব্যবহার করুন)।
 * লগইন না থাকলে /sign-in এ, ভুল role হলে /unauthorized এ পাঠায়।
 */
export async function requireRole(...roles: Role[]) {
  const user = await getSessionUser()
  if (!user) redirect("/sign-in")
  if (!roles.includes(user.role as Role)) redirect("/unauthorized")
  return user
}