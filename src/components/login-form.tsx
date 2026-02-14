import { type FormEvent, useState } from "react"
import { Loader2Icon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { setToken } from "@/lib/auth"
import { ApiError, post } from "@/lib/api"

interface AuthResponse {
  token: string
  user_id: string
  org_id: string
}

interface LoginFormProps extends React.ComponentProps<"form"> {
  onLogin: () => void
}

export function LoginForm({ className, onLogin, ...props }: LoginFormProps) {
  const [email, setEmail] = useState<string>("")
  const [password, setPassword] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [isRegister, setIsRegister] = useState<boolean>(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault()

    const trimmedEmail = email.trim()
    if (!trimmedEmail || !password) {
      setError("Email and password are required.")
      return
    }

    if (isRegister && password.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }

    setError(null)
    setLoading(true)

    const endpoint = isRegister ? "/auth/register" : "/auth/login"

    try {
      const response = await post<AuthResponse>(
        endpoint,
        { email: trimmedEmail, password },
        { skipAuth: true },
      )
      setToken(response.token)
      onLogin()
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

  const canSubmit = email.trim().length > 0 && password.length > 0

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      onSubmit={handleSubmit}
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold">
            {isRegister ? "Create your account" : "Welcome back"}
          </h1>
          <p className="text-muted-foreground text-sm text-balance">
            {isRegister
              ? "Enter your email and a password to get started"
              : "Sign in to your Colligence account"}
          </p>
        </div>

        <Field>
          <FieldLabel htmlFor="login-email">Email</FieldLabel>
          <Input
            id="login-email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setError(null)
            }}
            required
            autoComplete="email"
            autoFocus
            aria-invalid={error ? true : undefined}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="login-password">Password</FieldLabel>
          <Input
            id="login-password"
            type="password"
            placeholder={isRegister ? "Choose a password (min 8 chars)" : "Enter your password"}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setError(null)
            }}
            required
            autoComplete={isRegister ? "new-password" : "current-password"}
            aria-invalid={error ? true : undefined}
          />
        </Field>

        <Field>
          <Button
            type="submit"
            className="w-full"
            disabled={loading || !canSubmit}
          >
            {loading ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                {isRegister ? "Creating account..." : "Signing in..."}
              </>
            ) : (
              isRegister ? "Create account" : "Sign in"
            )}
          </Button>
        </Field>

        {error && <FieldError>{error}</FieldError>}

        <FieldDescription className="text-center text-xs">
          {isRegister ? (
            <>
              Already have an account?{" "}
              <button
                type="button"
                className="text-primary underline underline-offset-2 hover:opacity-80"
                onClick={() => {
                  setIsRegister(false)
                  setError(null)
                }}
              >
                Sign in
              </button>
            </>
          ) : (
            <>
              Don&apos;t have an account?{" "}
              <button
                type="button"
                className="text-primary underline underline-offset-2 hover:opacity-80"
                onClick={() => {
                  setIsRegister(true)
                  setError(null)
                }}
              >
                Register
              </button>
            </>
          )}
        </FieldDescription>
      </FieldGroup>
    </form>
  )
}
