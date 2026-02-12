import { useCallback, useEffect, useState } from "react"

import { get, ApiError } from "@/lib/api"
import type {
  SkippedEmailSummary,
  SkippedEmailListResponse,
} from "@/types/api"

const PAGE_SIZE = 50

interface UseSkippedEmailsResult {
  skippedEmails: SkippedEmailSummary[]
  total: number
  loading: boolean
  error: string | null
  hasMore: boolean
  loadMore: () => void
}

export function useSkippedEmails(
  mailboxId: string | null,
  enabled: boolean,
): UseSkippedEmailsResult {
  const [skippedEmails, setSkippedEmails] = useState<SkippedEmailSummary[]>([])
  const [total, setTotal] = useState<number>(0)
  const [page, setPage] = useState<number>(1)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // Reset when mailbox changes or sheet closes
  useEffect(() => {
    setSkippedEmails([])
    setTotal(0)
    setPage(1)
  }, [mailboxId, enabled])

  useEffect(() => {
    if (!mailboxId || !enabled) return

    let cancelled: boolean = false
    setLoading(true)
    setError(null)

    get<SkippedEmailListResponse>(
      `/mailboxes/${mailboxId}/skipped-emails?page=${page}&page_size=${PAGE_SIZE}`,
    )
      .then((data) => {
        if (!cancelled) {
          setSkippedEmails((prev) =>
            page === 1 ? data.items : [...prev, ...data.items],
          )
          setTotal(data.total)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.detail
              : "Failed to load filtered emails",
          )
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [mailboxId, enabled, page])

  const hasMore: boolean = skippedEmails.length < total

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      setPage((prev) => prev + 1)
    }
  }, [loading, hasMore])

  return { skippedEmails, total, loading, error, hasMore, loadMore }
}
