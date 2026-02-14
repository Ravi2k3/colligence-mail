import { useCallback, useEffect, useState } from "react"

import { get, ApiError } from "@/lib/api"
import type { MailboxStats } from "@/types/api"

interface UseMailboxStatsResult {
  stats: MailboxStats | null
  loading: boolean
  error: string | null
  refresh: () => void
}

export function useMailboxStats(mailboxId: string | null): UseMailboxStatsResult {
  const [stats, setStats] = useState<MailboxStats | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState<number>(0)

  useEffect(() => {
    if (!mailboxId) {
      setStats(null)
      return
    }

    let cancelled = false

    setLoading(true)
    get<MailboxStats>(`/mailboxes/${mailboxId}/stats`)
      .then((data) => {
        if (!cancelled) {
          setStats(data)
          setError(null)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.detail : "Failed to load stats")
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [mailboxId, refreshKey])

  const refresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1)
  }, [])

  return { stats, loading, error, refresh }
}
