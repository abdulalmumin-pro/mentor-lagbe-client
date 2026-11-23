import { redirect } from "next/navigation"

import { getSessionUser } from "@/lib/api"

/** `/dashboard` → the signed-in user's role dashboard. */
export default async function DashboardIndexPage() {
  const user = await getSessionUser()

  if (!user) {
    redirect("/sign-in?redirect=/dashboard")
  }

  const role =
    user.role === "admin" || user.role === "tutor" ? user.role : "student"

  redirect(`/dashboard/${role}`)
}
