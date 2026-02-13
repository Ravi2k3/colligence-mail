# Colligence Mail — Frontend

Web client for the Colligence email intelligence platform. Two-panel responsive email client with keyword search, AI-powered natural language search, real-time sync, and thread-based conversation view.

Built with React 19, TypeScript, Vite, Tailwind CSS v4, and shadcn/ui.

## What it does

- **Thread browsing** — Paginated thread list with unread indicators, attachment badges, sender avatars (color-coded by email hash), relative timestamps, and snippet previews. Click to load the full conversation.
- **Keyword search** — Live debounced search (300ms) as you type. Calls the structured search endpoint, groups flat email results into thread summaries.
- **AI search** — Toggle via sparkles icon. Type a natural language query and press Enter. Calls the LLM-powered agent-search endpoint. Results grouped into threads, with the interpreted query visible in the response.
- **Thread detail** — Full conversation view with expand/collapse per email. HTML bodies rendered in sandboxed iframes. Plaintext fallback. Outbound emails get a blue left border accent.
- **Sync with progress** — Click refresh to trigger IMAP backfill. Progress bar shows folder-by-folder progress. Auto-dismisses after completion.
- **Sidebar** — Collapsible sidebar with mailbox switcher, inbound/outbound/all filtering, mailbox stats (total emails, date range, filtered count), and category breakdown.
- **Skipped emails viewer** — Slide-over sheet listing all filtered-out emails with sender, subject, skip reason, category, and date. Paginated.
- **Mark as read** — Clicking a thread marks all its emails as read. Optimistic UI update.
- **Login** — Email + app password authentication. JWT stored in localStorage with auto-redirect on 401.
- **Mobile responsive** — Two-panel resizable layout on desktop, single-view toggle on mobile (< 768px).

## Architecture

```
src/
├── App.tsx                          Root component (auth gating)
├── main.tsx                         Vite entry point (TooltipProvider)
├── index.css                        Global styles (Tailwind + custom theme)
├── pages/
│   ├── login.tsx                    Login form (email + app password)
│   └── mailbox.tsx                  Main email interface (sidebar + panels)
├── components/
│   ├── sidebar/
│   │   ├── sidebar.tsx              App sidebar (nav, stats, categories)
│   │   ├── mailbox-switcher.tsx     Mailbox dropdown + sign out
│   │   └── skipped-emails-sheet.tsx Filtered emails slide-over
│   ├── thread-list/
│   │   ├── thread-list.tsx          Thread list with search bar
│   │   ├── thread-list-item.tsx     Single thread row
│   │   ├── thread-list-search.tsx   Search input + AI toggle
│   │   └── thread-list-empty.tsx    Empty state placeholder
│   ├── thread-detail/
│   │   ├── thread-detail.tsx        Conversation view
│   │   ├── email-message.tsx        Single email (expand/collapse)
│   │   ├── email-header.tsx         From/to/date header bar
│   │   ├── email-body.tsx           HTML/text email renderer (sandboxed iframe)
│   │   └── thread-detail-empty.tsx  No-thread-selected state
│   └── ui/                          shadcn/ui primitives (20+ components)
├── hooks/
│   ├── use-threads.ts               Thread fetching + search (keyword & AI)
│   ├── use-thread-emails.ts         Emails for a single thread
│   ├── use-mailboxes.ts             Mailbox list
│   ├── use-mailbox-stats.ts         Dashboard stats
│   ├── use-sync-status.ts           Sync progress polling
│   ├── use-skipped-emails.ts        Filtered emails (lazy-loaded)
│   └── use-mobile.ts                Responsive breakpoint detection (768px)
├── lib/
│   ├── api.ts                       HTTP client (fetch wrapper, JWT injection)
│   ├── auth.ts                      Token storage (localStorage)
│   ├── format.ts                    Date formatting, avatar colors, sender parsing
│   └── utils.ts                     Tailwind class merge (cn)
└── types/
    └── api.ts                       TypeScript interfaces for all API responses
```

## Setup

### Prerequisites

- Node.js 20+
- Backend API running (default: `http://localhost:8000/api/v1`)

### Install & run

```bash
npm install

# Development (hot reload on port 5173)
npm run dev

# Production build
npm run build
npm run preview

# Lint
npm run lint
```

### Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | `http://localhost:8000/api/v1` | Backend API base URL |

## API endpoints consumed

All requests (except login) include `Authorization: Bearer <token>`. On 401 response, the client clears the token and redirects to login.

