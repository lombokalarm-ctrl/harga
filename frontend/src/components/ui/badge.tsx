import type { PropsWithChildren } from "react";
import { cn } from "@/lib/utils";

export function Badge({ children, className }: PropsWithChildren<{ className?: string }>) {
  return <span className={cn("inline-flex items-center rounded-full border border-gold-500/30 bg-gold-500/10 px-3 py-1 text-xs font-medium text-gold-600 dark:text-gold-300", className)}>{children}</span>;
}
