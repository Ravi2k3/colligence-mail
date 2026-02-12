import { MailIcon } from "lucide-react"

export function ThreadDetailEmpty() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-muted">
        <MailIcon className="size-6 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground">
          Select a conversation
        </p>
        <p className="text-xs text-muted-foreground/70">
          Choose a thread from the list to read
        </p>
      </div>
    </div>
  )
}
