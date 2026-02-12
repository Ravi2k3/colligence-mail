import { useCallback, useEffect, useRef, useState } from "react"

import { get, post, ApiError } from "@/lib/api"
import type { ThreadSummary, ThreadListResponse, SearchResponse } from "@/types/api"

const PAGE_SIZE = 50
const DEBOUNCE_MS = 300

interface UseThreadsResult {
  threads: ThreadSummary[]
  total: number
  loading: boolean
  error: string | null
  hasMore: boolean
  loadMore: () => void
}

export function useThreads(
  mailboxId: string | null,
  searchQuery: string,
): UseThreadsResult {
  const [threads, setThreads] = useState<ThreadSummary[]>([])
  const [total, setTotal] = useState<number>(0)
  const [page, setPage] = useState<number>(1)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Reset when mailbox or search query changes
  useEffect(() => {
    setThreads([])
    setTotal(0)
    setPage(1)
  }, [mailboxId, searchQuery])

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
          }).then((data): ThreadListResponse => ({
            threads: data.results.map((r) => ({
              id: r.thread_id,
              subject: r.subject,
              last_updated: r.received_at,
              email_count: 1,
              latest_sender: r.sender,
            })),
            total: data.total,
            page: data.page,
            page_size: data.page_size,
          }))
        : get<ThreadListResponse>(
            `/mailboxes/${mailboxId}/threads?page=${page}&page_size=${PAGE_SIZE}`,
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
  }, [mailboxId, searchQuery, page])

  const hasMore = threads.length < total

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      setPage((prev) => prev + 1)
    }
  }, [loading, hasMore])

  return { threads, total, loading, error, hasMore, loadMore }
}
