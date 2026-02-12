import { ChevronsUpDownIcon, MailIcon } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import type { MailboxResponse } from "@/types/api"

interface MailboxSwitcherProps {
  mailboxes: MailboxResponse[]
  selectedId: string | null
  onSelect: (mailboxId: string) => void
}

export function MailboxSwitcher({
  mailboxes,
  selectedId,
  onSelect,
}: MailboxSwitcherProps) {
  const selected = mailboxes.find((mb) => mb.id === selectedId)

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg">
              <div className="bg-sidebar-primary flex size-7 items-center justify-center rounded-md">
                <MailIcon className="size-4 text-sidebar-primary-foreground" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col leading-tight">
                <span className="truncate text-sm font-semibold">
                  {selected?.email ?? "Select mailbox"}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {selected?.provider ?? ""}
                </span>
              </div>
              <ChevronsUpDownIcon className="ml-auto size-4 text-muted-foreground" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width]"
            align="start"
          >
            {mailboxes.map((mb) => (
              <DropdownMenuItem
                key={mb.id}
                onSelect={() => onSelect(mb.id)}
                className="gap-2"
              >
                <MailIcon className="size-4 text-muted-foreground" />
                <span className="truncate">{mb.email}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
