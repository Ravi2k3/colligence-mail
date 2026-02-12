import { useCallback, useEffect, useState } from "react"
import { ArrowLeftIcon, MailsIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { EmailMessage } from "@/components/thread-detail/email-message"
import { ThreadDetailEmpty } from "@/components/thread-detail/thread-detail-empty"
import type { EmailResponse } from "@/types/api"

interface ThreadDetailProps {
  emails: EmailResponse[]
  loading: boolean
  error: string | null
  onBack: () => void
}

function ThreadDetailSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-5">
      <Skeleton className="h-5 w-80" />
      <Skeleton className="h-3 w-24" />
      <div className="mt-2 flex flex-col gap-3 rounded-lg border border-border p-4">
        <div className="flex items-start gap-3">
          <Skeleton className="size-10 rounded-full" />
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-28" />
          </div>
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  )
}

export function ThreadDetail({
  emails,
  loading,
  error,
  onBack,
}: ThreadDetailProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  // Auto-expand the latest email when emails load
  useEffect(() => {
    if (emails.length > 0) {
      const lastEmailId = emails[emails.length - 1].id
      setExpandedIds(new Set([lastEmailId]))
    } else {
      setExpandedIds(new Set())
    }
  }, [emails])

  const toggleExpanded = useCallback((emailId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(emailId)) {
        next.delete(emailId)
      } else {
        next.add(emailId)
      }
      return next
    })
  }, [])

  if (emails.length === 0 && !loading && !error) {
    return <ThreadDetailEmpty />
  }

  const subject = emails.length > 0
    ? (emails[0].subject ?? "(no subject)")
    : ""

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-background">
      {/* Sticky subject header */}
      <div className="flex h-12 shrink-0 items-center gap-3 border-b border-border px-5">
        <Button
          variant="ghost"
          size="icon-sm"
          className="shrink-0 md:hidden"
          onClick={onBack}
        >
          <ArrowLeftIcon className="size-4" />
        </Button>
        <h2 className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
          {subject}
        </h2>
        {emails.length > 0 && (
          <div className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
            <MailsIcon className="size-3" />
            <span>{emails.length}</span>
          </div>
        )}
      </div>

      {error && (
        <div className="shrink-0 px-5 py-3 text-sm text-destructive">{error}</div>
      )}

      {loading ? (
        <ThreadDetailSkeleton />
      ) : (
        <ScrollArea className="min-h-0 flex-1">
          <div className="flex flex-col gap-3 p-5">
            {emails.map((email) => (
              <EmailMessage
                key={email.id}
                email={email}
                isExpanded={expandedIds.has(email.id)}
                onToggle={() => toggleExpanded(email.id)}
              />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}
