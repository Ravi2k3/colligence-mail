import { useEffect, useState } from "react"

import { get, ApiError } from "@/lib/api"
import type { EmailResponse } from "@/types/api"

interface UseThreadEmailsResult {
  emails: EmailResponse[]
  loading: boolean
  error: string | null
}

export function useThreadEmails(
  mailboxId: string | null,
  threadId: string | null,
): UseThreadEmailsResult {
  const [emails, setEmails] = useState<EmailResponse[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!mailboxId || !threadId) {
      setEmails([])
      return
    }

    let cancelled = false

    setLoading(true)
    setError(null)

    get<EmailResponse[]>(`/mailboxes/${mailboxId}/threads/${threadId}/emails`)
      .then((data) => {
        if (!cancelled) {
          setEmails(data)
          setError(null)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.detail : "Failed to load emails")
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [mailboxId, threadId])

  return { emails, loading, error }
}
