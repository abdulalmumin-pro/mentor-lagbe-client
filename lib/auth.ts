import { betterAuth } from "better-auth"
import { jwt } from "better-auth/plugins"
import { MongoClient } from "mongodb"
import { mongodbAdapter } from "@better-auth/mongo-adapter"

const client = new MongoClient(process.env.BETTER_AUTH_DB_URI as string)
const db = client.db("mentor-lagbe-db")

/**
 * Roles a person may pick for themselves at sign-up.
 * `admin` is deliberately NOT here: admins are created manually
 * (directly in MongoDB or via a seed script), never through sign-up.
 */
const SIGNUP_ROLES = ["student", "tutor"] as const
type SignupRole = (typeof SIGNUP_ROLES)[number]

function isSignupRole(value: unknown): value is SignupRole {
  return (SIGNUP_ROLES as readonly string[]).includes(value as string)
}

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,

  database: mongodbAdapter(db, {
    client,
  }),

  emailAndPassword: {
    enabled: true,
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },

  plugins: [jwt()],

  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        input: true,
        defaultValue: "student",
        // Every role that exists in the system. Sign-up restrictions are
        // enforced in `databaseHooks.user.create.before` below.
        validators: [
          {
            validate: (value: unknown) =>
              ["student", "tutor", "admin"].includes(value as string),
            message: "Role must be student, tutor, or admin",
          },
        ],
      },
      plan: {
        type: "string",
        required: true,
        defaultValue: "free",
        /** Only the server (Stripe webhook / checkout) upgrades a plan. */
        input: false,
        validators: [
          {
            validate: (value: unknown) =>
              ["free", "pro"].includes(value as string),
            message: "Plan must be free or pro",
          },
        ],
      },
      /** Editable from /dashboard/profile. */
      phone: {
        type: "string",
        required: false,
      },
      bio: {
        type: "string",
        required: false,
      },
    },
  },

  databaseHooks: {
    user: {
      create: {
        /**
         * Single gatekeeper for the role of every NEW account.
         *
         * 1. Google OAuth can't carry form fields across the redirect, so the
         *    sign-up page stores the picked role in a short-lived cookie.
         *    We only trust it for the OAuth callback, and only for
         *    student/tutor.
         * 2. Email/password sign-ups send `role` in the request body, which
         *    anyone can tamper with. Anything other than student/tutor
         *    (including "admin") is forced back to "student".
         */
        before: async (user, ctx) => {
          // (1) Google OAuth callback -> role from cookie
          if (ctx?.path?.includes("callback")) {
            const cookie = ctx.request?.headers.get("cookie") ?? ""
            const match = cookie.match(
              /(?:^|;\s*)ml_signup_role=(student|tutor)(?:;|$)/
            )
            const role: SignupRole = match ? (match[1] as SignupRole) : "student"
            return { data: { ...user, role } }
          }

          // (2) Email/password (or anything else) -> never allow admin
          const requested = (user as { role?: unknown }).role
          if (!isSignupRole(requested)) {
            return { data: { ...user, role: "student" } }
          }
        },
      },

      update: {
        /** Users can never change their own role after sign-up. */
        before: async (data) => {
          if ("role" in data) return false
        },
      },
    },
  },
})