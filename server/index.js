/**
 * MentorLagbe Express API
 *
 * Handles the tuition marketplace endpoints used by the Next.js client plus
 * Stripe subscriptions. Auth is a Better Auth JWT (issued by the client at
 * `/api/auth/token`) and verified against Better Auth's JWKS endpoint.
 *
 * Collections (shared with the Next.js app): user, tuitions, applications,
 * payments. The collection name is `tuitions` — not `tutions`.
 */
import "dotenv/config"

import cors from "cors"
import express from "express"
import { MongoClient, ObjectId } from "mongodb"
import Stripe from "stripe"
import { createRemoteJWKSet, jwtVerify } from "jose"

const PORT = Number(process.env.PORT || 5000)
const CLIENT_URL = (process.env.CLIENT_URL || "http://localhost:3000").replace(
  /\/+$/,
  ""
)
const BETTER_AUTH_URL = (
  process.env.BETTER_AUTH_URL || "http://localhost:3000"
).replace(/\/+$/, "")
const MONGODB_URI = process.env.MONGODB_URI || process.env.BETTER_AUTH_DB_URI
const DB_NAME = process.env.MONGODB_DB || "mentor-lagbe-db"

if (!MONGODB_URI) {
  console.error("MONGODB_URI (or BETTER_AUTH_DB_URI) is required.")
  process.exit(1)
}

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null

const client = new MongoClient(MONGODB_URI)
await client.connect()

const db = client.db(DB_NAME)
const users = db.collection("user")
const tuitions = db.collection("tuitions")
const applications = db.collection("applications")
const payments = db.collection("payments")

const JWKS = createRemoteJWKSet(new URL(`${BETTER_AUTH_URL}/api/auth/jwks`))

const app = express()

app.use(
  cors({
    origin: [CLIENT_URL, "http://localhost:3000"],
    credentials: true,
  })
)

// Parse JSON everywhere and keep the raw body so the Stripe webhook can verify
// its signature without a second parser.
app.use(
  express.json({
    limit: "1mb",
    verify: (req, _res, buffer) => {
      req.rawBody = buffer
    },
  })
)

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const asyncHandler = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next)

const serialize = (doc) => ({ ...doc, _id: String(doc._id) })

const toObjectId = (value) =>
  ObjectId.isValid(value) ? new ObjectId(value) : null

const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

const str = (value) => (typeof value === "string" ? value.trim() : "")

const number = (value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : NaN
}

function isOpen(tuition) {
  const active =
    typeof tuition.isActive === "boolean"
      ? tuition.isActive
      : tuition.status !== "closed"
  return tuition.approvalStatus === "approved" && active
}

function pagination(query) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1)
  const limit = Math.min(
    24,
    Math.max(1, Number.parseInt(query.limit, 10) || 9)
  )
  return { page, limit, skip: (page - 1) * limit }
}

async function userMap(ids) {
  const unique = [...new Set(ids)].filter((id) => ObjectId.isValid(id))
  if (unique.length === 0) return new Map()

  const docs = await users
    .find({ _id: { $in: unique.map((id) => new ObjectId(id)) } })
    .toArray()

  return new Map(docs.map((doc) => [String(doc._id), doc]))
}

async function findUserByEmail(email) {
  if (!email) return null
  return (
    (await users.findOne({ email })) ??
    (await users.findOne({ email: email.toLowerCase() }))
  )
}

/** Verifies the Better Auth JWT and loads the matching user document. */
async function readUser(req) {
  const header = req.headers.authorization || ""
  if (!header.startsWith("Bearer ")) return null

  let payload
  try {
    const verified = await jwtVerify(header.slice(7), JWKS)
    payload = verified.payload
  } catch {
    return null
  }

  const subject = typeof payload.sub === "string" ? payload.sub : ""
  let user = null

  if (ObjectId.isValid(subject)) {
    user = await users.findOne({ _id: new ObjectId(subject) })
  }
  if (!user && typeof payload.email === "string") {
    user = await findUserByEmail(payload.email)
  }
  if (!user) return null

  return {
    id: String(user._id),
    name: user.name || payload.name || "",
    email: user.email || payload.email || "",
    role: user.role || "student",
    plan: user.plan || "free",
  }
}

function requireAuth(roles) {
  return asyncHandler(async (req, res, next) => {
    const user = await readUser(req)
    if (!user) return res.status(401).json({ error: "Unauthorized" })
    if (roles && !roles.includes(user.role)) {
      return res.status(403).json({ error: "You are not allowed to do that." })
    }
    req.user = user
    next()
  })
}

