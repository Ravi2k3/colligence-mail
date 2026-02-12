import { InboxIcon, SearchIcon } from "lucide-react"

interface ThreadListEmptyProps {
  isSearch: boolean
}

export function ThreadListEmpty({ isSearch }: ThreadListEmptyProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-12 text-center">
      {isSearch ? (
        <>
          <SearchIcon className="size-10 text-muted-foreground/50" />
          <p className="text-sm font-medium text-muted-foreground">No results found</p>
          <p className="text-xs text-muted-foreground/70">
            Try a different search term
          </p>
        </>
      ) : (
        <>
          <InboxIcon className="size-10 text-muted-foreground/50" />
          <p className="text-sm font-medium text-muted-foreground">No threads yet</p>
          <p className="text-xs text-muted-foreground/70">
            Emails will appear here once synced
          </p>
        </>
      )}
    </div>
  )
}
