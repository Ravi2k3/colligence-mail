import { MailIcon } from "lucide-react"

import { BrandingPanel } from "@/components/branding-panel"
import { ConnectMailboxForm } from "@/components/connect-mailbox-form"

interface ConnectMailboxPageProps {
  onConnected: () => void
  onSignOut: () => void
}

export function ConnectMailboxPage({ onConnected, onSignOut }: ConnectMailboxPageProps) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* Left — connect form */}
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 font-medium">
            <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
              <MailIcon className="size-4" />
            </div>
            Colligence Mail
          </a>
          <button
            type="button"
            onClick={onSignOut}
            className="text-muted-foreground hover:text-foreground text-sm underline underline-offset-2"
          >
            Sign out
          </button>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <ConnectMailboxForm onConnected={onConnected} />
          </div>
        </div>
      </div>

      {/* Right — branding panel */}
      <BrandingPanel />
    </div>
  )
}