const optionalAuth = asyncHandler(async (req, _res, next) => {
  req.user = await readUser(req)
  next()
})

function parseTuitionInput(body) {
  const title = str(body?.title)
  const subject = str(body?.subject)
  const classLevel = str(body?.classLevel)
  const mode = str(body?.mode)
  const location = str(body?.location)
  const description = str(body?.description)
  const bannerImage = str(body?.bannerImage)
  const monthlyFee = number(body?.monthlyFee)
  const daysPerWeek = number(body?.daysPerWeek)

  if (!title) return { error: "Title is required." }
  if (!subject) return { error: "Subject is required." }
  if (!classLevel) return { error: "Class level is required." }
  if (!["Online", "Offline", "Both"].includes(mode)) {
    return { error: "Mode must be Online, Offline, or Both." }
  }
  if (!location) return { error: "Location is required." }
  if (!(monthlyFee > 0)) return { error: "Monthly fee must be a positive number." }
  if (!(daysPerWeek >= 1 && daysPerWeek <= 7)) {
    return { error: "Days per week must be between 1 and 7." }
  }
  if (!description) return { error: "Description is required." }

  return {
    data: {
      title,
      subject,
      classLevel,
      mode,
      location,
      monthlyFee,
      daysPerWeek,
      description,
      bannerImage: bannerImage || null,
    },
  }
}

function normalizeApplication(application) {
  const note = application.note ?? application.studentNote ?? ""
  const createdAt = application.createdAt ?? application.appliedAt ?? new Date()

  return {
    ...serialize(application),
    note,
    studentNote: application.studentNote ?? note,
    subject: application.subject ?? "",
    createdAt,
    appliedAt: application.appliedAt ?? createdAt,
    updatedAt: application.updatedAt ?? createdAt,
  }
}

/* ------------------------------------------------------------------ */
/* Tuitions                                                            */
/* ------------------------------------------------------------------ */

/**
 * GET /tuitions
 * Public approved marketplace. Supports `q`, `classLevel`, `mode`, `page`,
 * `limit`. `?mine=1` (with a JWT) returns the tutor's own posts instead.
 */
app.get(
  "/tuitions",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = pagination(req.query)
    const q = str(req.query.q)
    const classLevel = str(req.query.classLevel)
    const mode = str(req.query.mode)
    const mine = req.query.mine === "1" || req.query.mine === "true"

    const filter = {}

    if (mine) {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" })
      filter.tutorId = req.user.id
    } else {
      filter.approvalStatus = "approved"
      filter.status = { $ne: "closed" }
      filter.isActive = { $ne: false }
    }

    if (classLevel) filter.classLevel = classLevel
    if (mode) filter.mode = mode
    if (q) {
      const regex = new RegExp(escapeRegex(q), "i")
      filter.$or = [
        { title: regex },
        { subject: regex },
        { location: regex },
        { tutorName: regex },
      ]
    }

    const [total, list] = await Promise.all([
      tuitions.countDocuments(filter),
      tuitions
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
    ])

    const contacts = await userMap(list.map((tuition) => tuition.tutorId))

    res.json({
      tuitions: list.map((tuition) => ({
        ...serialize(tuition),
        tutorName:
          tuition.tutorName || contacts.get(tuition.tutorId)?.name || "Tutor",
      })),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    })
  })
)

/** GET /tuitions/:id — details. Pending posts stay visible to their owner/admin. */
app.get(
  "/tuitions/:id",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const id = toObjectId(req.params.id)
    if (!id) return res.status(400).json({ error: "Invalid tuition id." })

    const tuition = await tuitions.findOne({ _id: id })
    if (!tuition) return res.status(404).json({ error: "Tuition not found." })

    const isOwner = req.user && req.user.id === tuition.tutorId
    const isAdmin = req.user?.role === "admin"
    if (!isOpen(tuition) && !isOwner && !isAdmin) {
      return res.status(404).json({ error: "Tuition not found." })
    }

    res.json({ tuition: serialize(tuition) })
  })
)

/** POST /tuitions — tutor creates a post (starts as pending). */
app.post(
  "/tuitions",
  requireAuth(["tutor"]),
  asyncHandler(async (req, res) => {
    const parsed = parseTuitionInput(req.body)
    if (parsed.error) return res.status(400).json({ error: parsed.error })

    if (req.user.plan !== "pro") {
      const count = await tuitions.countDocuments({ tutorId: req.user.id })
      if (count >= 2) {
        return res.status(403).json({
          error:
            "Free plan allows up to 2 tuition posts. Upgrade to Pro for unlimited posts.",
        })
      }
    }

    const now = new Date()
    const doc = {
      ...parsed.data,
      tutorId: req.user.id,
      tutorName: req.user.name,
      tutorEmail: req.user.email,
      approvalStatus: "pending",
      status: "active",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    }

    const { insertedId } = await tuitions.insertOne(doc)
    res.status(201).json({ tuition: serialize({ ...doc, _id: insertedId }) })
  })
)

