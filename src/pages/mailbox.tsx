import { useCallback, useEffect, useState } from "react"
import { RefreshCwIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
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
import { SkippedEmailsSheet } from "@/components/sidebar/skipped-emails-sheet"
import { ThreadList } from "@/components/thread-list/thread-list"
import { ThreadDetail } from "@/components/thread-detail/thread-detail"
import { ThreadDetailEmpty } from "@/components/thread-detail/thread-detail-empty"
import { useMailboxes } from "@/hooks/use-mailboxes"
import { useMailboxStats } from "@/hooks/use-mailbox-stats"
import { useThreads } from "@/hooks/use-threads"
import { useThreadEmails } from "@/hooks/use-thread-emails"
import { useSyncStatus } from "@/hooks/use-sync-status"

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
  const [showSyncResult, setShowSyncResult] = useState<boolean>(false)
  const [showSkippedEmails, setShowSkippedEmails] = useState<boolean>(false)

  const { mailboxes } = useMailboxes()
  const { stats } = useMailboxStats(selectedMailboxId)
  const direction: string | null = activeFilter === "all" ? null : activeFilter
  const { threads, total, loading: threadsLoading, error: threadsError, hasMore, loadMore, refresh, markAsRead } =
    useThreads(selectedMailboxId, searchQuery, direction)
  const { emails, loading: emailsLoading, error: emailsError } =
    useThreadEmails(selectedMailboxId, selectedThreadId)

  const handleSyncComplete = useCallback(() => {
    refresh()
    setShowSyncResult(true)
  }, [refresh])

  const { syncStatus, triggerSync, isSyncing, error: syncError } =
    useSyncStatus(selectedMailboxId, handleSyncComplete)

  // Auto-dismiss sync result after 5 seconds
  useEffect(() => {
    if (!showSyncResult) return
    const timer = setTimeout(() => setShowSyncResult(false), 5000)
    return () => clearTimeout(timer)
  }, [showSyncResult])

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
    markAsRead(threadId)
  }, [markAsRead])

  const handleBackToList = useCallback(() => {
    setSelectedThreadId(null)
    setMobileView("list")
  }, [])

  const handleFilterChange = useCallback((filter: NavFilter) => {
    setActiveFilter(filter)
    setSearchQuery("")
  }, [])

  const handleShowSkippedEmails = useCallback(() => {
    setShowSkippedEmails(true)
  }, [])

  const threadListProps = {
    threads,
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

  const syncProgressPercent: number =
    syncStatus && syncStatus.folders_total > 0
      ? Math.round((syncStatus.folders_done / syncStatus.folders_total) * 100)
      : 0

  const syncStatusText: string | null = (() => {
    if (syncError) return `Sync failed: ${syncError}`
    if (!syncStatus) return null
    if (syncStatus.status === "syncing" && syncStatus.current_folder) {
      return `Syncing ${syncStatus.current_folder}...`
    }
    if (syncStatus.status === "syncing") return "Starting sync..."
    if (syncStatus.status === "completed" && showSyncResult) {
      return `Sync complete: ${syncStatus.emails_stored} stored, ${syncStatus.emails_skipped} skipped`
    }
    if (syncStatus.status === "failed" && syncStatus.error) {
      return `Sync failed: ${syncStatus.error}`
    }
    return null
  })()

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
        onShowSkippedEmails={handleShowSkippedEmails}
      />

      <SidebarInset>
        <header className="bg-background sticky top-0 z-10 shrink-0 border-b border-border">
          <div className="flex h-12 items-center gap-2 px-3">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-1 h-full" />
            <h1 className="flex-1 text-sm font-medium">Colligence Mail</h1>

            {syncStatusText && (
              <span className="text-xs text-muted-foreground">{syncStatusText}</span>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={triggerSync}
              disabled={isSyncing || !selectedMailboxId}
              title="Sync mailbox"
            >
              <RefreshCwIcon className={`size-4 ${isSyncing ? "animate-spin" : ""}`} />
            </Button>
          </div>

          {isSyncing && (
            <Progress value={syncProgressPercent} className="h-0.5 rounded-none" />
          )}
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

      <SkippedEmailsSheet
        mailboxId={selectedMailboxId}
        open={showSkippedEmails}
        onOpenChange={setShowSkippedEmails}
      />
    </SidebarProvider>
  )
}
