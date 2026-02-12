import { useCallback, useState } from "react"

import { isAuthenticated, clearToken } from "@/lib/auth"
import { LoginPage } from "@/pages/login"
import { MailboxPage } from "@/pages/mailbox"

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

  return <MailboxPage onSignOut={handleLogout} />
}

export default App
