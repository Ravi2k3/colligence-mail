import { PaperclipIcon } from "lucide-react"

import { Separator } from "@/components/ui/separator"
import { EmailHeader } from "@/components/thread-detail/email-header"
import { EmailBody } from "@/components/thread-detail/email-body"
import { cn } from "@/lib/utils"
import type { EmailResponse } from "@/types/api"

interface EmailMessageProps {
  email: EmailResponse
  isExpanded: boolean
  onToggle: () => void
}

export function EmailMessage({
  email,
  isExpanded,
  onToggle,
}: EmailMessageProps) {
  const isOutbound: boolean = email.direction === "outbound"

  return (
    <div
      className={cn(
        "min-w-0 overflow-hidden rounded-lg border border-border shadow-sm transition-shadow hover:shadow-md",
        isOutbound
          ? "border-l-2 border-l-blue-400 bg-blue-50/50 dark:bg-blue-950/20"
          : "bg-card",
      )}
    >
      <div className="px-5 py-3.5">
        <EmailHeader
          email={email}
          onClick={onToggle}
          isExpanded={isExpanded}
        />
      </div>

      {isExpanded && (
        <>
          <Separator />
          <div className="min-w-0 overflow-hidden px-5 py-4">
            <EmailBody
              bodyHtml={email.body_html}
              bodyText={email.body_text}
            />

            {email.attachment_count > 0 && (
              <div className="mt-4 flex items-center gap-1.5 rounded-md border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                <PaperclipIcon className="size-3.5 shrink-0" />
                <span>
                  {email.attachment_count}{" "}
                  {email.attachment_count === 1 ? "attachment" : "attachments"}
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
