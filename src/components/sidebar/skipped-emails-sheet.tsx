import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { useSkippedEmails } from "@/hooks/use-skipped-emails"
import { extractSenderName, formatRelativeDate } from "@/lib/format"

interface SkippedEmailsSheetProps {
  mailboxId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function SkippedEmailsSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3.5 w-40" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-3 w-full" />
          <div className="flex gap-1.5">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function SkippedEmailsSheet({
  mailboxId,
  open,
  onOpenChange,
}: SkippedEmailsSheetProps) {
  const { skippedEmails, total, loading, error, hasMore, loadMore } =
    useSkippedEmails(mailboxId, open)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Filtered Emails</SheetTitle>
          <SheetDescription>
            {total > 0
              ? `${total.toLocaleString()} emails were filtered out during sync.`
              : "No filtered emails."}
          </SheetDescription>
        </SheetHeader>

        {error && (
          <div className="px-4 text-sm text-destructive">{error}</div>
        )}

        {loading && skippedEmails.length === 0 ? (
          <SkippedEmailsSkeleton />
        ) : (
          <ScrollArea className="min-h-0 flex-1">
            <div className="flex flex-col divide-y divide-border">
              {skippedEmails.map((email, index) => (
                <div key={index} className="flex flex-col gap-1 px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium">
                      {extractSenderName(email.sender)}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatRelativeDate(email.received_at)}
                    </span>
                  </div>
                  <span className="truncate text-sm text-muted-foreground">
                    {email.subject ?? "(no subject)"}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="secondary" className="text-xs">
                      {email.skip_reason}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {email.category}
                    </Badge>
                  </div>
                </div>
              ))}

              {hasMore && (
                <div className="px-4 py-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-muted-foreground"
                    onClick={loadMore}
                    disabled={loading}
                  >
                    {loading
                      ? "Loading..."
                      : `Load more (${skippedEmails.length} of ${total})`}
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </SheetContent>
    </Sheet>
  )
}
