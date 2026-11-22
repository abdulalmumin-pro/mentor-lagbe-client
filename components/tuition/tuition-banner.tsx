"use client"

import * as React from "react"
import Image from "next/image"
import { BookOpen } from "lucide-react"

export function TuitionBanner({
  src,
  alt,
}: {
  src?: string | null
  alt: string
}) {
  const [failedSrc, setFailedSrc] = React.useState<string | null>(null)

  const showImage = Boolean(src) && failedSrc !== src

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-muted ring-1 ring-foreground/10">
      {showImage ? (
        <Image
          src={src as string}
          alt={alt}
          fill
          unoptimized
          preload
          sizes="(min-width: 1024px) 800px, 100vw"
          className="object-cover"
          onError={() => setFailedSrc(src as string)}
        />
      ) : (
        <div className="flex size-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-muted to-muted/40 text-muted-foreground">
          <BookOpen className="size-10" />
          <p className="text-sm font-medium">No banner image</p>
        </div>
      )}
    </div>
  )
}

export default TuitionBanner
