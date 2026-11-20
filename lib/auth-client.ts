import { createAuthClient } from "better-auth/react"
import type { auth } from "./auth"

/**
 * Type-only bridge: exposes the server's `user.additionalFields` (i.e. `role`)
 * to the client so `session.user.role` and `signUp.email({ role })` typecheck.
 * `import type` is erased at compile time — nothing from the server bundle
 * (MongoDB, env vars) is ever loaded in the browser.
 */
const userFieldsInference = {
  id: "user-fields-inference",
  $InferServerPlugin: {
    schema: {
      user: {
        fields: {} as (typeof auth)["options"]["user"]["additionalFields"],
      },
    },
  },
} as const

export const authClient = createAuthClient({
  /** The base URL of the server (optional if you're using the same domain) */
  baseURL: process.env.BETTER_AUTH_URL,
  plugins: [userFieldsInference],
})

export const { signIn, signUp, signOut, useSession, updateUser } = authClient
