import { headers } from "next/headers"

import { auth } from "@/lib/auth"

/**
 * The signed-in user (including `role` / `plan`), or `null`.
 * Use inside route handlers: `const user = await getSessionUser()`.
 */
export async function getSessionUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  return session?.user ?? null
}

/** Shorthand for JSON error responses. */
export function apiError(message: string, status = 400) {
  return Response.json({ error: message }, { status })
}

/**
 * Guard for admin-only route handlers.
 * Usage: `const { error, user } = await requireAdmin(); if (error) return error`
 */
export async function requireAdmin() {
  const user = await getSessionUser()
  if (!user) {
    return { error: apiError("Unauthorized", 401), user: null }
  }
  if (user.role !== "admin") {
    return { error: apiError("Forbidden — admin only.", 403), user: null }
  }
  return { error: null, user }
}
