import { betterAuth } from "better-auth"
import { MongoClient } from "mongodb"
import { mongodbAdapter } from "@better-auth/mongo-adapter"

const client = new MongoClient(process.env.BETTER_AUTH_DB_URI as string)
const db = client.db("mentor-lagbe-db")

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

  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        input: true,
        defaultValue: "student",
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
         * Google OAuth can't carry form fields across the redirect, so the
         * sign-up page stores the picked role in a short-lived cookie first.
         * We only trust it for the OAuth callback — email/password signups
         * already send `role` in the request body.
         */
        before: async (_user, ctx) => {
          const cookie = ctx?.request?.headers.get("cookie") ?? ""
          const match = cookie.match(
            /(?:^|;\s*)ml_signup_role=(student|tutor|admin)(?:;|$)/
          )
          if (match && ctx?.path?.includes("callback")) {
            return { data: { role: match[1] } }
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