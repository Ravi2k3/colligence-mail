import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { ThreadListSearch } from "@/components/thread-list/thread-list-search"
import { ThreadListItem } from "@/components/thread-list/thread-list-item"
import { ThreadListEmpty } from "@/components/thread-list/thread-list-empty"
import type { ThreadSummary } from "@/types/api"

interface ThreadListProps {
  threads: ThreadSummary[]
  total: number
  loading: boolean
  error: string | null
  hasMore: boolean
  onLoadMore: () => void
  selectedThreadId: string | null
  onSelectThread: (threadId: string) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  isAiSearch: boolean
  onToggleAiSearch: () => void
  onSearchSubmit: () => void
}

function ThreadListSkeleton() {
  return (
    <div className="flex flex-col divide-y divide-border">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 px-4 py-3">
          <Skeleton className="size-9 shrink-0 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function ThreadList({
  threads,
  total,
  loading,
  error,
  hasMore,
  onLoadMore,
  selectedThreadId,
  onSelectThread,
  searchQuery,
  onSearchChange,
  isAiSearch,
  onToggleAiSearch,
  onSearchSubmit,
}: ThreadListProps) {
  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-background">
      {/* Search bar — pinned */}
      <div className="flex h-12 shrink-0 items-center border-b border-border px-3">
        <div className="min-w-0 flex-1">
          <ThreadListSearch
            value={searchQuery}
            onChange={onSearchChange}
            isAiSearch={isAiSearch}
            onToggleAiSearch={onToggleAiSearch}
            onSubmit={onSearchSubmit}
          />
        </div>
      </div>

      {error && (
        <div className="shrink-0 px-4 py-3 text-sm text-destructive">{error}</div>
      )}

      {loading && threads.length === 0 ? (
        <ThreadListSkeleton />
      ) : threads.length === 0 ? (
        <ThreadListEmpty isSearch={searchQuery.trim().length > 0} />
      ) : (
        <ScrollArea className="min-h-0 flex-1">
          <div className="flex flex-col divide-y divide-border">
            {threads.map((thread) => (
              <ThreadListItem
                key={thread.id}
                thread={thread}
                isSelected={thread.id === selectedThreadId}
                onClick={() => onSelectThread(thread.id)}
              />
            ))}

            {hasMore && (
              <div className="px-3 py-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-muted-foreground"
                  onClick={onLoadMore}
                  disabled={loading}
                >
                  {loading ? "Loading..." : `Load more (${threads.length} of ${total})`}
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}
