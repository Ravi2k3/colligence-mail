import { useEffect, useRef, useState } from "react"
import { Loader2Icon, AlertCircleIcon, MailIcon, CheckCircle2Icon } from "lucide-react"

import { BrandingPanel } from "@/components/branding-panel"
import { Button } from "@/components/ui/button"
import { isAuthenticated } from "@/lib/auth"
import { ApiError } from "@/lib/api"
import { handleOAuthCallback } from "@/lib/oauth"

interface AuthCallbackPageProps {
  onMailboxConnected: () => void
}

export function AuthCallbackPage({ onMailboxConnected }: AuthCallbackPageProps) {
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState<boolean>(true)
  const [success, setSuccess] = useState<boolean>(false)
  // Guard against StrictMode double-firing the effect (sessionStorage
  // gets cleared on the first run, causing a spurious CSRF error on the second).
  const didRun = useRef<boolean>(false)

  useEffect(() => {
    if (didRun.current) return
    didRun.current = true

    // OAuth callback requires an authenticated user
    if (!isAuthenticated()) {
      setError("You must be logged in to connect a mailbox. Please sign in first.")
      setProcessing(false)
      return
    }

    const params = new URLSearchParams(window.location.search)
    const code = params.get("code")
    const state = params.get("state")
    const oauthError = params.get("error")

    if (oauthError) {
      const description = params.get("error_description") || oauthError
      setError(`Authentication was denied: ${description}`)
      setProcessing(false)
      return
    }

    if (!code || !state) {
      setError("Missing authorization code or state. Please try again.")
      setProcessing(false)
      return
    }

    handleOAuthCallback(code, state)
      .then(() => {
        setProcessing(false)
        setSuccess(true)
        // Brief delay so the user sees the success message
        setTimeout(() => {
          window.history.replaceState({}, document.title, "/")
          onMailboxConnected()
        }, 1000)
      })
      .catch((err) => {
        if (err instanceof ApiError) {
          setError(err.detail)
        } else if (err instanceof Error) {
          setError(err.message)
        } else {
          setError("Mailbox connection failed. Please try again.")
        }
        setProcessing(false)
      })
  }, [onMailboxConnected])

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* Left — status */}
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="/" className="flex items-center gap-2 font-medium">
            <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
              <MailIcon className="size-4" />
            </div>
            Colligence Mail
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            {processing && (
              <div className="flex flex-col items-center gap-4 text-center">
                <Loader2Icon className="text-primary size-10 animate-spin" />
                <div className="flex flex-col gap-1">
                  <h1 className="text-2xl font-bold">Connecting your mailbox</h1>
                  <p className="text-muted-foreground text-sm">
                    Verifying your credentials and setting up sync...
                  </p>
                </div>
              </div>
            )}

            {success && (
              <div className="flex flex-col items-center gap-4 text-center">
                <CheckCircle2Icon className="text-green-500 size-10" />
                <div className="flex flex-col gap-1">
                  <h1 className="text-2xl font-bold">Mailbox connected!</h1>
                  <p className="text-muted-foreground text-sm">
                    Redirecting you to your inbox...
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className="flex flex-col items-center gap-4 text-center">
                <AlertCircleIcon className="text-destructive size-10" />
                <div className="flex flex-col gap-1">
                  <h1 className="text-2xl font-bold">Something went wrong</h1>
                  <p className="text-destructive text-sm">{error}</p>
                </div>
                <Button
                  className="w-full"
                  onClick={() => {
                    window.history.replaceState({}, document.title, "/")
                    window.location.reload()
                  }}
                >
                  Try again
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right — branding panel */}
      <BrandingPanel />
    </div>
  )
}
