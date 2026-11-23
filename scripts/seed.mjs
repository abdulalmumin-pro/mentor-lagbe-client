/**
 * Seed the MentorLagbe database with a demo admin, tutor, student, tuitions,
 * and one payment row.
 *
 * Usage: npm run seed
 *
 * The script is idempotent: running it again updates the same demo accounts
 * instead of creating duplicates. It talks to MongoDB directly (using the same
 * collections as Better Auth) and hashes passwords with Better Auth's own
 * helper so email/password sign-in works.
 */
import { readFileSync } from "node:fs"

import { MongoClient } from "mongodb"
import { hashPassword } from "better-auth/crypto"

const DB_NAME = "mentor-lagbe-db"

const ADMIN = {
  name: "MentorLagbe Admin",
  email: "admin@mentorlagbe.com",
  password: "Admin@12345",
  role: "admin",
  plan: "pro",
}

const TUTOR = {
  name: "Demo Tutor",
  email: "tutor@mentorlagbe.com",
  password: "Tutor@12345",
  role: "tutor",
  plan: "pro",
}

const STUDENT = {
  name: "Demo Student",
  email: "student@mentorlagbe.com",
  password: "Student@12345",
  role: "student",
  plan: "free",
}

/** Minimal .env loader (no dotenv dependency). */
function loadEnv() {
  for (const file of [".env", ".env.local"]) {
    let text
    try {
      text = readFileSync(new URL(`../${file}`, import.meta.url), "utf8")
    } catch {
      continue
    }

    for (const line of text.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/)
      if (!match) continue

      const [, key, raw] = match
      if (process.env[key]) continue

      process.env[key] = raw
        .replace(/\s+#.*$/, "")
        .replace(/^["']|["']$/g, "")
        .trim()
    }
  }
}

loadEnv()

const uri = process.env.BETTER_AUTH_DB_URI
if (!uri) {
  console.error("BETTER_AUTH_DB_URI is not set. Add it to .env or .env.local.")
  process.exit(1)
}

/** Create/update a user plus its Better Auth credential account. */
async function ensureUser(db, { name, email, password, role, plan }) {
  const users = db.collection("user")
  const accounts = db.collection("account")
  const now = new Date()

  const existing = await users.findOne({ email })
  let id

  if (existing) {
    id = existing._id
    await users.updateOne(
      { _id: id },
      { $set: { name, role, plan, emailVerified: true, updatedAt: now } }
    )
  } else {
    const result = await users.insertOne({
      name,
      email,
      emailVerified: true,
      role,
      plan,
      createdAt: now,
      updatedAt: now,
    })
    id = result.insertedId
  }

  const userId = String(id)
  const passwordHash = await hashPassword(password)
  const account = await accounts.findOne({ userId, providerId: "credential" })

  if (account) {
    await accounts.updateOne(
      { _id: account._id },
      { $set: { password: passwordHash, updatedAt: now } }
    )
  } else {
    await accounts.insertOne({
      accountId: userId,
      providerId: "credential",
      userId,
      password: passwordHash,
      createdAt: now,
      updatedAt: now,
    })
  }

  return { id, userId }
}

const DEMO_TUITIONS = [
  {
    title: "SSC Higher Math & Physics Tutor Needed",
    subject: "Math",
    classLevel: "SSC",
    mode: "Offline",
    location: "Mirpur 10, Dhaka",
    monthlyFee: 4500,
    daysPerWeek: 3,
    description:
      "Looking for a patient tutor for SSC higher math and physics. Weekly practice tests and monthly progress reports are expected.",
    bannerImage:
      "https://placehold.co/800x400/6366f1/ffffff/png?text=Math+SSC&font=montserrat",
  },
  {
    title: "HSC Chemistry Online Batch",
    subject: "Chemistry",
    classLevel: "HSC",
    mode: "Online",
    location: "Online (Bangladesh)",
    monthlyFee: 3000,
    daysPerWeek: 2,
    description:
      "Online HSC chemistry coaching with recorded lectures, weekly quizzes, and doubt-clearing sessions.",
    bannerImage:
      "https://placehold.co/800x400/0ea5e9/ffffff/png?text=Chemistry+HSC&font=montserrat",
  },
  {
    title: "Class 8 English Grammar & Writing",
    subject: "English",
    classLevel: "Class 8",
    mode: "Both",
    location: "Uttara Sector 7, Dhaka",
    monthlyFee: 2500,
    daysPerWeek: 3,
    description:
      "Friendly English tutor for grammar, creative writing, and exam preparation. Home visits or online classes available.",
    bannerImage:
      "https://placehold.co/800x400/10b981/ffffff/png?text=English+Class+8&font=montserrat",
  },
]

async function ensureDemoTuitions(db, tutorId, tutorName, tutorEmail) {
  const tuitions = db.collection("tuitions")
  const existing = await tuitions.countDocuments({ tutorId })
  if (existing > 0) {
    console.log(`- Demo tuitions already present (${existing}), skipping.`)
    return
  }

  const now = Date.now()
  const docs = DEMO_TUITIONS.map((tuition, index) => ({
    ...tuition,
    tutorId,
    tutorName,
    tutorEmail,
    approvalStatus: "approved",
    status: "active",
    isActive: true,
    createdAt: new Date(now - index * 86_400_000),
    updatedAt: new Date(now - index * 86_400_000),
  }))

  await tuitions.insertMany(docs)
  console.log(`- Inserted ${docs.length} approved demo tuitions.`)
}

async function ensureDemoPayment(db, tutor) {
  const payments = db.collection("payments")
  const transactionId = "seed_demo_payment"
  const existing = await payments.findOne({ transactionId })
  if (existing) {
    console.log("- Demo payment already present, skipping.")
    return
  }

  await payments.insertOne({
    userId: tutor.userId,
    userName: tutor.name,
    userEmail: tutor.email,
    userRole: "tutor",
    planName: "Pro (Tutor)",
    amount: 15,
    currency: "usd",
    transactionId,
    status: "succeeded",
    paymentDate: new Date(),
    createdAt: new Date(),
  })
  console.log("- Inserted one demo payment record.")
}

async function main() {
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 15_000 })
  await client.connect()
  const db = client.db(DB_NAME)

  try {
    console.log("Seeding MentorLagbe…")

    const admin = await ensureUser(db, ADMIN)
    const tutor = await ensureUser(db, TUTOR)
    const student = await ensureUser(db, STUDENT)
    console.log("- Ensured admin, tutor, and student accounts.")

    await ensureDemoTuitions(db, tutor.userId, TUTOR.name, TUTOR.email)
    await ensureDemoPayment(db, { ...TUTOR, userId: tutor.userId })

    console.log("\nDone. Sign in with:")
    console.log(`  Admin   ${ADMIN.email} / ${ADMIN.password}`)
    console.log(`  Tutor   ${TUTOR.email} / ${TUTOR.password}`)
    console.log(`  Student ${STUDENT.email} / ${STUDENT.password}`)
    console.log(`\n(Admin id: ${admin.userId}, student id: ${student.userId})`)
  } finally {
    await client.close()
  }
}

main().catch((error) => {
  console.error("Seed failed:", error)
  process.exit(1)
})