| Method | Endpoint | Hook | Purpose |
|--------|----------|------|---------|
| POST | `/auth/login` | LoginPage | Authenticate (email + app password) |
| GET | `/mailboxes` | useMailboxes | List user's mailboxes |
| GET | `/mailboxes/{id}/stats` | useMailboxStats | Mailbox stats (counts, categories, date range) |
| GET | `/mailboxes/{id}/threads` | useThreads | Paginated thread list (direction filter) |
| POST | `/mailboxes/{id}/search` | useThreads | Keyword search (FTS + ILIKE) |
| POST | `/mailboxes/{id}/agent-search` | useThreads | AI search (LLM query parser + vector/keyword) |
| GET | `/mailboxes/{id}/threads/{tid}/emails` | useThreadEmails | All emails in a thread |
| POST | `/mailboxes/{id}/threads/{tid}/read` | useThreads | Mark thread as read |
| GET | `/mailboxes/{id}/skipped-emails` | useSkippedEmails | Paginated filtered emails |
| POST | `/mailboxes/{id}/sync` | useSyncStatus | Trigger IMAP backfill |
| GET | `/mailboxes/{id}/sync-status` | useSyncStatus | Poll sync progress |

## Hooks

### useThreads(mailboxId, searchQuery, direction, isAiSearch, aiSearchQuery)

Core hook for the thread list. Handles three modes:

1. **Browse** — No search query. Calls `GET /threads` with direction and pagination.
2. **Keyword search** — `searchQuery` set. Debounced 300ms, calls `POST /search`, groups flat results by `thread_id`.
3. **AI search** — `isAiSearch` true + `aiSearchQuery` set. Fires on Enter only. Calls `POST /agent-search`, groups results by `thread_id`.

Returns `{ threads, total, loading, error, hasMore, loadMore, refresh, markAsRead }`.

`markAsRead` is optimistic — updates local state immediately and fires the API call in the background without awaiting.

### useSyncStatus(mailboxId, onComplete?)

Triggers sync and polls progress every 2 seconds. Returns `{ syncStatus, triggerSync, isSyncing, error }`.

Handles 409 Conflict (already syncing) by switching to polling mode. Stops polling on completion/failure and fires the `onComplete` callback.

### useSkippedEmails(mailboxId, enabled)

Lazy-loaded — only fetches when `enabled` is true (sheet open). Paginated with `loadMore`. Returns `{ skippedEmails, total, loading, error, hasMore, loadMore }`.

## Key patterns

### Search result grouping

The backend returns flat email results. The `useThreads` hook groups them into `ThreadSummary[]` by:

1. Grouping emails by `thread_id`
2. Picking the latest email per thread (by `received_at`)
3. Building a `ThreadSummary` from the latest email's sender, subject, snippet, and attachment status

### Email body rendering

`EmailBody` renders HTML email content in a sandboxed iframe (`sandbox="allow-same-origin"`). The iframe auto-resizes to content height via `postMessage`. Injects sanitized styles for fonts, images, links, code blocks, and tables. Plaintext emails render in a `<pre>` tag with word wrapping.

### Avatar color determinism

`getAvatarColors()` hashes the sender identifier to one of 12 colors (blue, emerald, purple, orange, pink, cyan, amber, rose, indigo, teal, fuchsia, lime). Same sender always gets the same color across sessions.

### Auth flow

1. `App.tsx` checks `isAuthenticated()` (token exists in localStorage)
2. Not authenticated → `LoginPage` → POST `/auth/login` with `skipAuth: true` → store token → set `authed` state
3. Authenticated → `MailboxPage`
4. Any 401 from `api.ts` → `clearToken()` → `window.location.reload()` → back to login

### Mobile layout

- Desktop (>= 768px): Resizable two-panel layout via `react-resizable-panels` — 30% thread list, 70% detail. Panels resize by dragging the handle.
- Mobile (< 768px): Single-view toggle. `mobileView` state switches between `"list"` and `"detail"`. Back button in thread detail returns to list.

### Sync workflow

1. User clicks refresh button → `triggerSync()`
2. `POST /sync` (returns 200 or 409 if already syncing)
3. Poll `GET /sync-status` every 2s
4. Progress bar shows `folders_done / folders_total` percentage with current folder name
5. On completion → `onComplete()` callback fires → thread list refreshes
6. Result notification (stored/skipped counts) auto-dismisses after 5s

## HTTP client

`lib/api.ts` exports `get<T>()`, `post<T>()`, and `del<T>()`. Features:

- Base URL from `VITE_API_BASE_URL` (falls back to `http://localhost:8000/api/v1`)
- JWT token injected via `Authorization: Bearer` header
- Auto-logout on 401 (clear token + reload)
- `ApiError` class with `status` and `detail` for structured error handling
- Handles 204 No Content gracefully
- `skipAuth` option for the login endpoint

## Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.2 | UI framework |
| TypeScript | 5.9 | Type safety |
| Vite | 7.2 | Build tool + dev server |
| Tailwind CSS | 4.1 | Utility-first styling (oklch colors, dark mode ready) |
| shadcn/ui | 3.8 | Component primitives (Radix UI) |
| react-resizable-panels | 4.6 | Desktop two-panel layout |
| lucide-react | 0.563 | Icon library |
| Inter | variable | Typography (@fontsource-variable) |
| class-variance-authority | 0.7 | Type-safe component variants |
