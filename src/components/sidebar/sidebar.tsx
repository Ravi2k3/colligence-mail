import {
  InboxIcon,
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  LogOutIcon,
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
import { MailboxSwitcher } from "@/components/sidebar/mailbox-switcher"
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
}

export function AppSidebar({
  mailboxes,
  selectedMailboxId,
  onSelectMailbox,
  stats,
  activeFilter,
  onFilterChange,
  onSignOut,
}: AppSidebarProps) {
  return (
    <SidebarRoot collapsible="offcanvas">
      <SidebarHeader>
        <MailboxSwitcher
          mailboxes={mailboxes}
          selectedId={selectedMailboxId}
          onSelect={onSelectMailbox}
        />
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Mailbox</SidebarGroupLabel>
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
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={onSignOut}>
              <LogOutIcon />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </SidebarRoot>
  )
}
