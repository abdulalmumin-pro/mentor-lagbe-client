"use client"

import * as React from "react"
import Link from "next/link"
import { CheckCircle2, Loader2, XCircle } from "lucide-react"

import Footer from "@/components/Footer"
import Navbar from "@/components/Navbar"
import { Button } from "@/components/ui/button"
import { backendFetch } from "@/lib/backend"

type Status = "verifying" | "success" | "error"

export default function PaymentSuccessPage() {
  const [status, setStatus] = React.useState<Status>("verifying")
  const [message, setMessage] = React.useState("")

  React.useEffect(() => {
    const sessionId = new URLSearchParams(window.location.search).get(
      "session_id"
    )
    if (!sessionId) {
      setStatus("error")
      setMessage("Payment session not found.")
      return
    }

    let cancelled = false

    const verify = async () => {
      try {
        const res = await backendFetch(
          `/stripe/verify?session_id=${encodeURIComponent(sessionId)}`
        )
        const json = await res.json().catch(() => null)
        if (!res.ok) {
          throw new Error(json?.error || "Could not verify your payment.")
        }
        if (cancelled) return

        if (json?.paid) {
          setStatus("success")
        } else {
          setStatus("error")
          setMessage("Your payment has not been completed yet.")
        }
      } catch (err) {
        if (cancelled) return
        setStatus("error")
        setMessage(err instanceof Error ? err.message : "Something went wrong.")
      }
    }

    verify()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="flex min-h-svh flex-col">
      <Navbar />

      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        {status === "verifying" && (
          <>
            <Loader2 className="size-10 animate-spin text-primary" />
            <h1 className="text-2xl font-bold">Confirming your payment…</h1>
            <p className="text-sm text-muted-foreground">
              Please do not close this page.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle2 className="size-12 text-emerald-500" />
            <h1 className="text-2xl font-bold">Payment successful!</h1>
            <p className="text-sm text-muted-foreground">
              Welcome to MentorLagbe PRO. Your account has been upgraded.
            </p>
            <Button render={<Link href="/" />} nativeButton={false}>
              Go to home
            </Button>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="size-12 text-destructive" />
            <h1 className="text-2xl font-bold">Could not confirm payment</h1>
            <p className="text-sm text-muted-foreground">{message}</p>
            <Button
              variant="outline"
              render={<Link href="/#pricing" />}
              nativeButton={false}
            >
              Back to pricing
            </Button>
          </>
        )}
      </main>

      <Footer />
    </div>
  )
}