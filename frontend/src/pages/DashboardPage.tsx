import { BarChart3, BriefcaseBusiness, CircleDollarSign, LineChart, LoaderCircle, Wallet } from "lucide-react";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Area, AreaChart, CartesianGrid, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getAuditLogs, getDashboardSummary } from "@/lib/api";
import { formatCompact, formatCurrency, formatPercent } from "@/lib/format";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  const dashboardQuery = useQuery({ queryKey: ["dashboard-summary"], queryFn: getDashboardSummary });
  const auditQuery = useQuery({ queryKey: ["audit-logs", "recent"], queryFn: getAuditLogs });

  const dashboard = dashboardQuery.data;
  const composition = useMemo(
    () => dashboard?.cost_composition.map((item) => ({ name: item.package, value: item.cost })) ?? [],
    [dashboard]
  );

  if (dashboardQuery.isLoading) {
    return <div className="flex min-h-[40vh] items-center justify-center"><LoaderCircle className="h-8 w-8 animate-spin text-gold-500" /></div>;
  }

  if (!dashboard) {
    return <Card>Dashboard belum dapat dimuat dari backend.</Card>;
  }

  const recentLogs = (auditQuery.data ?? []).slice(0, 4);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <KpiCard label="Total Cost" value={formatCompact(dashboard.cards.total_cost)} subtitle="Biaya total seluruh paket tersnapshot" icon={<Wallet className="h-5 w-5" />} />
        <KpiCard label="Revenue" value={formatCompact(dashboard.cards.total_revenue)} subtitle="Total revenue berdasarkan snapshot profit" icon={<CircleDollarSign className="h-5 w-5" />} />
        <KpiCard label="Total Profit" value={formatCompact(dashboard.cards.total_profit)} subtitle="Profit gabungan seluruh paket aktif" icon={<LineChart className="h-5 w-5" />} />
        <KpiCard label="Profit Margin" value={formatPercent(dashboard.cards.profit_margin)} subtitle="Margin profit rata-rata snapshot" icon={<BarChart3 className="h-5 w-5" />} />
        <KpiCard label="HPP" value={formatCompact(dashboard.cards.hpp)} subtitle="Rata-rata HPP per jamaah" icon={<BriefcaseBusiness className="h-5 w-5" />} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-xl">Profit Projection</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Profit snapshot per paket yang tersimpan di backend.</p>
            </div>
            <Badge>Backend Connected</Badge>
          </div>
          <div className="mt-6 h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dashboard.profit_projection}>
                <defs>
                  <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#d4af37" stopOpacity={0.85} />
                    <stop offset="100%" stopColor="#4f72b6" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
                <XAxis dataKey="package" />
                <YAxis tickFormatter={(value) => `${Math.round(value / 1000000)} jt`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Area type="monotone" dataKey="profit" stroke="#d4af37" fill="url(#profitGradient)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 className="font-serif text-xl">Cost Composition</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Komposisi total cost per paket dari backend.</p>
          <div className="mt-6 h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={composition} dataKey="value" nameKey="name" innerRadius={70} outerRadius={105} fill="#4f72b6" label />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <Card>
          <h3 className="font-serif text-xl">Occupancy Analysis</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {dashboard.occupancy_analysis.map((row) => (
              <div key={row.package} className="rounded-3xl border border-slate-200 p-4 dark:border-white/10">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300">{row.package}</p>
                <p className="mt-3 font-serif text-2xl">{row.jamaah}</p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Target okupansi jamaah per paket.</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="font-serif text-xl">Recent Activity</h3>
          <div className="mt-4 space-y-4">
            {recentLogs.length === 0 ? <p className="text-sm text-slate-500 dark:text-slate-300">Belum ada audit log yang tercatat.</p> : null}
            {recentLogs.map((log) => (
              <div key={log.id} className="rounded-3xl border border-slate-200 p-4 dark:border-white/10">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{log.module}</p>
                  <Badge>{log.action}</Badge>
                </div>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{log.description ?? "Aktivitas tercatat tanpa deskripsi tambahan."}</p>
                <p className="mt-2 text-xs text-slate-400">{new Date(log.created_at).toLocaleString("id-ID")}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
