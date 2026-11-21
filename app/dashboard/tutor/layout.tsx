import React from "react"

import { requireRole } from "@/lib/require-role"
export default async function TutorDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireRole("tutor")
  return <>{children}</>
}