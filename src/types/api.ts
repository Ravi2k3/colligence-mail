export interface MailboxResponse {
  id: string
  email: string
  provider: string
  imap_host: string
  imap_port: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ThreadSummary {
  id: string
  subject: string | null
  last_updated: string
  email_count: number
  latest_sender: string | null
  has_unread: boolean
  snippet: string | null
  has_attachments: boolean
}

export interface ThreadListResponse {
  threads: ThreadSummary[]
  total: number
  page: number
  page_size: number
}

export interface EmailResponse {
  id: string
  thread_id: string
  message_id: string
  sender: string
  recipients: string | null
  subject: string | null
  body_text: string | null
  body_html: string | null
  direction: string
  category: string
  cc: string | null
  bcc: string | null
  reply_to: string | null
  flags: string[] | null
  size_bytes: number | null
  attachment_count: number
  attachments: Record<string, unknown>[] | null
  extras: Record<string, unknown> | null
  received_at: string
  ingested_at: string
}

export interface MailboxStats {
  total_emails: number
  total_threads: number
  inbound_count: number
  outbound_count: number
  skipped_count: number
  date_range_start: string | null
  date_range_end: string | null
  top_senders: Record<string, unknown>[]
  category_breakdown: Record<string, number>
}

export interface SearchRequest {
  keywords?: string | null
  sender?: string | null
  recipient?: string | null
  direction?: string | null
  date_from?: string | null
  date_to?: string | null
  category?: string | null
  page?: number
  page_size?: number
}

export interface SearchResultEmail {
  id: string
  thread_id: string
  sender: string
  recipients: string | null
  subject: string | null
  body_text: string | null
  direction: string
  category: string
  received_at: string
}

export interface SearchResponse {
  results: SearchResultEmail[]
  total: number
  page: number
  page_size: number
}

export interface SkippedEmailSummary {
  sender: string
  subject: string | null
  category: string
  skip_reason: string
  direction: string
  received_at: string
}

export interface SkippedEmailListResponse {
  items: SkippedEmailSummary[]
  total: number
  page: number
  page_size: number
}

export interface SyncTriggerResponse {
  status: string
  mailbox_id: string
  message: string
}

export interface SyncStatusResponse {
  status: "idle" | "syncing" | "completed" | "failed"
  current_folder: string
  folders_done: number
  folders_total: number
  emails_stored: number
  emails_skipped: number
  error: string | null
}
