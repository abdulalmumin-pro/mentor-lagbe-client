import React from "react"

import { requireRole } from "@/lib/require-role"
export default async function StudentDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireRole("student")
  return <>{children}</>
}