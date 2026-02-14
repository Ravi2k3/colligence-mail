import { useCallback, useEffect, useRef, useState } from "react"

import { get, post, ApiError } from "@/lib/api"
import type { SyncStatusResponse, SyncTriggerResponse } from "@/types/api"

const POLL_INTERVAL_MS = 2000

interface UseSyncStatusResult {
  syncStatus: SyncStatusResponse | null
  triggerSync: () => void
  isSyncing: boolean
  error: string | null
}

export function useSyncStatus(
  mailboxId: string | null,
  onComplete?: () => void,
): UseSyncStatusResult {
  const [syncStatus, setSyncStatus] = useState<SyncStatusResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const onCompleteRef = useRef<(() => void) | undefined>(onComplete)

  // Keep callback ref current without triggering re-renders
  onCompleteRef.current = onComplete

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
  }, [])

  const startPolling = useCallback(
    (mbId: string) => {
      stopPolling()

      const poll = () => {
        get<SyncStatusResponse>(`/mailboxes/${mbId}/sync-status`)
          .then((data) => {
            setSyncStatus(data)
            if (data.status === "completed" || data.status === "failed") {
              stopPolling()
              if (data.status === "completed") {
                onCompleteRef.current?.()
              }
              if (data.status === "failed" && data.error) {
                setError(data.error)
              }
            }
          })
          .catch((err: unknown) => {
            stopPolling()
            setError(err instanceof ApiError ? err.detail : "Failed to fetch sync status")
          })
      }

      // Poll immediately, then on interval
      poll()
      pollingRef.current = setInterval(poll, POLL_INTERVAL_MS)
    },
    [stopPolling],
  )

  const triggerSync = useCallback(() => {
    if (!mailboxId) return

    setError(null)
    setSyncStatus({
      status: "syncing",
      current_folder: "",
      folders_done: 0,
      folders_total: 0,
      emails_stored: 0,
      emails_skipped: 0,
      error: null,
    })

    post<SyncTriggerResponse>(`/mailboxes/${mailboxId}/sync`)
      .then(() => {
        startPolling(mailboxId)
      })
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.status === 409) {
          // Already syncing — start polling to pick up current progress
          startPolling(mailboxId)
        } else {
          setSyncStatus(null)
          setError(err instanceof ApiError ? err.detail : "Failed to start sync")
        }
      })
  }, [mailboxId, startPolling])

  // On mount or mailbox change: check if a sync is already running
  // (e.g. triggered by POST /mailboxes background thread at connection time)
  useEffect(() => {
    if (!mailboxId) return

    let cancelled = false

    get<SyncStatusResponse>(`/mailboxes/${mailboxId}/sync-status`)
      .then((data) => {
        if (cancelled) return
        if (data.status === "syncing") {
          setSyncStatus(data)
          startPolling(mailboxId)
        }
      })
      .catch(() => {
        // Ignore — initial check is best-effort
      })

    return () => {
      cancelled = true
      stopPolling()
    }
  }, [mailboxId, startPolling, stopPolling])

  const isSyncing: boolean = syncStatus?.status === "syncing"

  return { syncStatus, triggerSync, isSyncing, error }
}