/**
 * PATCH /tuitions/:id
 * - `{ status: "active" | "closed" }` toggles visibility only.
 * - Any other payload edits the post and sends it back to `pending`.
 */
app.patch(
  "/tuitions/:id",
  requireAuth(),
  asyncHandler(async (req, res) => {
    const id = toObjectId(req.params.id)
    if (!id) return res.status(400).json({ error: "Invalid tuition id." })

    const existing = await tuitions.findOne({ _id: id })
    if (!existing) return res.status(404).json({ error: "Tuition not found." })

    const isOwner = existing.tutorId === req.user.id
    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({ error: "You can only edit your own posts." })
    }

    const now = new Date()
    const update = {}

    const status = req.body?.status
    const keys = Object.keys(req.body ?? {})
    const statusOnly = keys.length === 1 && (status === "active" || status === "closed")

    if (statusOnly) {
      update.status = status
      update.isActive = status === "active"
      update.updatedAt = now
    } else {
      const parsed = parseTuitionInput(req.body)
      if (parsed.error) return res.status(400).json({ error: parsed.error })

      Object.assign(update, parsed.data, {
        approvalStatus: "pending",
        updatedAt: now,
      })
    }

    const updated = await tuitions.findOneAndUpdate(
      { _id: id },
      { $set: update },
      { returnDocument: "after" }
    )

    res.json({ tuition: serialize(updated) })
  })
)

/** DELETE /tuitions/:id — removes the post and its applications. */
app.delete(
  "/tuitions/:id",
  requireAuth(),
  asyncHandler(async (req, res) => {
    const id = toObjectId(req.params.id)
    if (!id) return res.status(400).json({ error: "Invalid tuition id." })

    const existing = await tuitions.findOne({ _id: id })
    if (!existing) return res.status(404).json({ error: "Tuition not found." })

    if (existing.tutorId !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ error: "You can only delete your own posts." })
    }

    await tuitions.deleteOne({ _id: id })
    await applications.deleteMany({ tuitionId: String(id) })

    res.json({ ok: true })
  })
)

/* ------------------------------------------------------------------ */
/* Applications                                                        */
/* ------------------------------------------------------------------ */

/**
 * GET /applications
 * Tutor → applications received. Student → own applications (enriched).
 * Admin → every application.
 */
app.get(
  "/applications",
  requireAuth(),
  asyncHandler(async (req, res) => {
    let filter = {}

    if (req.user.role === "tutor") {
      filter = {
        $or: [{ tutorId: req.user.id }, { tutorEmail: req.user.email }],
      }
    } else if (req.user.role === "student") {
      filter = {
        $or: [{ studentId: req.user.id }, { studentEmail: req.user.email }],
      }
    }

    const list = await applications
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray()

    const tuitionIds = [...new Set(list.map((item) => item.tuitionId))].filter(
      (id) => ObjectId.isValid(id)
    )
    const tuitionDocs =
      tuitionIds.length > 0
        ? await tuitions
            .find({ _id: { $in: tuitionIds.map((id) => new ObjectId(id)) } })
            .toArray()
        : []
    const tuitionMap = new Map(
      tuitionDocs.map((tuition) => [String(tuition._id), tuition])
    )

    const contacts = await userMap(list.map((item) => item.tutorId))

    res.json({
      applications: list.map((application) => {
        const tuition = tuitionMap.get(application.tuitionId)
        const contact = contacts.get(application.tutorId)

        return {
          ...normalizeApplication(application),
          tuitionTitle:
            application.tuitionTitle || tuition?.title || "Untitled tuition",
          subject: application.subject || tuition?.subject || "",
          monthlyFee: application.monthlyFee ?? tuition?.monthlyFee ?? 0,
          tutorName:
            application.tutorName ||
            tuition?.tutorName ||
            contact?.name ||
            "Tutor",
          tutorEmail:
            application.tutorEmail ||
            tuition?.tutorEmail ||
            contact?.email ||
            "",
        }
      }),
    })
  })
)

