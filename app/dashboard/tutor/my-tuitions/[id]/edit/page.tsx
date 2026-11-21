"use client"

import * as React from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Loader2 } from "lucide-react"

import { TuitionForm } from "@/components/tutor/tuition-form"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { TuitionDoc } from "@/lib/db"

export default function EditTuitionPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id

  const [tuition, setTuition] = React.useState<TuitionDoc | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState("")

  React.useEffect(() => {
    if (!id) return
    let cancelled = false

    fetch(`/api/tuitions/${id}`)
      .then(async (res) => {
        const json = await res.json().catch(() => null)
        if (!res.ok) throw new Error(json?.error || "Could not load tuition.")
        return json.tuition as TuitionDoc
      })
      .then((data) => {
        if (!cancelled) setTuition(data)
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Something went wrong.")
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [id])

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Edit Tuition</h1>
        <p className="text-sm text-muted-foreground">
          Saving changes sends the tuition back for admin approval.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading tuition…
        </div>
      ) : error || !tuition ? (
        <Card>
          <CardHeader>
            <CardTitle>Could not open this tuition</CardTitle>
            <CardDescription>{error || "Tuition not found."}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              render={<Link href="/dashboard/tutor/my-tuitions" />}
              nativeButton={false}
            >
              Back to My Tuitions
            </Button>
          </CardContent>
        </Card>
      ) : (
        <TuitionForm
          mode="edit"
          tuitionId={tuition._id}
          initial={{
            title: tuition.title,
            subject: tuition.subject,
            classLevel: tuition.classLevel,
            mode: tuition.mode,
            location: tuition.location,
            monthlyFee: String(tuition.monthlyFee),
            daysPerWeek: String(tuition.daysPerWeek),
            description: tuition.description,
            bannerImage: tuition.bannerImage ?? "",
          }}
        />
      )}
    </div>
  )
}
