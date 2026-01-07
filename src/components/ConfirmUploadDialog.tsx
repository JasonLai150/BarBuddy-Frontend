import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Video, CheckCircle, XCircle } from "lucide-react";

interface ConfirmUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: File | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmUploadDialog({
  open,
  onOpenChange,
  file,
  onConfirm,
  onCancel,
}: ConfirmUploadDialogProps) {
  if (!file) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-primary" />
            Confirm Video Selection
          </DialogTitle>
          <DialogDescription>
            Review your selected video before proceeding.
          </DialogDescription>
        </DialogHeader>

        <div className="my-4 rounded-lg border border-border bg-muted/30 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Video className="h-6 w-6 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-foreground">{file.name}</p>
              <p className="text-sm text-muted-foreground">
                Size: {(file.size / (1024 * 1024)).toFixed(2)} MB
              </p>
              <p className="text-sm text-muted-foreground">
                Type: {file.type.split("/")[1]?.toUpperCase() || "Video"}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={onCancel}
            className="w-full sm:w-auto"
          >
            <XCircle className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button onClick={onConfirm} className="w-full sm:w-auto">
            <CheckCircle className="mr-2 h-4 w-4" />
            Accept Video
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
