import type { Filter } from "mongodb"

import Hero, { type HeroStat } from "@/components/Hero"
import AboutSection from "@/components/AboutSection"
import PricingSection from "@/components/PricingSection"
import SubjectsStatsSection from "@/components/SubjectStatusSection"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"
import FeaturedTuitions from "@/components/home/FeaturedTuitions"
import {
  findUserContacts,
  serializeDoc,
  tuitions,
  users,
  type Tuition,
  type TuitionDoc,
} from "@/lib/db"

// Counts and the featured list should always reflect the live database.
export const dynamic = "force-dynamic"

const OPEN_FILTER: Filter<Tuition> = {
  approvalStatus: "approved",
  status: { $ne: "closed" },
  isActive: { $ne: false },
}

function formatCount(value: number) {
  return value.toLocaleString("en-US")
}

/**
 * Real homepage data: platform stats for the hero and the latest approved
 * tuitions for the featured grid. If MongoDB is unavailable the page still
 * renders with its fallbacks.
 */
async function getHomeData(): Promise<{
  featured: TuitionDoc[]
  stats?: HeroStat[]
}> {
  try {
    const userCol = await users()
    const tuitionCol = await tuitions()

    const [totalTutors, totalStudents, totalTuitions, list] = await Promise.all([
      userCol.countDocuments({ role: "tutor" }),
      userCol.countDocuments({ role: "student" }),
      tuitionCol.countDocuments(OPEN_FILTER),
      tuitionCol
        .find(OPEN_FILTER)
        .sort({ createdAt: -1 })
        .limit(6)
        .toArray(),
    ])

    const contacts = await findUserContacts(list.map((tuition) => tuition.tutorId))

    const featured = list.map((tuition) => ({
      ...serializeDoc(tuition),
      tutorName:
        tuition.tutorName || contacts.get(tuition.tutorId)?.name || "Tutor",
    }))

    return {
      featured,
      stats: [
        { value: formatCount(totalTutors), label: "Verified Mentors" },
        { value: formatCount(totalTuitions), label: "Approved Tuitions" },
        { value: formatCount(totalStudents), label: "Active Students" },
      ],
    }
  } catch {
    return { featured: [] }
  }
}

export default async function Page() {
  const { featured, stats } = await getHomeData()

  return (
    <div>
      <Navbar />
      <Hero stats={stats} />
      <FeaturedTuitions tuitions={featured} />
      <AboutSection />
      <SubjectsStatsSection />
      <PricingSection />
      <Footer />
    </div>
  )
}
