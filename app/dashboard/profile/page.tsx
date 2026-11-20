"use client"

import * as React from "react"
import { Loader2, Upload, X } from "lucide-react"
import { toast } from "sonner"

import { useSession, updateUser } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { UserAvatar } from "@/components/user-avatar"
import { RoleBadge } from "@/components/role-badge"
import type { UserRole } from "@/lib/roles"

const BIO_MAX = 300
const MAX_FILE_MB = 5

type ProfileUser = {
  name?: string | null
  email: string
  image?: string | null
  role?: string | null
  phone?: string | null
  bio?: string | null
}

function isValidUrl(value: string) {
  try {
    const u = new URL(value)
    return u.protocol === "http:" || u.protocol === "https:"
  } catch {
    return false
  }
}

function ProfileForm({ user }: { user: ProfileUser }) {
  const initial = {
    name: user.name ?? "",
    phone: user.phone ?? "",
    bio: user.bio ?? "",
    image: user.image ?? "",
  }

  const [name, setName] = React.useState(initial.name)
  const [phone, setPhone] = React.useState(initial.phone)
  const [bio, setBio] = React.useState(initial.bio)
  const [image, setImage] = React.useState(initial.image)
  const [uploading, setUploading] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const fileRef = React.useRef<HTMLInputElement>(null)

  const role = (user.role ?? "student") as UserRole
  const dirty =
    name !== initial.name ||
    phone !== initial.phone ||
    bio !== initial.bio ||
    image !== initial.image

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = "" // allow re-selecting the same file
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.")
      return
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      toast.error(`Image must be smaller than ${MAX_FILE_MB} MB.`)
      return
    }

    setUploading(true)
    try {
      const body = new FormData()
      body.append("image", file)
      const res = await fetch("/api/upload-image", { method: "POST", body })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json.url) {
        throw new Error(json.error || "Upload failed")
      }
      setImage(json.url)
      toast.success("Image uploaded. Click Save changes to apply it.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const trimmedName = name.trim()
    const trimmedPhone = phone.trim()
    const trimmedImage = image.trim()

    if (trimmedName.length < 2) {
      toast.error("Name must be at least 2 characters.")
      return
    }
    if (trimmedPhone && !/^\+?[0-9\s-]{7,15}$/.test(trimmedPhone)) {
      toast.error("Enter a valid phone number.")
      return
    }
    if (trimmedImage && !isValidUrl(trimmedImage)) {
      toast.error("Profile picture must be a valid http(s) URL.")
      return
    }

    setSaving(true)
    const { error } = await updateUser({
      name: trimmedName,
      image: trimmedImage || null,
      phone: trimmedPhone,
      bio: bio.trim(),
    })
    setSaving(false)

    if (error) {
      toast.error(error.message || "Failed to update profile.")
      return
    }
    toast.success("Profile updated")
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="w-full">
        <CardHeader className="text-center sm:text-left">
          <CardTitle>Update Profile</CardTitle>
          <CardDescription>
            Manage your personal information and profile picture.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Profile picture */}
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
            <UserAvatar
              name={name || user.email}
              image={image || null}
              className="size-24 text-2xl sm:size-20 sm:text-xl"
            />
            <div className="space-y-2">
              <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploading}
                  onClick={() => fileRef.current?.click()}
                >
                  {uploading ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <Upload />
                  )}
                  {uploading ? "Uploading..." : "Upload photo"}
                </Button>
                {image && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setImage("")}
                  >
                    <X />
                    Remove
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                JPG, PNG, WebP or GIF. Max {MAX_FILE_MB} MB.
              </p>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFile}
              />
            </div>
          </div>

          {/* Or paste an image URL */}
          <div className="space-y-2">
            <Label htmlFor="image">Profile picture URL (optional)</Label>
            <Input
              id="image"
              type="url"
              inputMode="url"
              placeholder="https://example.com/photo.jpg"
              value={image}
              onChange={(e) => setImage(e.target.value)}
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                inputMode="tel"
                placeholder="+8801XXXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user.email} disabled readOnly />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <div className="flex h-8 items-center">
                <RoleBadge role={role} />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="bio">Bio</Label>
              <span className="text-xs text-muted-foreground">
                {bio.length}/{BIO_MAX}
              </span>
            </div>
            <Textarea
              id="bio"
              rows={4}
              maxLength={BIO_MAX}
              placeholder="Tell others a little about yourself..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>
        </CardContent>

        <CardFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            className="w-full sm:w-auto"
            disabled={!dirty || saving}
            onClick={() => {
              setName(initial.name)
              setPhone(initial.phone)
              setBio(initial.bio)
              setImage(initial.image)
            }}
          >
            Reset
          </Button>
          <Button
            type="submit"
            className="w-full sm:w-auto"
            disabled={!dirty || saving || uploading}
          >
            {saving && <Loader2 className="animate-spin" />}
            Save changes
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}

export default function ProfilePage() {
  const { data: session, isPending } = useSession()

  return (
    <div className="flex w-full min-w-0 flex-1 justify-center self-stretch p-4 sm:p-6">
      <div className="w-full max-w-2xl self-start">
      {isPending || !session?.user ? (
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          <Loader2 className="animate-spin" />
        </div>
      ) : (
        // key resets form state if the signed-in user changes
        <ProfileForm
          key={session.user.id}
          user={session.user as unknown as ProfileUser}
        />
      )}
      </div>
    </div>
  )
}