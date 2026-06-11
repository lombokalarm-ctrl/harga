import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";

export function KpiCard({ label, value, subtitle, icon }: { label: string; value: string; subtitle: string; icon: ReactNode }) {
  return (
    <Card className="overflow-hidden bg-gradient-to-br from-white to-brand-50 dark:from-white/10 dark:to-white/5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300">{label}</p>
          <p className="mt-4 font-serif text-3xl font-semibold">{value}</p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{subtitle}</p>
        </div>
        <div className="rounded-2xl bg-brand-900/95 p-3 text-gold-400 shadow-glow dark:bg-gold-500/10">{icon}</div>
      </div>
      <div className="mt-5 inline-flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-300">
        <ArrowUpRight className="h-3.5 w-3.5" />
        Profitabilitas bergerak sesuai update costing terbaru.
      </div>
    </Card>
  );
}
