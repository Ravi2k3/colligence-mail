import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { ConnectMailboxForm } from "@/components/connect-mailbox-form"

interface ConnectMailboxSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConnected: () => void
}

export function ConnectMailboxSheet({
  open,
  onOpenChange,
  onConnected,
}: ConnectMailboxSheetProps) {
  function handleConnected(): void {
    onOpenChange(false)
    onConnected()
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Add account</SheetTitle>
          <SheetDescription>
            Connect an additional email account to Colligence Mail.
          </SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-4">
          <ConnectMailboxForm onConnected={handleConnected} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
