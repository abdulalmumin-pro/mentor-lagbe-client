import type { TuitionMode } from "@/lib/db"

/** Options shown in the post/edit tuition form. */
export const CLASS_LEVELS = [
  "Class 1-5",
  "Class 6-8",
  "Class 9-10",
  "Class 11-12",
  "Admission Test",
  "University",
  "Other",
] as const

export const TUITION_MODES: TuitionMode[] = ["Online", "Offline", "Both"]

/** Free-plan limits from the project spec. */
export const FREE_TUITION_LIMIT = 2
export const FREE_BOOKMARK_LIMIT = 5

type OpenableTuition = {
  approvalStatus?: string
  status?: string
  isActive?: boolean
}

/**
 * A tuition is publicly visible only when an admin approved it and the tutor
 * hasn't closed it. Supports both `isActive` (Express/seed) and `status`.
 */
export function isTuitionOpen(tuition: OpenableTuition) {
  const active =
    typeof tuition.isActive === "boolean"
      ? tuition.isActive
      : tuition.status !== "closed"
  return tuition.approvalStatus === "approved" && active
}

/** Cleaned values ready to store. */
export type TuitionInput = {
  title: string
  subject: string
  classLevel: string
  mode: TuitionMode
  location: string
  monthlyFee: number
  daysPerWeek: number
  description: string
  bannerImage: string | null
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

/**
 * Validates the raw request body for creating/updating a tuition.
 * Kept intentionally simple: trim strings, check required fields,
 * coerce the two numeric fields, and return the first problem found.
 */
export function parseTuitionInput(
  body: unknown
): { data: TuitionInput } | { error: string } {
  if (!body || typeof body !== "object") {
    return { error: "Invalid request body." }
  }

  const raw = body as Record<string, unknown>
  const text = (value: unknown) =>
    typeof value === "string" ? value.trim() : ""

  const title = text(raw.title)
  const subject = text(raw.subject)
  const classLevel = text(raw.classLevel)
  const mode = text(raw.mode) as TuitionMode
  const location = text(raw.location)
  const description = text(raw.description)
  const banner = text(raw.bannerImage)
  const monthlyFee = Number(raw.monthlyFee)
  const daysPerWeek = Number(raw.daysPerWeek)

  if (title.length < 5) return { error: "Title must be at least 5 characters." }
  if (!subject) return { error: "Subject is required." }
  if (!classLevel) return { error: "Class level is required." }
  if (!TUITION_MODES.includes(mode)) return { error: "Mode is invalid." }
  if (!location) return { error: "Location is required." }
  if (!Number.isFinite(monthlyFee) || monthlyFee <= 0) {
    return { error: "Monthly fee must be a positive number." }
  }
  if (
    !Number.isInteger(daysPerWeek) ||
    daysPerWeek < 1 ||
    daysPerWeek > 7
  ) {
    return { error: "Days per week must be between 1 and 7." }
  }
  if (description.length < 10) {
    return { error: "Description must be at least 10 characters." }
  }
  if (banner && !isHttpUrl(banner)) {
    return { error: "Banner image must be a valid URL." }
  }

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
      bannerImage: banner || null,
    },
  }
}
