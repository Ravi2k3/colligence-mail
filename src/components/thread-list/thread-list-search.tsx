import { SearchIcon, SparklesIcon } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface ThreadListSearchProps {
  value: string
  onChange: (value: string) => void
  isAiSearch: boolean
  onToggleAiSearch: () => void
  onSubmit: () => void
}

export function ThreadListSearch({
  value,
  onChange,
  isAiSearch,
  onToggleAiSearch,
  onSubmit,
}: ThreadListSearchProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (isAiSearch && e.key === "Enter") {
      e.preventDefault()
      onSubmit()
    }
  }

  return (
    <div className="flex w-full items-center gap-1.5">
      <div className="relative min-w-0 flex-1">
        <SearchIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder={isAiSearch ? "Ask AI to search... (Enter to search)" : "Search emails..."}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="pl-8"
        />
      </div>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleAiSearch}
            className="size-8 shrink-0"
          >
            <SparklesIcon
              className={cn(
                "size-4",
                isAiSearch ? "text-violet-500" : "text-muted-foreground",
              )}
            />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {isAiSearch ? "Switch to keyword search" : "Switch to AI search"}
        </TooltipContent>
      </Tooltip>
    </div>
  )
}
