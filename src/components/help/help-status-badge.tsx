import { getTranslations } from "next-intl/server";

import { cn } from "@/lib/utils";
import { helpStatusStyles } from "@/lib/help";
import type { HelpStatus } from "@/lib/supabase/types";

export async function HelpStatusBadge({
  estado,
  className,
}: {
  estado: HelpStatus;
  className?: string;
}) {
  const t = await getTranslations("help.status");
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
        helpStatusStyles[estado],
        className,
      )}
    >
      {t(estado)}
    </span>
  );
}
