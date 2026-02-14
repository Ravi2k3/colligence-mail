import { useCallback, useEffect, useState } from "react"

import { get, del, ApiError } from "@/lib/api"
import type { MailboxResponse } from "@/types/api"

interface UseMailboxesResult {
  mailboxes: MailboxResponse[]
  loading: boolean
  error: string | null
  refresh: () => void
  deleteMailbox: (mailboxId: string) => Promise<void>
}

export function useMailboxes(): UseMailboxesResult {
  const [mailboxes, setMailboxes] = useState<MailboxResponse[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState<number>(0)

  const refresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1)
  }, [])

  useEffect(() => {
    let cancelled = false

    setLoading(true)
    get<MailboxResponse[]>("/mailboxes")
      .then((data) => {
        if (!cancelled) {
          setMailboxes(data)
          setError(null)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.detail : "Failed to load mailboxes")
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [refreshKey])

  const deleteMailbox = useCallback(async (mailboxId: string): Promise<void> => {
    await del(`/mailboxes/${mailboxId}`)
    refresh()
  }, [refresh])

  return { mailboxes, loading, error, refresh, deleteMailbox }
}
