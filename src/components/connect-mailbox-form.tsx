import { type FormEvent, useCallback, useEffect, useRef, useState } from "react"
import { Loader2Icon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { ApiError, get, post } from "@/lib/api"
import { startOAuthFlow } from "@/lib/oauth"
import type { ProviderInfoResponse } from "@/types/api"

interface ConnectMailboxResponse {
  id: string
  email: string
  provider: string
}

interface ConnectMailboxFormProps extends React.ComponentProps<"form"> {
  onConnected: () => void
  compact?: boolean
}

export function ConnectMailboxForm({
  className,
  onConnected,
  compact = false,
  ...props
}: ConnectMailboxFormProps) {
  const [email, setEmail] = useState<string>("")
  const [password, setPassword] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [oauthLoading, setOauthLoading] = useState<boolean>(false)

  // Provider detection state
  const [detectedProvider, setDetectedProvider] = useState<ProviderInfoResponse | null>(null)
  const [detecting, setDetecting] = useState<boolean>(false)
  const [detectionDone, setDetectionDone] = useState<boolean>(false)
  const detectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const detectProvider = useCallback(async (emailValue: string) => {
    const trimmed = emailValue.trim()
    if (!trimmed || !trimmed.includes("@") || !trimmed.split("@")[1]?.includes(".")) {
      setDetectedProvider(null)
      setDetectionDone(false)
      return
    }

    setDetecting(true)
    try {
      const info = await get<ProviderInfoResponse>(
        `/auth/provider?email=${encodeURIComponent(trimmed)}`,
        { skipAuth: true },
      )
      setDetectedProvider(info)
    } catch {
      setDetectedProvider(null)
    } finally {
      setDetecting(false)
      setDetectionDone(true)
    }
  }, [])

  // Debounced provider detection on email change
  useEffect(() => {
    if (detectTimerRef.current) {
      clearTimeout(detectTimerRef.current)
    }
    detectTimerRef.current = setTimeout(() => {
      detectProvider(email)
    }, 500)
    return () => {
      if (detectTimerRef.current) {
        clearTimeout(detectTimerRef.current)
      }
    }
  }, [email, detectProvider])

  async function handleOAuthClick(provider: string): Promise<void> {
    setError(null)
    setOauthLoading(true)
    try {
      await startOAuthFlow(provider)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.detail)
      } else {
        setError("Could not start OAuth flow. Is the API running?")
      }
      setOauthLoading(false)
    }
  }

  async function handlePasswordSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault()

    const trimmedEmail = email.trim()
    if (!trimmedEmail || !password) {
      setError("Email and app password are required.")
      return
    }

    setError(null)
    setLoading(true)

    try {
      await post<ConnectMailboxResponse>(
        "/mailboxes",
        { email: trimmedEmail, password },
      )
      onConnected()
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.detail)
      } else {
        setError("Could not reach the server. Is the API running?")
      }
    } finally {
      setLoading(false)
    }
  }

  const showOAuth = detectedProvider?.oauth_provider != null
  const showPasswordForm = detectionDone && !showOAuth
  const canSubmitPassword = email.trim().length > 0 && password.length > 0
  const isLoading = loading || oauthLoading

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      onSubmit={handlePasswordSubmit}
      {...props}
    >
      <FieldGroup>
        {!compact && (
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-2xl font-bold">Connect your mailbox</h1>
            <p className="text-muted-foreground text-sm text-balance">
              Enter your email to connect via OAuth or app password
            </p>
          </div>
        )}

        <Field>
          <FieldLabel htmlFor="connect-email">Email</FieldLabel>
          <Input
            id="connect-email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setError(null)
              setDetectionDone(false)
            }}
            required
            autoComplete="email"
            autoFocus
            aria-invalid={error ? true : undefined}
          />
        </Field>

        {/* OAuth provider button */}
        {showOAuth && detectedProvider?.oauth_provider && (
          <>
            <FieldSeparator>Or continue with</FieldSeparator>
            <Field>
              <OAuthButton
                provider={detectedProvider.oauth_provider}
                loading={oauthLoading}
                disabled={isLoading}
                onClick={() => handleOAuthClick(detectedProvider.oauth_provider!)}
              />
            </Field>
          </>
        )}

        {/* Password form for non-OAuth providers */}
        {showPasswordForm && (
          <>
            <Field>
              <FieldLabel htmlFor="connect-password">App Password</FieldLabel>
              <Input
                id="connect-password"
                type="password"
                placeholder="Enter your app password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError(null)
                }}
                required
                autoComplete="current-password"
                aria-invalid={error ? true : undefined}
              />
            </Field>
            <Field>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !canSubmitPassword}
              >
                {loading ? (
                  <>
                    <Loader2Icon className="size-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  "Connect mailbox"
                )}
              </Button>
            </Field>
          </>
        )}

        {/* Detecting spinner */}
        {detecting && (
          <div className="flex items-center justify-center gap-2 py-2">
            <Loader2Icon className="text-muted-foreground size-4 animate-spin" />
            <span className="text-muted-foreground text-xs">Detecting provider...</span>
          </div>
        )}

        {error && <FieldError>{error}</FieldError>}

        {!compact && (
          <FieldDescription className="text-center text-xs">
            We&apos;ll detect your email provider and connect securely via
            OAuth or app password.
          </FieldDescription>
        )}
      </FieldGroup>
    </form>
  )
}

// ── OAuth provider button ─────────────────────────────────────────────────────

const PROVIDER_CONFIG: Record<string, { name: string; className: string }> = {
  google: {
    name: "Google",
    className: "bg-white border border-border hover:bg-accent text-foreground",
  },
  microsoft: {
    name: "Microsoft",
    className: "bg-[#2f2f2f] hover:bg-[#1a1a1a] text-white",
  },
}

interface OAuthButtonProps {
  provider: string
  loading: boolean
  disabled: boolean
  onClick: () => void
}

function OAuthButton({ provider, loading, disabled, onClick }: OAuthButtonProps) {
  const config = PROVIDER_CONFIG[provider]
  if (!config) return null

  return (
    <Button
      type="button"
      variant="outline"
      className={cn("w-full gap-2", config.className)}
      disabled={disabled}
      onClick={onClick}
    >
      {loading ? (
        <Loader2Icon className="size-4 animate-spin" />
      ) : (
        <ProviderIcon provider={provider} />
      )}
      Continue with {config.name}
    </Button>
  )
}

function ProviderIcon({ provider }: { provider: string }) {
  if (provider === "google") {
    return (
      <svg className="size-5" viewBox="0 0 24 24">
        <path
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
          fill="#4285F4"
        />
        <path
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          fill="#34A853"
        />
        <path
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          fill="#FBBC05"
        />
        <path
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          fill="#EA4335"
        />
      </svg>
    )
  }

  if (provider === "microsoft") {
    return (
      <svg className="size-5" viewBox="0 0 21 21">
        <rect x="1" y="1" width="9" height="9" fill="#f25022" />
        <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
        <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
        <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
      </svg>
    )
  }

  return null
}
