import type { LucideIcon } from "lucide-react"
import {
  BookOpen,
  CalendarDays,
  GraduationCap,
  MapPin,
  Monitor,
  ShieldCheck,
  UserRound,
  Wallet,
} from "lucide-react"
import { notFound } from "next/navigation"

import Footer from "@/components/Footer"
import Navbar from "@/components/Navbar"
import ApplyPanel from "@/components/tuition/apply-panel"
import TuitionBanner from "@/components/tuition/tuition-banner"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { UserAvatar } from "@/components/user-avatar"
import { getSessionUser } from "@/lib/api"
import { API_BASE_URL } from "@/lib/api-url"
import { findTutorSummaryByEmail, findUserByEmail } from "@/lib/db"
import type { TuitionDetail, Viewer } from "@/lib/tuition-detail"

export const metadata = {
  title: "Tuition Details | Mentor Lagbe",
}

async function getTuition(id: string): Promise<TuitionDetail | null> {
  let res: Response
  try {
    res = await fetch(`${API_BASE_URL}/tuitions/${encodeURIComponent(id)}`, {
      cache: "no-store",
    })
  } catch {
    throw new Error("Could not reach the tuition service.")
  }

  if (res.status === 400 || res.status === 404) return null
  if (!res.ok) throw new Error("Could not load this tuition.")

  const json = (await res.json().catch(() => null)) as {
    tuition?: TuitionDetail
  } | null
  return json?.tuition ?? null
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
      <div className="flex items-center gap-1.5 text-xs font-medium tracking-wider text-muted-foreground uppercase">
        <Icon className="size-3.5" />
        {label}
      </div>
      <p className="mt-1.5 text-sm font-semibold">{value}</p>
    </div>
  )
}

function modeClass(mode: string) {
  if (mode === "Online") {
    return "border-sky-500/30 bg-sky-500/15 text-sky-600 dark:text-sky-400"
  }
  if (mode === "Offline") {
    return "border-amber-500/30 bg-amber-500/15 text-amber-600 dark:text-amber-400"
  }
  return "border-violet-500/30 bg-violet-500/15 text-violet-600 dark:text-violet-400"
}

export default async function TuitionDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const tuition = await getTuition(id)
  if (!tuition) notFound()

  const isActive =
    tuition.isActive ??
    (tuition.status ? tuition.status === "active" : true)
  if (tuition.approvalStatus !== "approved" || !isActive) notFound()

  const tutor = tuition.tutorEmail
    ? await findTutorSummaryByEmail(tuition.tutorEmail)
    : null
  const tutorName = tutor?.name || tuition.tutorName || "Tutor"
  const tutorBio = tutor?.bio || "This tutor has not added a bio yet."
  const isVerified = tutor?.plan === "pro"

  const sessionUser = await getSessionUser()
  let viewer: Viewer | null = null

  if (sessionUser) {
    const dbUser = await findUserByEmail(sessionUser.email)
    const rawRole = dbUser?.role ?? sessionUser.role ?? "student"
    const role: Viewer["role"] =
      rawRole === "admin" || rawRole === "tutor" ? rawRole : "student"

    viewer = {
      id: sessionUser.id,
      name: dbUser?.name || sessionUser.name || "Student",
      email: dbUser?.email || sessionUser.email,
      role,
      phone: dbUser?.phone ?? null,
    }
  }

  return (
    <div className="flex min-h-svh flex-col">
      <Navbar />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <TuitionBanner src={tuition.bannerImage} alt={tuition.title} />

            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant="outline"
                  className="border-primary/30 bg-primary/10 text-primary"
                >
                  <BookOpen />
                  {tuition.subject}
                </Badge>
                <Badge variant="outline">
                  <GraduationCap />
                  {tuition.classLevel}
                </Badge>
                <Badge
                  variant="outline"
                  className={modeClass(tuition.mode)}
                >
                  <Monitor />
                  {tuition.mode}
                </Badge>
              </div>

              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {tuition.title}
              </h1>

              <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <UserRound className="size-4" />
                By {tutorName}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <InfoItem
                icon={Wallet}
                label="Monthly Fee"
                value={`৳${tuition.monthlyFee.toLocaleString()}`}
              />
              <InfoItem
                icon={CalendarDays}
                label="Days / Week"
                value={`${tuition.daysPerWeek} days`}
              />
              <InfoItem
                icon={MapPin}
                label="Location"
                value={tuition.location}
              />
              <InfoItem
                icon={CalendarDays}
                label="Posted"
                value={formatDate(tuition.createdAt)}
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
                  {tuition.description}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tutor Profile</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <UserAvatar
                  name={tutorName}
                  image={tutor?.image}
                  className="size-16 text-lg"
                />

                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold">{tutorName}</h2>
                    {isVerified && (
                      <Badge
                        variant="outline"
                        className="border-sky-500/30 bg-sky-500/15 text-sky-600 dark:text-sky-400"
                      >
                        <ShieldCheck />
                        Verified
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {tutorBio}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <aside className="space-y-4">
            <ApplyPanel tuition={tuition} viewer={viewer} />
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  )
}
