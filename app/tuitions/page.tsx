import type { Metadata } from "next"
import type { Filter } from "mongodb"

import Footer from "@/components/Footer"
import Navbar from "@/components/Navbar"
import TuitionBrowser, {
  type BrowseResponse,
} from "@/components/tuition/tuition-browser"
import {
  findUserContacts,
  serializeDoc,
  tuitions,
  type Tuition,
} from "@/lib/db"

export const metadata: Metadata = {
  title: "Browse Tuitions | MentorLagbe",
  description:
    "Search and filter admin-approved tuition posts by subject, class level, and mode.",
}

// Always read fresh data from MongoDB.
export const dynamic = "force-dynamic"

const PAGE_SIZE = 9

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/**
 * Server-render page 1 so the grid paints immediately. The client component
 * takes over for search, filters, and pagination.
 */
async function getInitial(query: string): Promise<BrowseResponse | undefined> {
  try {
    const filter: Filter<Tuition> = {
      approvalStatus: "approved",
      status: { $ne: "closed" },
      isActive: { $ne: false },
    }

    if (query) {
      const regex = new RegExp(escapeRegex(query), "i")
      filter.$or = [
        { title: regex },
        { subject: regex },
        { location: regex },
        { tutorName: regex },
      ]
    }

    const collection = await tuitions()
    const [total, list] = await Promise.all([
      collection.countDocuments(filter),
      collection
        .find(filter)
        .sort({ createdAt: -1 })
        .limit(PAGE_SIZE)
        .toArray(),
    ])

    const contacts = await findUserContacts(list.map((t) => t.tutorId))

    return {
      tuitions: list.map((tuition) => ({
        ...serializeDoc(tuition),
        tutorName:
          tuition.tutorName || contacts.get(tuition.tutorId)?.name || "Tutor",
      })),
      total,
      page: 1,
      limit: PAGE_SIZE,
      totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    }
  } catch {
    // If MongoDB is unreachable, let the client fetch (and show its error).
    return undefined
  }
}

export default async function BrowseTuitionsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; subject?: string }>
}) {
  const params = await searchParams
  // `subject` is the legacy query used by the homepage subject cards.
  const initialQuery = (params.q ?? params.subject ?? "").trim()
  const initial = await getInitial(initialQuery)

  return (
    <div className="flex min-h-svh flex-col">
      <Navbar />

      <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Browse Tuitions</h1>
          <p className="text-sm text-muted-foreground">
            Every admin-approved tuition that is currently open for
            applications.
          </p>
        </div>

        <TuitionBrowser initial={initial} initialQuery={initialQuery} />
      </main>

      <Footer />
    </div>
  )
}
