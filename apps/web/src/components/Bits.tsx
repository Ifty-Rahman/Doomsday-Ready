import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const FieldError = ({ message }: { message?: string }) =>
  message ? <p className="text-destructive mt-1 text-sm" role="alert">{message}</p> : null;

export const Loading = () => (
  <div className="text-muted-foreground flex items-center gap-2 py-6"><Loader2 className="size-4 animate-spin" /> Loading...</div>
);

export const ErrorMessage = ({ error }: { error: unknown }) => (
  <p className="text-destructive py-4" role="alert">
    {error instanceof Error ? error.message : "Something went wrong"}
  </p>
);

export const EmptyState = ({ children }: { children: ReactNode }) => (
  <div className="text-muted-foreground rounded-lg border border-dashed p-8 text-center">{children}</div>
);

export const PageTitle = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <div className="mb-6">
    <h2 className="text-4xl">{title}</h2>
    <p className="text-muted-foreground">{subtitle}</p>
  </div>
);

export function ConfirmDelete({
  trigger, title, description, onConfirm,
}: { trigger: ReactNode; title: string; description: string; onConfirm: () => void }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
