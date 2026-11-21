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
