import { useCallback, useEffect, useState } from "react"

import { Separator } from "@/components/ui/separator"
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable"
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/sidebar/sidebar"
import { ThreadList } from "@/components/thread-list/thread-list"
import { ThreadDetail } from "@/components/thread-detail/thread-detail"
import { ThreadDetailEmpty } from "@/components/thread-detail/thread-detail-empty"
import { useMailboxes } from "@/hooks/use-mailboxes"
import { useMailboxStats } from "@/hooks/use-mailbox-stats"
import { useThreads } from "@/hooks/use-threads"
import { useThreadEmails } from "@/hooks/use-thread-emails"

type NavFilter = "all" | "inbound" | "outbound"
type MobileView = "list" | "detail"

interface MailboxPageProps {
  onSignOut: () => void
}

export function MailboxPage({ onSignOut }: MailboxPageProps) {
  const [selectedMailboxId, setSelectedMailboxId] = useState<string | null>(null)
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [activeFilter, setActiveFilter] = useState<NavFilter>("all")
  const [mobileView, setMobileView] = useState<MobileView>("list")

  const { mailboxes } = useMailboxes()
  const { stats } = useMailboxStats(selectedMailboxId)
  const { threads, total, loading: threadsLoading, error: threadsError, hasMore, loadMore } =
    useThreads(selectedMailboxId, searchQuery)
  const { emails, loading: emailsLoading, error: emailsError } =
    useThreadEmails(selectedMailboxId, selectedThreadId)

  useEffect(() => {
    if (mailboxes.length > 0 && selectedMailboxId === null) {
      setSelectedMailboxId(mailboxes[0].id)
    }
  }, [mailboxes, selectedMailboxId])

  useEffect(() => {
    setSelectedThreadId(null)
    setMobileView("list")
  }, [selectedMailboxId, activeFilter])

  const handleSelectMailbox = useCallback((mailboxId: string) => {
    setSelectedMailboxId(mailboxId)
    setSearchQuery("")
    setActiveFilter("all")
  }, [])

  const handleSelectThread = useCallback((threadId: string) => {
    setSelectedThreadId(threadId)
    setMobileView("detail")
  }, [])

  const handleBackToList = useCallback(() => {
    setSelectedThreadId(null)
    setMobileView("list")
  }, [])

  const handleFilterChange = useCallback((filter: NavFilter) => {
    setActiveFilter(filter)
    setSearchQuery("")
  }, [])

  // TODO: Add direction param to GET /threads backend endpoint
  const filteredThreads = activeFilter === "all"
    ? threads
    : threads

  const threadListProps = {
    threads: filteredThreads,
    total,
    loading: threadsLoading,
    error: threadsError,
    hasMore,
    onLoadMore: loadMore,
    selectedThreadId,
    onSelectThread: handleSelectThread,
    searchQuery,
    onSearchChange: setSearchQuery,
  }

  const detailContent = selectedThreadId ? (
    <ThreadDetail
      emails={emails}
      loading={emailsLoading}
      error={emailsError}
      onBack={handleBackToList}
    />
  ) : (
    <ThreadDetailEmpty />
  )

  return (
    <SidebarProvider>
      <AppSidebar
        mailboxes={mailboxes}
        selectedMailboxId={selectedMailboxId}
        onSelectMailbox={handleSelectMailbox}
        stats={stats}
        activeFilter={activeFilter}
        onFilterChange={handleFilterChange}
        onSignOut={onSignOut}
      />

      <SidebarInset>
        <header className="bg-background sticky top-0 z-10 flex h-12 shrink-0 items-center gap-2 border-b border-border px-3">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-1 h-4" />
          <h1 className="text-sm font-medium">Colligence Mail</h1>
        </header>

        {/* Desktop: resizable two-panel layout */}
        <ResizablePanelGroup
          orientation="horizontal"
          className="hidden min-h-0 flex-1 md:flex"
        >
          <ResizablePanel
            defaultSize="30%"
            minSize="20%"
            maxSize="50%"
            className="border-r border-border"
          >
            <ThreadList {...threadListProps} />
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize="70%" minSize="30%">
            {detailContent}
          </ResizablePanel>
        </ResizablePanelGroup>

        {/* Mobile: single view toggle */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:hidden">
          {mobileView === "list" ? (
            <ThreadList {...threadListProps} />
          ) : (
            detailContent
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
