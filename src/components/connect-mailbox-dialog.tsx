import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ConnectMailboxForm } from "@/components/connect-mailbox-form"

interface ConnectMailboxDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConnected: () => void
}

export function ConnectMailboxDialog({
  open,
  onOpenChange,
  onConnected,
}: ConnectMailboxDialogProps) {
  function handleConnected(): void {
    onOpenChange(false)
    onConnected()
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Add account</AlertDialogTitle>
          <AlertDialogDescription>
            Connect an additional email account to Colligence Mail.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <ConnectMailboxForm compact onConnected={handleConnected} />

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
