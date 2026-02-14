import { useCallback, useEffect, useRef, useState } from "react"

import { get, post, ApiError } from "@/lib/api"
import type {
  ThreadSummary,
  ThreadListResponse,
  SearchResponse,
  SearchResultEmail,
  AgentSearchResponse,
} from "@/types/api"

const PAGE_SIZE = 50
const DEBOUNCE_MS = 300

interface UseThreadsResult {
  threads: ThreadSummary[]
  total: number
  loading: boolean
  error: string | null
  hasMore: boolean
  loadMore: () => void
  refresh: () => void
  markAsRead: (threadId: string) => void
}

function groupSearchResults(results: SearchResultEmail[]): {
  threads: ThreadSummary[]
  count: number
} {
  const threadMap = new Map<string, SearchResultEmail[]>()
  for (const r of results) {
    const existing = threadMap.get(r.thread_id)
    if (existing) {
      existing.push(r)
    } else {
      threadMap.set(r.thread_id, [r])
    }
  }

  const threads: ThreadSummary[] = Array.from(threadMap.values()).map(
    (emails) => {
      const latest = emails.reduce((a, b) =>
        a.received_at > b.received_at ? a : b,
      )
      return {
        id: latest.thread_id,
        subject: latest.subject,
        last_updated: latest.received_at,
        email_count: emails.length,
        latest_sender: latest.sender,
        has_unread: false,
        snippet: latest.body_text,
        has_attachments: false,
      }
    },
  )

  return { threads, count: threadMap.size }
}

export function useThreads(
  mailboxId: string | null,
  searchQuery: string,
  direction: string | null,
  isAiSearch: boolean,
  aiSearchQuery: string,
  category: string | null = null,
): UseThreadsResult {
  const [threads, setThreads] = useState<ThreadSummary[]>([])
  const [total, setTotal] = useState<number>(0)
  const [page, setPage] = useState<number>(1)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState<number>(0)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // The active query depends on mode:
  // - AI mode: only fires when aiSearchQuery changes (on Enter)
  // - Keyword mode: fires on searchQuery changes (debounced)
  const activeQuery: string = isAiSearch ? aiSearchQuery : searchQuery

  // Reset when mailbox, active query, direction, category, or mode changes
  useEffect(() => {
    setThreads([])
    setTotal(0)
    setPage(1)
  }, [mailboxId, activeQuery, direction, category, isAiSearch, refreshKey])

  useEffect(() => {
    if (!mailboxId) return

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    const doFetch = () => {
      let cancelled = false

      setLoading(true)
      setError(null)

      const fetchPromise: Promise<ThreadListResponse> = (() => {
        // AI search — uses the committed aiSearchQuery
        if (isAiSearch && aiSearchQuery.trim()) {
          return post<AgentSearchResponse>(
            `/mailboxes/${mailboxId}/agent-search`,
            {
              query: aiSearchQuery.trim(),
              page,
              page_size: PAGE_SIZE,
            },
          ).then((data): ThreadListResponse => {
            const { threads, count } = groupSearchResults(data.results)
            return { threads, total: count, page: data.page, page_size: data.page_size }
          })
        }

        // Keyword search — uses the live searchQuery
        if (!isAiSearch && searchQuery.trim()) {
          return post<SearchResponse>(
            `/mailboxes/${mailboxId}/search`,
            {
              keywords: searchQuery.trim(),
              page,
              page_size: PAGE_SIZE,
            },
          ).then((data): ThreadListResponse => {
            const { threads, count } = groupSearchResults(data.results)
            return { threads, total: count, page: data.page, page_size: data.page_size }
          })
        }

        // Normal thread listing
        const directionParam: string = direction ? `&direction=${direction}` : ""
        const categoryParam: string = category ? `&category=${encodeURIComponent(category)}` : ""
        return get<ThreadListResponse>(
          `/mailboxes/${mailboxId}/threads?page=${page}&page_size=${PAGE_SIZE}${directionParam}${categoryParam}`,
        )
      })()

      fetchPromise
        .then((data) => {
          if (!cancelled) {
            setThreads((prev) =>
              page === 1 ? data.threads : [...prev, ...data.threads],
            )
            setTotal(data.total)
          }
        })
        .catch((err: unknown) => {
          if (!cancelled) {
            setError(err instanceof ApiError ? err.detail : "Failed to load threads")
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })

      return () => { cancelled = true }
    }

    // Debounce keyword search only (not AI search — that fires on Enter)
    if (!isAiSearch && searchQuery.trim() && page === 1) {
      debounceRef.current = setTimeout(doFetch, DEBOUNCE_MS)
      return () => {
        if (debounceRef.current) clearTimeout(debounceRef.current)
      }
    }

    // AI search with no committed query — don't fetch, show empty
    if (isAiSearch && !aiSearchQuery.trim()) {
      setLoading(false)
      return
    }

    return doFetch()
  }, [mailboxId, activeQuery, direction, category, isAiSearch, page, refreshKey])

  const hasMore = threads.length < total

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      setPage((prev) => prev + 1)
    }
  }, [loading, hasMore])

  const refresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1)
  }, [])

  const markAsRead = useCallback(
    (threadId: string) => {
      // Optimistic update: immediately remove unread styling
      setThreads((prev) =>
        prev.map((t) =>
          t.id === threadId ? { ...t, has_unread: false } : t,
        ),
      )
      // Fire-and-forget API call to persist the read state
      if (mailboxId) {
        post(`/mailboxes/${mailboxId}/threads/${threadId}/read`).catch(
          () => {},
        )
      }
    },
    [mailboxId],
  )

  return { threads, total, loading, error, hasMore, loadMore, refresh, markAsRead }
}
