"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ImagePlus, Loader2, X } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { TuitionMode } from "@/lib/db"
import { CLASS_LEVELS, TUITION_MODES } from "@/lib/tuition"

const MAX_FILE_MB = 5

/** String-based form state (numbers are coerced on submit). */
type FormState = {
  title: string
  subject: string
  classLevel: string
  mode: TuitionMode
  location: string
  monthlyFee: string
  daysPerWeek: string
  description: string
  bannerImage: string
}

const emptyForm: FormState = {
  title: "",
  subject: "",
  classLevel: CLASS_LEVELS[0],
  mode: "Offline",
  location: "",
  monthlyFee: "",
  daysPerWeek: "3",
  description: "",
  bannerImage: "",
}

// Matches the shadcn <Input> styling for native <select> elements.
const selectClass =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 md:text-sm dark:bg-input/30"

type TuitionFormProps = {
  mode: "create" | "edit"
  tuitionId?: string
  initial?: Partial<FormState>
}

/**
 * Create/edit tuition form. One component for both flows so the fields and
 * validation stay in sync. Edits are sent back to `pending` for re-approval.
 */
export function TuitionForm({ mode, tuitionId, initial }: TuitionFormProps) {
  const router = useRouter()
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const [form, setForm] = React.useState<FormState>({
    ...emptyForm,
    ...initial,
  })
  const [saving, setSaving] = React.useState(false)
  const [uploading, setUploading] = React.useState(false)
  const [error, setError] = React.useState("")

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.")
      return
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      toast.error(`Image is too large (max ${MAX_FILE_MB} MB).`)
      return
    }

    setUploading(true)
    try {
      const body = new FormData()
      body.append("image", file)
      const res = await fetch("/api/upload-image", { method: "POST", body })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.url) {
        throw new Error(json?.error || "Upload failed")
      }
      set("bannerImage", json.url as string)
      toast.success("Banner uploaded")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (
      !form.title.trim() ||
      !form.subject.trim() ||
      !form.location.trim() ||
      !form.description.trim() ||
      !form.monthlyFee ||
      !form.daysPerWeek
    ) {
      setError("Please fill in all required fields.")
      return
    }

    setSaving(true)
    try {
      const payload = {
        ...form,
        monthlyFee: Number(form.monthlyFee),
        daysPerWeek: Number(form.daysPerWeek),
      }

      const res = await fetch(
        mode === "create" ? "/api/tuitions" : `/api/tuitions/${tuitionId}`,
        {
          method: mode === "create" ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      )
      const json = await res.json().catch(() => null)

      if (!res.ok) {
        const message = json?.error || "Could not save the tuition."
        setError(message)
        toast.error(message)
        return
      }

      toast.success(
        mode === "create"
          ? "Tuition posted — waiting for admin approval."
          : "Tuition updated — sent for approval again."
      )
      router.push("/dashboard/tutor/my-tuitions")
      router.refresh()
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>
            {mode === "create" ? "Tuition details" : "Update tuition details"}
          </CardTitle>
        </CardHeader>

        <CardContent className="grid gap-5">
          {/* Title + Subject */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="e.g. Math tutor needed for Class 9"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="e.g. Mathematics"
                value={form.subject}
                onChange={(e) => set("subject", e.target.value)}
                required
              />
            </div>
          </div>

          {/* Class level + Mode */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="classLevel">Class Level</Label>
              <select
                id="classLevel"
                className={selectClass}
                value={form.classLevel}
                onChange={(e) => set("classLevel", e.target.value)}
                required
              >
                {CLASS_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="mode">Mode</Label>
              <select
                id="mode"
                className={selectClass}
                value={form.mode}
                onChange={(e) => set("mode", e.target.value as TuitionMode)}
                required
              >
                {TUITION_MODES.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Location + Fee + Days */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="e.g. Dhanmondi, Dhaka"
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="monthlyFee">Monthly Fee (৳)</Label>
              <Input
                id="monthlyFee"
                type="number"
                min={1}
                step={1}
                placeholder="e.g. 4000"
                value={form.monthlyFee}
                onChange={(e) => set("monthlyFee", e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="daysPerWeek">Days / Week</Label>
              <Input
                id="daysPerWeek"
                type="number"
                min={1}
                max={7}
                step={1}
                placeholder="e.g. 3"
                value={form.daysPerWeek}
                onChange={(e) => set("daysPerWeek", e.target.value)}
                required
              />
            </div>
          </div>

          {/* Description */}
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={5}
              placeholder="Describe the tuition, requirements, preferred time…"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              required
            />
          </div>

          {/* Banner image */}
          <div className="grid gap-2">
            <Label>Banner Image (optional)</Label>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                {form.bannerImage ? (
                  // Banner URLs are arbitrary (ImgBB / external), so a plain img
                  // avoids next/image remote-pattern config.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={form.bannerImage}
                    alt="Tuition banner preview"
                    className="size-full object-cover"
                  />
                ) : (
                  <ImagePlus className="size-6 text-muted-foreground" />
                )}
              </div>

              <div className="grid flex-1 gap-2">
                <div className="flex flex-wrap gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleUpload}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploading ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <ImagePlus />
                    )}
                    {uploading ? "Uploading…" : "Upload via ImgBB"}
                  </Button>
                  {form.bannerImage && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => set("bannerImage", "")}
                    >
                      <X />
                      Remove
                    </Button>
                  )}
                </div>
                <Input
                  aria-label="Banner image URL"
                  placeholder="…or paste an image URL"
                  value={form.bannerImage}
                  onChange={(e) => set("bannerImage", e.target.value)}
                />
              </div>
            </div>
          </div>

          {error && (
            <p className="text-sm font-medium text-destructive" role="alert">
              {error}
            </p>
          )}
        </CardContent>

        <CardFooter className="justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            render={<Link href="/dashboard/tutor/my-tuitions" />}
            nativeButton={false}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={saving || uploading}>
            {saving && <Loader2 className="animate-spin" />}
            {mode === "create" ? "Post Tuition" : "Save Changes"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}

export default TuitionForm
