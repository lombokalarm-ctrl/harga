import type { HTMLAttributes, PropsWithChildren } from "react";
import { cn } from "@/lib/utils";

export function Card({ children, className, ...props }: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return (
    <div
      className={cn("rounded-[28px] border border-slate-200 bg-white/80 p-5 shadow-xl shadow-brand-900/5 backdrop-blur dark:border-white/10 dark:bg-white/5", className)}
      {...props}
    >
      {children}
    </div>
  );
}
