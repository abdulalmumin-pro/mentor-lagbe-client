import Link from "next/link"
import { Bookmark, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function SavedTuitionsPage() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Saved Tuitions</h1>
        <p className="text-sm text-muted-foreground">
          Bookmark tuitions you like and come back to them later.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bookmark className="size-4" />
            No saved tuitions yet
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Browse tuitions and save the ones you want to revisit.
          </p>
          <Button
            render={<Link href="/browse-tutions" />}
            nativeButton={false}
          >
            <Search />
            Browse Tuitions
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
