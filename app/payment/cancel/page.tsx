import Link from "next/link"
import { XCircle } from "lucide-react"

import Footer from "@/components/Footer"
import Navbar from "@/components/Navbar"
import { Button } from "@/components/ui/button"

export default function PaymentCancelPage() {
  return (
    <div className="flex min-h-svh flex-col">
      <Navbar />

      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <XCircle className="size-12 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Payment cancelled</h1>
        <p className="text-sm text-muted-foreground">
          No money was charged. You can upgrade to PRO whenever you are ready.
        </p>
        <Button render={<Link href="/#pricing" />} nativeButton={false}>
          Back to pricing
        </Button>
      </main>

      <Footer />
    </div>
  )
}