import {
  InboxIcon,
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  LogOutIcon,
  ZapIcon,
  MailIcon,
  CalendarDaysIcon,
  FilterXIcon,
  TagIcon,
} from "lucide-react"

import {
  Sidebar as SidebarRoot,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MailboxSwitcher } from "@/components/sidebar/mailbox-switcher"
import { cn } from "@/lib/utils"
import {
  getAvatarColors,
  formatDateRange,
  capitalizeCategory,
} from "@/lib/format"
import type { MailboxResponse, MailboxStats } from "@/types/api"

type NavFilter = "all" | "inbound" | "outbound"

interface NavItemConfig {
  filter: NavFilter
  label: string
  icon: React.ElementType
  countKey: keyof Pick<MailboxStats, "total_threads" | "inbound_count" | "outbound_count">
}

const NAV_ITEMS: NavItemConfig[] = [
  { filter: "all", label: "All Threads", icon: InboxIcon, countKey: "total_threads" },
  { filter: "inbound", label: "Inbound", icon: ArrowDownLeftIcon, countKey: "inbound_count" },
  { filter: "outbound", label: "Outbound", icon: ArrowUpRightIcon, countKey: "outbound_count" },
]

interface AppSidebarProps {
  mailboxes: MailboxResponse[]
  selectedMailboxId: string | null
  onSelectMailbox: (mailboxId: string) => void
  stats: MailboxStats | null
  activeFilter: NavFilter
  onFilterChange: (filter: NavFilter) => void
  onSignOut: () => void
  onShowSkippedEmails: () => void
}

export function AppSidebar({
  mailboxes,
  selectedMailboxId,
  onSelectMailbox,
  stats,
  activeFilter,
  onFilterChange,
  onSignOut,
  onShowSkippedEmails,
}: AppSidebarProps) {
  const selectedMailbox = mailboxes.find((mb) => mb.id === selectedMailboxId)
  const userEmail: string = selectedMailbox?.email ?? "user@example.com"
  const userColors = getAvatarColors(userEmail)
  const userInitial: string = userEmail.charAt(0).toUpperCase()

  // Sort categories by count descending
  const sortedCategories: [string, number][] = stats
    ? Object.entries(stats.category_breakdown).sort(
        ([, a], [, b]) => b - a,
      )
    : []

  return (
    <SidebarRoot collapsible="offcanvas">
      {/* Branding header */}
      <SidebarHeader className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600">
            <ZapIcon className="size-4 text-white" />
          </div>
          <span className="text-sm font-bold tracking-tight">
            Colligence Mail
          </span>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      {/* Mailbox switcher */}
      <SidebarHeader>
        <MailboxSwitcher
          mailboxes={mailboxes}
          selectedId={selectedMailboxId}
          onSelect={onSelectMailbox}
        />
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map(({ filter, label, icon: Icon, countKey }) => {
                const count = stats ? stats[countKey] : null

                return (
                  <SidebarMenuItem key={filter}>
                    <SidebarMenuButton
                      isActive={activeFilter === filter}
                      onClick={() => onFilterChange(filter)}
                      tooltip={label}
                    >
                      <Icon />
                      <span>{label}</span>
                    </SidebarMenuButton>
                    {count !== null && (
                      <SidebarMenuBadge>{count.toLocaleString()}</SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Overview */}
        {stats && (
          <SidebarGroup>
            <SidebarGroupLabel>Overview</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton className="cursor-default hover:bg-transparent active:bg-transparent">
                    <MailIcon className="text-muted-foreground" />
                    <span>{stats.total_emails.toLocaleString()} emails</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton className="cursor-default hover:bg-transparent active:bg-transparent">
                    <CalendarDaysIcon className="text-muted-foreground" />
                    <span>
                      {formatDateRange(
                        stats.date_range_start,
                        stats.date_range_end,
                      )}
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton onClick={onShowSkippedEmails}>
                    <FilterXIcon className="text-muted-foreground" />
                    <span>{stats.skipped_count.toLocaleString()} filtered</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Categories */}
        {sortedCategories.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Categories</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {sortedCategories.map(([category, count]) => (
                  <SidebarMenuItem key={category}>
                    <SidebarMenuButton className="cursor-default hover:bg-transparent active:bg-transparent">
                      <TagIcon className="text-muted-foreground" />
                      <span>{capitalizeCategory(category)}</span>
                    </SidebarMenuButton>
                    <SidebarMenuBadge>
                      {count.toLocaleString()}
                    </SidebarMenuBadge>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* User footer with dropdown sign-out */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg">
                  <Avatar className="size-7 rounded-md">
                    <AvatarFallback
                      className={cn(
                        "rounded-md text-xs font-semibold",
                        userColors.bgClass,
                        userColors.textClass,
                      )}
                    >
                      {userInitial}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex min-w-0 flex-1 flex-col leading-tight">
                    <span className="truncate text-sm font-medium">
                      {userEmail}
                    </span>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width]"
                align="start"
                side="top"
              >
                <DropdownMenuItem onSelect={onSignOut} className="gap-2">
                  <LogOutIcon className="size-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </SidebarRoot>
  )
}
