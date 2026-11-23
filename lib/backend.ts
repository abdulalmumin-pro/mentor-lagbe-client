/**
 * Helpers for calling the Express backend with the signed-in user's JWT.
 * The backend verifies this token with Better Auth's /api/auth/jwks.
 */

import { API_BASE_URL } from "./api-url"

/** Single source of truth for the Express base URL (`lib/api-url.ts`). */
export const API_URL = API_BASE_URL

/** Gets a short-lived JWT for the signed-in user from Better Auth. */
export async function getAuthToken(): Promise<string> {
  const res = await fetch("/api/auth/token", { credentials: "include" })
  if (!res.ok) throw new Error("Please sign in to continue.")

  const json = (await res.json().catch(() => null)) as {
    token?: string
  } | null
  if (!json?.token) throw new Error("Please sign in to continue.")

  return json.token
}

/** fetch() to the Express backend with the Authorization header attached. */
export async function backendFetch(
  path: string,
  init: Omit<RequestInit, "headers"> = {}
) {
  const token = await getAuthToken()
  return fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  })
}
