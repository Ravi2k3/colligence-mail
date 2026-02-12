import { useCallback, useState } from "react"

import { isAuthenticated, clearToken } from "@/lib/auth"
import { LoginPage } from "@/pages/login"

export function App() {
  const [authed, setAuthed] = useState<boolean>(isAuthenticated)

  const handleLogin = useCallback(() => {
    setAuthed(true)
  }, [])

  const handleLogout = useCallback(() => {
    clearToken()
    setAuthed(false)
  }, [])

  if (!authed) {
    return <LoginPage onLogin={handleLogin} />
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="text-muted-foreground">
        Logged in.{" "}
        <button
          onClick={handleLogout}
          className="text-primary underline underline-offset-4"
        >
          Sign out
        </button>
      </p>
    </div>
  )
}

export default App
