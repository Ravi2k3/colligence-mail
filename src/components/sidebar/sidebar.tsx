import {
  InboxIcon,
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  ZapIcon,
  MailIcon,
  CalendarDaysIcon,
  FilterXIcon,
} from "lucide-react"

import {
  Sidebar as SidebarRoot,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge,
} from "@/components/ui/sidebar"
import { MailboxSwitcher } from "@/components/sidebar/mailbox-switcher"
import { formatDateRange } from "@/lib/format"
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
  onAddAccount: () => void
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
  onAddAccount,
  onSignOut,
  onShowSkippedEmails,
}: AppSidebarProps) {
  return (
    <SidebarRoot collapsible="offcanvas">
      <SidebarHeader>
        {/* Branding */}
        <div className="flex items-center gap-2.5 px-2 pt-1">
          <div className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600">
            <ZapIcon className="size-4 text-white" />
          </div>
          <span className="text-sm font-bold tracking-tight">
            Colligence Mail
          </span>
        </div>

        {/* Mailbox switcher + sign out */}
        <MailboxSwitcher
          mailboxes={mailboxes}
          selectedId={selectedMailboxId}
          onSelect={onSelectMailbox}
          onAddAccount={onAddAccount}
          onSignOut={onSignOut}
        />
      </SidebarHeader>

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

      </SidebarContent>
    </SidebarRoot>
  )
}