/** GET /applications/check?tuitionId=… — has the student already applied? */
app.get(
  "/applications/check",
  requireAuth(),
  asyncHandler(async (req, res) => {
    const tuitionId = str(req.query.tuitionId)
    if (!ObjectId.isValid(tuitionId)) {
      return res.status(400).json({ error: "Invalid tuition id." })
    }

    const application = await applications.findOne({
      tuitionId,
      $or: [{ studentId: req.user.id }, { studentEmail: req.user.email }],
    })

    res.json({ applied: Boolean(application) })
  })
)

/** POST /applications — a student applies to an approved, open tuition. */
app.post(
  "/applications",
  requireAuth(["student"]),
  asyncHandler(async (req, res) => {
    const tuitionId = str(req.body?.tuitionId)
    const preferredSchedule = str(req.body?.preferredSchedule)
    const note = str(req.body?.note) || str(req.body?.studentNote)

    if (!ObjectId.isValid(tuitionId)) {
      return res.status(400).json({ error: "Invalid tuition id." })
    }
    if (!preferredSchedule) {
      return res.status(400).json({ error: "Preferred schedule is required." })
    }

    const tuition = await tuitions.findOne({ _id: new ObjectId(tuitionId) })
    if (!tuition) return res.status(404).json({ error: "Tuition not found." })
    if (!isOpen(tuition)) {
      return res
        .status(400)
        .json({ error: "This tuition is not open for applications." })
    }

    const alreadyApplied = await applications.findOne({
      tuitionId,
      $or: [{ studentId: req.user.id }, { studentEmail: req.user.email }],
    })
    if (alreadyApplied) {
      return res
        .status(409)
        .json({ error: "You have already applied to this tuition." })
    }

    const tutor = await findUserByEmail(tuition.tutorEmail)
    const now = new Date()

    const doc = {
      tuitionId,
      tuitionTitle: tuition.title,
      subject: tuition.subject,
      tutorId: tuition.tutorId,
      tutorName: tuition.tutorName || tutor?.name || "",
      tutorEmail: tuition.tutorEmail || tutor?.email || "",
      monthlyFee: tuition.monthlyFee,
      studentId: req.user.id,
      studentName: str(req.body?.studentName) || req.user.name,
      studentEmail: req.user.email,
      studentPhone: str(req.body?.studentPhone),
      preferredSchedule,
      note,
      studentNote: note,
      status: "pending",
      createdAt: now,
      appliedAt: now,
      updatedAt: now,
    }

    const { insertedId } = await applications.insertOne(doc)
    res.status(201).json({ application: serialize({ ...doc, _id: insertedId }) })
  })
)

/** PATCH /applications/:id — tutor accepts or rejects an application. */
app.patch(
  "/applications/:id",
  requireAuth(["tutor"]),
  asyncHandler(async (req, res) => {
    const id = toObjectId(req.params.id)
    if (!id) return res.status(400).json({ error: "Invalid application id." })

    const status = req.body?.status
    if (!["pending", "accepted", "rejected"].includes(status)) {
      return res
        .status(400)
        .json({ error: "Status must be pending, accepted, or rejected." })
    }

    const updated = await applications.findOneAndUpdate(
      {
        _id: id,
        $or: [{ tutorId: req.user.id }, { tutorEmail: req.user.email }],
      },
      { $set: { status, updatedAt: new Date() } },
      { returnDocument: "after" }
    )

    if (!updated) return res.status(404).json({ error: "Application not found." })
    res.json({ application: serialize(updated) })
  })
)

/** DELETE /applications/:id — student cancels while still pending. */
app.delete(
  "/applications/:id",
  requireAuth(["student"]),
  asyncHandler(async (req, res) => {
    const id = toObjectId(req.params.id)
    if (!id) return res.status(400).json({ error: "Invalid application id." })

    const application = await applications.findOne({ _id: id })
    if (!application) {
      return res.status(404).json({ error: "Application not found." })
    }

    const owns =
      application.studentId === req.user.id ||
      application.studentEmail === req.user.email
    if (!owns) {
      return res
        .status(403)
        .json({ error: "You can only cancel your own application." })
    }
    if (application.status !== "pending") {
      return res
        .status(400)
        .json({ error: "Only pending applications can be cancelled." })
    }

    await applications.deleteOne({ _id: id })
    res.json({ ok: true })
  })
)

/* ------------------------------------------------------------------ */
/* Stripe                                                              */
/* ------------------------------------------------------------------ */

const PLAN_PRICE = { tutor: 15, student: 10 }

