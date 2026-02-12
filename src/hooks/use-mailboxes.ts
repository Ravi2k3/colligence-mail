import { useEffect, useState } from "react"

import { get, ApiError } from "@/lib/api"
import type { MailboxResponse } from "@/types/api"

interface UseMailboxesResult {
  mailboxes: MailboxResponse[]
  loading: boolean
  error: string | null
}

export function useMailboxes(): UseMailboxesResult {
  const [mailboxes, setMailboxes] = useState<MailboxResponse[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

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
  }, [])

  return { mailboxes, loading, error }
}
