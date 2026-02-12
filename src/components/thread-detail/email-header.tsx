import { ChevronDownIcon, ChevronRightIcon } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  extractSenderName,
  extractSenderEmail,
  getInitials,
  formatRelativeDate,
} from "@/lib/format"
import type { EmailResponse } from "@/types/api"

interface EmailHeaderProps {
  email: EmailResponse
  onClick: () => void
  isExpanded: boolean
}

export function EmailHeader({ email, onClick, isExpanded }: EmailHeaderProps) {
  const senderName = extractSenderName(email.sender)
  const senderEmail = extractSenderEmail(email.sender)
  const initials = getInitials(senderName)
  const displayName = senderName !== senderEmail ? senderName : senderEmail

  return (
    <button
      onClick={onClick}
      className="flex w-full items-start gap-3 text-left"
    >
      <Avatar className="mt-0.5 size-10 shrink-0">
        <AvatarFallback className="bg-muted text-xs font-medium text-muted-foreground">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Row 1: sender name + direction badge */}
        <div className="flex items-center gap-2">
          <span className="truncate text-[13px] font-semibold text-foreground">
            {displayName}
          </span>
          <Badge
            variant={email.direction === "outbound" ? "default" : "secondary"}
            className="shrink-0 text-[10px] px-1.5 py-0"
          >
            {email.direction === "outbound" ? "Sent" : "Received"}
          </Badge>
          <span className="ml-auto shrink-0 text-[11px] tabular-nums text-muted-foreground">
            {formatRelativeDate(email.received_at)}
          </span>
        </div>

        {/* Row 2: sender email */}
        <span className="mt-0.5 truncate text-[12px] text-muted-foreground">
          {senderEmail}
        </span>

        {/* Row 3+: To / Cc (only when expanded) */}
        {isExpanded && (
          <div className="mt-1.5 flex flex-col gap-0.5 text-[12px] text-muted-foreground">
            {email.recipients && (
              <span className="truncate">
                <span className="font-medium">To:</span> {email.recipients}
              </span>
            )}
            {email.cc && (
              <span className="truncate">
                <span className="font-medium">Cc:</span> {email.cc}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="mt-1.5 shrink-0 text-muted-foreground">
        {isExpanded ? (
          <ChevronDownIcon className="size-4" />
        ) : (
          <ChevronRightIcon className="size-4" />
        )}
      </div>
    </button>
  )
}
