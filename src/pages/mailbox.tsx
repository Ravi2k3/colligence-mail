import { useCallback, useEffect, useMemo, useState } from "react"
import { RefreshCwIcon, SettingsIcon } from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { ConnectMailboxDialog } from "@/components/connect-mailbox-dialog"
import { SkippedEmailsSheet } from "@/components/sidebar/skipped-emails-sheet"
import { ThreadList } from "@/components/thread-list/thread-list"
import { ThreadDetail } from "@/components/thread-detail/thread-detail"
import { ThreadDetailEmpty } from "@/components/thread-detail/thread-detail-empty"
import { capitalizeCategory } from "@/lib/format"
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
  const [showAddAccount, setShowAddAccount] = useState<boolean>(false)
  const [showSettings, setShowSettings] = useState<boolean>(false)
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState<boolean>(false)
  const [isAiSearch, setIsAiSearch] = useState<boolean>(false)
  const [aiSearchQuery, setAiSearchQuery] = useState<string>("")

  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const { mailboxes, refresh: refreshMailboxes, deleteMailbox } = useMailboxes()
  const { stats, refresh: refreshStats } = useMailboxStats(selectedMailboxId)
  const direction: string | null = activeFilter === "all" ? null : activeFilter
  const { threads, total, loading: threadsLoading, error: threadsError, hasMore, loadMore, refresh, markAsRead } =
    useThreads(selectedMailboxId, searchQuery, direction, isAiSearch, aiSearchQuery, activeCategory)
  const { emails, loading: emailsLoading, error: emailsError } =
    useThreadEmails(selectedMailboxId, selectedThreadId)

  const handleSyncComplete = useCallback(() => {
    refresh()
    refreshStats()
    setShowSyncResult(true)
  }, [refresh, refreshStats])

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
  }, [selectedMailboxId, activeFilter, activeCategory])

  const handleSelectMailbox = useCallback((mailboxId: string) => {
    setSelectedMailboxId(mailboxId)
    setSearchQuery("")
    setActiveFilter("all")
    setActiveCategory(null)
    setIsAiSearch(false)
    setAiSearchQuery("")
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
    setActiveCategory(null)
    setSearchQuery("")
  }, [])

  const handleToggleAiSearch = useCallback(() => {
    setIsAiSearch((prev) => !prev)
    setSearchQuery("")
    setAiSearchQuery("")
  }, [])

  const handleSearchSubmit = useCallback(() => {
    setAiSearchQuery(searchQuery.trim())
  }, [searchQuery])

  const handleCategoryChange = useCallback((value: string) => {
    setActiveCategory(value === "all" ? null : value)
  }, [])

  const sortedCategories: [string, number][] = useMemo(() => {
    if (!stats) return []
    return Object.entries(stats.category_breakdown).sort(([, a], [, b]) => b - a)
  }, [stats])

  const handleShowSkippedEmails = useCallback(() => {
    setShowSkippedEmails(true)
  }, [])

  const handleDisconnect = useCallback(async (mailboxId: string) => {
    await deleteMailbox(mailboxId)
    // If the disconnected mailbox was selected, clear selection so
    // the auto-select effect picks the next available mailbox.
    if (mailboxId === selectedMailboxId) {
      setSelectedMailboxId(null)
    }
  }, [deleteMailbox, selectedMailboxId])

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
    isAiSearch,
    onToggleAiSearch: handleToggleAiSearch,
    onSearchSubmit: handleSearchSubmit,
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

  const isPrimaryMailbox: boolean =
    mailboxes.find((mb) => mb.id === selectedMailboxId)?.is_primary ?? false

  const syncProgressPercent: number =
    syncStatus && syncStatus.folders_total > 0
      ? Math.round((syncStatus.folders_done / syncStatus.folders_total) * 100)
      : 0

  const syncStatusText: string | null = (() => {
    if (syncError) return `Sync failed: ${syncError}`
    if (!syncStatus) return null
    if (syncStatus.status === "syncing" && syncStatus.current_folder) {
      const emailCount: number = syncStatus.emails_stored + syncStatus.emails_skipped
      const countLabel: string = emailCount > 0 ? ` — ${emailCount} emails synced` : ""
      return `Syncing ${syncStatus.current_folder}${countLabel}. This may take a few minutes...`
    }
    if (syncStatus.status === "syncing") return "Starting sync — this may take a few minutes..."
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
        onAddAccount={() => setShowAddAccount(true)}
        onSignOut={onSignOut}
        onShowSkippedEmails={handleShowSkippedEmails}
      />

      <SidebarInset>
        <header className="bg-background sticky top-0 z-10 shrink-0 border-b border-border">
          <div className="flex h-12 items-center gap-2 px-3">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-1 h-full" />
            <h1 className="shrink-0 text-sm font-medium">Colligence Mail</h1>

            {sortedCategories.length > 0 && (
              <Tabs
                value={activeCategory ?? "all"}
                onValueChange={handleCategoryChange}
                className="min-w-0 flex-1"
              >
                <TabsList variant="line" className="h-full overflow-x-auto">
                  <TabsTrigger value="all" className="text-xs">
                    All
                  </TabsTrigger>
                  {sortedCategories.map(([cat]) => (
                    <TabsTrigger key={cat} value={cat} className="text-xs">
                      {capitalizeCategory(cat)}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            )}

            {syncStatusText && (
              <span className="shrink-0 text-xs text-muted-foreground">{syncStatusText}</span>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={triggerSync}
              disabled={isSyncing || !selectedMailboxId}
              title="Sync mailbox"
            >
              <RefreshCwIcon className={`size-4 ${isSyncing ? "animate-spin" : ""}`} />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={() => setShowSettings(true)}
              disabled={!selectedMailboxId}
              title="Mailbox settings"
            >
              <SettingsIcon className="size-4" />
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

      <ConnectMailboxDialog
        open={showAddAccount}
        onOpenChange={setShowAddAccount}
        onConnected={refreshMailboxes}
      />

      {/* Mailbox settings dialog */}
      <AlertDialog open={showSettings} onOpenChange={setShowSettings}>
        <AlertDialogContent className="sm:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Mailbox settings</AlertDialogTitle>
            <AlertDialogDescription>
              {mailboxes.find((mb) => mb.id === selectedMailboxId)?.email ?? ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              disabled={isSyncing || !selectedMailboxId}
              onClick={() => {
                setShowSettings(false)
                triggerSync()
              }}
            >
              <RefreshCwIcon className="size-4" />
              {isSyncing ? "Sync in progress..." : "Sync mailbox"}
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-2 text-destructive hover:text-destructive"
              disabled={!selectedMailboxId || isPrimaryMailbox}
              title={isPrimaryMailbox ? "Cannot disconnect your primary account" : undefined}
              onClick={() => {
                setShowSettings(false)
                setShowDisconnectConfirm(true)
              }}
            >
              <span>Disconnect mailbox</span>
            </Button>
            {isPrimaryMailbox && (
              <p className="text-xs text-muted-foreground">
                Your primary account cannot be disconnected.
              </p>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Disconnect confirmation dialog */}
      <AlertDialog open={showDisconnectConfirm} onOpenChange={setShowDisconnectConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect mailbox?</AlertDialogTitle>
            <AlertDialogDescription>
              This will disconnect{" "}
              <span className="font-medium text-foreground">
                {mailboxes.find((mb) => mb.id === selectedMailboxId)?.email ?? "this mailbox"}
              </span>{" "}
              and remove all synced emails. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (selectedMailboxId) {
                  handleDisconnect(selectedMailboxId)
                }
              }}
            >
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  )
}
