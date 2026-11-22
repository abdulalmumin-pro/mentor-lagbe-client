/** Tuition returned by `GET {API}/tuitions/:id`. */
export type TuitionDetail = {
  _id: string
  title: string
  subject: string
  classLevel: string
  mode: string
  location: string
  monthlyFee: number
  daysPerWeek: number
  bannerImage?: string | null
  description: string
  tutorName?: string
  tutorEmail?: string
  approvalStatus?: string
  isActive?: boolean
  status?: string
  createdAt: string
}

export type TutorSummary = {
  name?: string
  image?: string | null
  bio?: string | null
  plan?: string
}

export type Viewer = {
  id: string
  name: string
  email: string
  role: "student" | "tutor" | "admin"
  phone?: string | null
}
