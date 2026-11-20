import { headers } from "next/headers"
import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"

const MAX_BYTES = 5 * 1024 * 1024

export async function POST(req: Request) {
  // Only signed-in users may upload
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const apiKey = process.env.IMGBB_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: "Image upload is not configured." },
      { status: 500 }
    )
  }

  const form = await req.formData()
  const file = form.get("image")

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No image provided." }, { status: 400 })
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "File must be an image." }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image is too large (max 5 MB)." }, { status: 400 })
  }

  const body = new FormData()
  body.append("image", file)

  try {
    const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: "POST",
      body,
    })
    const json = await res.json()

    if (!res.ok || !json?.success || !json?.data?.url) {
      return NextResponse.json({ error: "Image host rejected the upload." }, { status: 502 })
    }

    return NextResponse.json({ url: json.data.url as string })
  } catch {
    return NextResponse.json({ error: "Could not reach image host." }, { status: 502 })
  }
}