async function recordPayment(session) {
  const metadata = session.metadata ?? {}
  const audience =
    metadata.audience === "student" || metadata.audience === "tutor"
      ? metadata.audience
      : "tutor"

  const email =
    session.customer_details?.email ||
    session.customer_email ||
    metadata.userEmail ||
    ""

  const metadataUserId = str(metadata.userId)

  let user = null
  if (ObjectId.isValid(metadataUserId)) {
    user = await users.findOne({ _id: new ObjectId(metadataUserId) })
  }
  if (!user && email) user = await findUserByEmail(email)

  const userId = user ? String(user._id) : metadataUserId
  const now = new Date()
  const transactionId = session.payment_intent || session.id

  const paymentDoc = {
    userName: user?.name || session.customer_details?.name || "",
    userEmail: email || user?.email || "",
    userRole: user?.role || audience,
    planName: `MentorLagbe PRO (${audience})`,
    amount: (session.amount_total ?? 0) / 100,
    currency: session.currency || "usd",
    transactionId,
    stripeSessionId: session.id,
    status: "succeeded",
    paymentStatus: "paid",
    paymentDate: now,
    paidAt: now,
    createdAt: now,
  }
  if (userId) paymentDoc.userId = userId

  await payments.updateOne(
    { stripeSessionId: session.id },
    { $set: paymentDoc },
    { upsert: true }
  )

  if (user) {
    const customerId =
      typeof session.customer === "string"
        ? session.customer
        : session.customer?.id

    const userUpdate = { plan: "pro", updatedAt: now }
    if (customerId) userUpdate.stripeCustomerId = customerId

    await users.updateOne({ _id: user._id }, { $set: userUpdate })
  }
}

/** POST /stripe/checkout — creates a subscription Checkout session. */
app.post(
  "/stripe/checkout",
  requireAuth(),
  asyncHandler(async (req, res) => {
    if (!stripe) {
      return res.status(500).json({ error: "Stripe is not configured." })
    }

    const requested = req.body?.audience
    const audience =
      requested === "student" || requested === "tutor"
        ? requested
        : req.user.role === "student"
          ? "student"
          : "tutor"

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: req.user.email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: PLAN_PRICE[audience] * 100,
            recurring: { interval: "month" },
            product_data: { name: `MentorLagbe PRO (${audience})` },
          },
        },
      ],
      metadata: {
        userId: req.user.id,
        userEmail: req.user.email,
        audience,
        plan: "pro",
      },
      success_url: `${CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${CLIENT_URL}/payment/cancel`,
    })

    res.json({ url: session.url })
  })
)

/** GET /stripe/verify?session_id=… — confirms checkout and upgrades the plan. */
app.get(
  "/stripe/verify",
  requireAuth(),
  asyncHandler(async (req, res) => {
    if (!stripe) {
      return res.status(500).json({ error: "Stripe is not configured." })
    }

    const sessionId = str(req.query.session_id)
    if (!sessionId) {
      return res.status(400).json({ error: "session_id is required." })
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId)
    const paid =
      session.payment_status === "paid" || session.status === "complete"

    if (paid) await recordPayment(session)

    res.json({ paid, plan: paid ? "pro" : undefined })
  })
)

/** POST /stripe/webhook — Stripe → backend (raw body for signature checks). */
app.post(
  "/stripe/webhook",
  asyncHandler(async (req, res) => {
    if (!stripe) {
      return res.status(500).json({ error: "Stripe is not configured." })
    }

    let event
    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        req.headers["stripe-signature"],
        process.env.STRIPE_WEBHOOK_SECRET
      )
    } catch (error) {
      return res.status(400).send(`Webhook Error: ${error.message}`)
    }

    if (event.type === "checkout.session.completed") {
      await recordPayment(event.data.object)
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object
      const customerId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer?.id

      if (customerId) {
        await users.updateOne(
          { stripeCustomerId: customerId },
          { $set: { plan: "free", updatedAt: new Date() } }
        )
      }
    }

    res.json({ received: true })
  })
)

/* ------------------------------------------------------------------ */
/* Misc                                                                */
/* ------------------------------------------------------------------ */

app.get("/", (_req, res) => {
  res.json({ ok: true, service: "mentor-lagbe-server" })
})

// 404
app.use((_req, res) => {
  res.status(404).json({ error: "Not found." })
})

// Central error handler
app.use((error, _req, res, _next) => {
  console.error(error)
  res.status(500).json({ error: "Something went wrong." })
})

app.listen(PORT, () => {
  console.log(`MentorLagbe API listening on http://localhost:${PORT}`)
  console.log(`Client: ${CLIENT_URL}`)
  console.log(`Database: ${DB_NAME}`)
})
