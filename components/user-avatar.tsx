"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

function avatarColor(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 360
  }
  return `hsl(${hash} 55% 42%)`
}

type UserAvatarProps = {
  name: string
  image?: string | null
  className?: string
}

export function UserAvatar({ name, image, className }: UserAvatarProps) {
  // Track which URL failed instead of resetting state in an effect.
  const [failedImage, setFailedImage] = React.useState<string | null>(null)
  const failed = Boolean(image) && failedImage === image

  if (image && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt={name}
        referrerPolicy="no-referrer"
        onError={() => setFailedImage(image)}
        className={cn(
          "size-8 shrink-0 rounded-full border object-cover",
          className
        )}
      />
    )
  }

  return (
    <span
      aria-hidden="true"
      style={{ backgroundColor: avatarColor(name) }}
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white",
        className
      )}
    >
      {getInitials(name)}
    </span>
  )
}

export default UserAvatar