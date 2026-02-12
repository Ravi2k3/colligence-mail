import { type FormEvent, useState } from "react"
import { MailIcon, LogInIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { setToken } from "@/lib/auth"
import { ApiError, post } from "@/lib/api"

interface LoginResponse {
  token: string
  user_id: string
  org_id: string
}

interface LoginPageProps {
  onLogin: () => void
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState<string>("")
  const [password, setPassword] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault()

    const trimmedEmail = email.trim()
    if (!trimmedEmail || !password) {
      setError("Email and password are required.")
      return
    }

    setError(null)
    setLoading(true)

    try {
      const response = await post<LoginResponse>(
        "/auth/login",
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
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 flex size-9 items-center justify-center rounded-lg">
              <MailIcon className="text-primary size-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Colligence Mail</CardTitle>
              <CardDescription>Sign in with your email credentials</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form id="login-form" onSubmit={handleSubmit}>
            <FieldGroup>
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
                  aria-invalid={error ? true : undefined}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="login-password">App Password</FieldLabel>
                <Input
                  id="login-password"
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
              {error && <FieldError>{error}</FieldError>}
            </FieldGroup>
          </form>
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            form="login-form"
            disabled={loading || !canSubmit}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>Signing in...</>
            ) : (
              <>
                <LogInIcon data-icon="inline-start" />
                Sign in
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
