import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import {
  formatRelativeDate,
  extractSenderName,
  extractSenderEmail,
  getInitials,
} from "@/lib/format"
import type { ThreadSummary } from "@/types/api"

interface ThreadListItemProps {
  thread: ThreadSummary
  isSelected: boolean
  onClick: () => void
}

export function ThreadListItem({
  thread,
  isSelected,
  onClick,
}: ThreadListItemProps) {
  const senderName = thread.latest_sender
    ? extractSenderName(thread.latest_sender)
    : "Unknown"
  const senderEmail = thread.latest_sender
    ? extractSenderEmail(thread.latest_sender)
    : ""
  const initials = getInitials(senderName)
  const displayName = senderName !== senderEmail ? senderName : senderEmail

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full min-w-0 items-start gap-3 overflow-hidden px-4 py-3 text-left transition-colors",
        "hover:bg-muted/50",
        isSelected
          ? "bg-primary/5 border-l-2 border-l-primary"
          : "border-l-2 border-l-transparent",
      )}
    >
      <Avatar className="mt-0.5 size-9 shrink-0">
        <AvatarFallback className="bg-muted text-xs font-medium text-muted-foreground">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        {/* Row 1: sender + meta */}
        <div className="flex min-w-0 items-center gap-2">
          <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-foreground">
            {displayName}
          </span>
          <div className="flex shrink-0 items-center gap-1.5">
            {thread.email_count > 1 && (
              <span className="inline-flex size-[18px] items-center justify-center rounded-full bg-muted text-[10px] font-medium tabular-nums text-muted-foreground">
                {thread.email_count}
              </span>
            )}
            <span className="text-[11px] tabular-nums text-muted-foreground">
              {formatRelativeDate(thread.last_updated)}
            </span>
          </div>
        </div>

        {/* Row 2: subject */}
        <p className="truncate text-[12px] leading-snug text-muted-foreground">
          {thread.subject ?? "(no subject)"}
        </p>
      </div>
    </button>
  )
}
