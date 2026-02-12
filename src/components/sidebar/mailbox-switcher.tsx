import { ChevronsUpDownIcon } from "lucide-react"

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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { getAvatarColors } from "@/lib/format"
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
  const selectedColors = selected ? getAvatarColors(selected.email) : null
  const selectedInitial: string = selected
    ? selected.email.charAt(0).toUpperCase()
    : "?"

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg">
              <Avatar className="size-7 rounded-md">
                <AvatarFallback
                  className={cn(
                    "rounded-md text-xs font-semibold",
                    selectedColors?.bgClass ?? "bg-muted",
                    selectedColors?.textClass ?? "text-muted-foreground",
                  )}
                >
                  {selectedInitial}
                </AvatarFallback>
              </Avatar>
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
            {mailboxes.map((mb) => {
              const colors = getAvatarColors(mb.email)
              const initial: string = mb.email.charAt(0).toUpperCase()

              return (
                <DropdownMenuItem
                  key={mb.id}
                  onSelect={() => onSelect(mb.id)}
                  className="gap-2"
                >
                  <Avatar className="size-5 rounded">
                    <AvatarFallback
                      className={cn(
                        "rounded text-[10px] font-semibold",
                        colors.bgClass,
                        colors.textClass,
                      )}
                    >
                      {initial}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate">{mb.email}</span>
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
