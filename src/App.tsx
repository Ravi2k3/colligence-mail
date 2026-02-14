import { useCallback, useState } from "react"
import { Loader2Icon } from "lucide-react"

import { isAuthenticated, clearToken } from "@/lib/auth"
import { useMailboxes } from "@/hooks/use-mailboxes"
import { AuthCallbackPage } from "@/pages/auth-callback"
import { ConnectMailboxPage } from "@/pages/connect-mailbox"
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

  // Not authenticated — show login or OAuth callback
  if (!authed) {
    // OAuth callback route — provider redirects here with ?code=&state=
    // But user must be logged in for mailbox OAuth, so show error
    if (window.location.pathname === "/auth/callback") {
      return <AuthCallbackPage onMailboxConnected={() => window.location.reload()} />
    }
    return <LoginPage onLogin={handleLogin} />
  }

  // Authenticated — route based on mailbox state
  return <AuthenticatedApp onSignOut={handleLogout} />
}

interface AuthenticatedAppProps {
  onSignOut: () => void
}

function AuthenticatedApp({ onSignOut }: AuthenticatedAppProps) {
  const { mailboxes, loading, refresh } = useMailboxes()

  const handleMailboxConnected = useCallback(() => {
    refresh()
    // Clean up URL if coming from OAuth callback
    if (window.location.pathname === "/auth/callback") {
      window.history.replaceState({}, document.title, "/")
    }
  }, [refresh])

  // OAuth callback route for mailbox connection
  if (window.location.pathname === "/auth/callback") {
    return <AuthCallbackPage onMailboxConnected={handleMailboxConnected} />
  }

  // Loading mailboxes
  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2Icon className="text-muted-foreground size-8 animate-spin" />
      </div>
    )
  }

  // No mailboxes — show connect flow
  if (mailboxes.length === 0) {
    return (
      <ConnectMailboxPage
        onConnected={handleMailboxConnected}
        onSignOut={onSignOut}
      />
    )
  }

  // Has mailboxes — show inbox
  return <MailboxPage onSignOut={onSignOut} />
}

export default App
