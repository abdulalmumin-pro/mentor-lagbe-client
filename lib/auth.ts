import { betterAuth } from "better-auth"
import { MongoClient } from "mongodb"
import { mongodbAdapter } from "@better-auth/mongo-adapter"
const client = new MongoClient(process.env.BETTER_AUTH_DB_URI as string)
const db = client.db("mentor-lagbe-db")

export const auth = betterAuth({
  //...
  baseURL: process.env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
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
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  database: mongodbAdapter(db, {
    client,
  }),
})
