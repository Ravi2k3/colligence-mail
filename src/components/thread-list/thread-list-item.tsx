import { PaperclipIcon } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import {
  formatRelativeDate,
  extractSenderName,
  extractSenderEmail,
  getInitials,
  getAvatarColors,
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
  const senderName: string = thread.latest_sender
    ? extractSenderName(thread.latest_sender)
    : "Unknown"
  const senderEmail: string = thread.latest_sender
    ? extractSenderEmail(thread.latest_sender)
    : ""
  const initials: string = getInitials(senderName)
  const displayName: string = senderName !== senderEmail ? senderName : senderEmail
  const { bgClass, textClass } = getAvatarColors(senderEmail || senderName)

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
      {/* Colorful avatar with unread dot */}
      <div className="relative mt-0.5 shrink-0">
        <Avatar className="size-9">
          <AvatarFallback className={cn("text-xs font-medium", bgClass, textClass)}>
            {initials}
          </AvatarFallback>
        </Avatar>
        {thread.has_unread && (
          <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-blue-500 ring-2 ring-background" />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        {/* Row 1: sender + meta */}
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={cn(
              "min-w-0 flex-1 truncate text-[13px] text-foreground",
              thread.has_unread ? "font-bold" : "font-semibold",
            )}
          >
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

        {/* Row 2: subject + attachment indicator */}
        <div className="flex min-w-0 items-center gap-1.5">
          <p
            className={cn(
              "min-w-0 flex-1 truncate text-[12px] leading-snug text-muted-foreground",
              thread.has_unread && "font-semibold text-foreground",
            )}
          >
            {thread.subject ?? "(no subject)"}
          </p>
          {thread.has_attachments && (
            <PaperclipIcon className="size-3 shrink-0 text-muted-foreground" />
          )}
        </div>

        {/* Row 3: body snippet */}
        {thread.snippet && (
          <p className="truncate text-xs leading-tight text-muted-foreground">
            {thread.snippet}
          </p>
        )}
      </div>
    </button>
  )
}
