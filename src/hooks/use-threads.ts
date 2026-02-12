import { useCallback, useEffect, useRef, useState } from "react"

import { get, post, ApiError } from "@/lib/api"
import type {
  ThreadSummary,
  ThreadListResponse,
  SearchResponse,
  SearchResultEmail,
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

export function useThreads(
  mailboxId: string | null,
  searchQuery: string,
  direction: string | null,
): UseThreadsResult {
  const [threads, setThreads] = useState<ThreadSummary[]>([])
  const [total, setTotal] = useState<number>(0)
  const [page, setPage] = useState<number>(1)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState<number>(0)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Reset when mailbox, search query, or refresh key changes
  useEffect(() => {
    setThreads([])
    setTotal(0)
    setPage(1)
  }, [mailboxId, searchQuery, direction, refreshKey])

  useEffect(() => {
    if (!mailboxId) return

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    const doFetch = () => {
      let cancelled = false

      setLoading(true)
      setError(null)

      const fetchPromise = searchQuery.trim()
        ? post<SearchResponse>(`/mailboxes/${mailboxId}/search`, {
            keywords: searchQuery.trim(),
            page,
            page_size: PAGE_SIZE,
          }).then((data): ThreadListResponse => {
            // Group emails by thread_id so a thread appears once, not per-email
            const threadMap = new Map<string, SearchResultEmail[]>()
            for (const r of data.results) {
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

            return {
              threads,
              total: threadMap.size,
              page: data.page,
              page_size: data.page_size,
            }
          })
        : get<ThreadListResponse>(
            `/mailboxes/${mailboxId}/threads?page=${page}&page_size=${PAGE_SIZE}${direction ? `&direction=${direction}` : ""}`,
          )

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

    // Debounce search queries, fetch immediately for page changes or non-search
    if (searchQuery.trim() && page === 1) {
      debounceRef.current = setTimeout(doFetch, DEBOUNCE_MS)
      return () => {
        if (debounceRef.current) clearTimeout(debounceRef.current)
      }
    }

    return doFetch()
  }, [mailboxId, searchQuery, direction, page, refreshKey])

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
