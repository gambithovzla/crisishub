import { cn } from "@/lib/utils";
import type { ModerationStatus } from "@/lib/supabase/types";

const styles: Record<ModerationStatus, string> = {
  visible: "bg-success/15 text-success",
  hidden: "bg-muted text-muted-foreground",
  false_info: "bg-destructive/15 text-destructive",
  merged: "bg-muted text-muted-foreground",
};

export function ModBadge({
  moderation,
  label,
}: {
  moderation: ModerationStatus;
  label: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-medium",
        styles[moderation],
      )}
    >
      {label}
    </span>
  );
}
