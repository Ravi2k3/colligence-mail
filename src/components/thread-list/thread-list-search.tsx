import { SearchIcon } from "lucide-react"

import { Input } from "@/components/ui/input"

interface ThreadListSearchProps {
  value: string
  onChange: (value: string) => void
}

export function ThreadListSearch({ value, onChange }: ThreadListSearchProps) {
  return (
    <div className="relative w-full">
      <SearchIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Search emails..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-8"
      />
    </div>
  )
}
