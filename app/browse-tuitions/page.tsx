import { redirect } from "next/navigation"

/**
 * Legacy route. The canonical browse page is `/tuitions`; keep this redirect
 * so old bookmarks, shared links, and search results still work.
 */
export default async function LegacyBrowseTuitionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const query =
    typeof params.q === "string"
      ? params.q
      : typeof params.subject === "string"
        ? params.subject
        : ""

  redirect(query ? `/tuitions?q=${encodeURIComponent(query)}` : "/tuitions")
}
