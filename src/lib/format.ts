const MINUTE_MS = 60_000
const HOUR_MS = 3_600_000
const DAY_MS = 86_400_000

export function formatRelativeDate(isoString: string): string {
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()

  if (diffMs < HOUR_MS) {
    const minutes = Math.max(1, Math.floor(diffMs / MINUTE_MS))
    return `${minutes}m ago`
  }

  if (diffMs < DAY_MS) {
    const hours = Math.floor(diffMs / HOUR_MS)
    return `${hours}h ago`
  }

  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  ) {
    return "Yesterday"
  }

  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function extractSenderName(sender: string): string {
  const match = sender.match(/^(.+?)\s*<.+>$/)
  return match ? match[1].trim().replace(/^["']|["']$/g, "") : sender
}

export function extractSenderEmail(sender: string): string {
  const match = sender.match(/<(.+?)>/)
  return match ? match[1] : sender
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

// Curated palette of 12 distinct colors that work on both light and dark backgrounds.
// All use white text for guaranteed contrast against 500-level backgrounds.
const AVATAR_COLORS: ReadonlyArray<readonly [string, string]> = [
  ["bg-blue-500", "text-white"],
  ["bg-emerald-500", "text-white"],
  ["bg-purple-500", "text-white"],
  ["bg-orange-500", "text-white"],
  ["bg-pink-500", "text-white"],
  ["bg-cyan-500", "text-white"],
  ["bg-amber-500", "text-white"],
  ["bg-rose-500", "text-white"],
  ["bg-indigo-500", "text-white"],
  ["bg-teal-500", "text-white"],
  ["bg-fuchsia-500", "text-white"],
  ["bg-lime-600", "text-white"],
] as const

function simpleHash(str: string, max: number): number {
  let hash: number = 0
  for (let i: number = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash = hash & hash
  }
  return Math.abs(hash) % max
}

export function getAvatarColors(identifier: string): {
  bgClass: string
  textClass: string
} {
  const normalized: string = identifier.toLowerCase().trim()
  const index: number = simpleHash(normalized, AVATAR_COLORS.length)
  const [bgClass, textClass] = AVATAR_COLORS[index]
  return { bgClass, textClass }
}

const MONTH_SHORT: ReadonlyArray<string> = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]

export function formatDateRange(
  start: string | null,
  end: string | null,
): string {
  if (!start && !end) return "No data"

  const startDate: Date | null = start ? new Date(start) : null
  const endDate: Date | null = end ? new Date(end) : null

  const formatOne = (d: Date, includeYear: boolean): string => {
    const month: string = MONTH_SHORT[d.getMonth()]
    const day: number = d.getDate()
    return includeYear ? `${month} ${day}, ${d.getFullYear()}` : `${month} ${day}`
  }

  if (startDate && endDate) {
    const crossYear: boolean = startDate.getFullYear() !== endDate.getFullYear()
    return `${formatOne(startDate, crossYear)} – ${formatOne(endDate, crossYear)}`
  }

  const single: Date = (startDate ?? endDate)!
  return formatOne(single, true)
}

export function capitalizeCategory(category: string): string {
  if (category.length === 0) return category
  return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase()
}
