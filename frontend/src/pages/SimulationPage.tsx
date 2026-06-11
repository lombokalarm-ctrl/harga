import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { LoaderCircle } from "lucide-react";
import { getBep, getOccupancy } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { useAppStore } from "@/store/useAppStore";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/tables/DataTable";

export default function SimulationPage() {
  const selectedPackageId = useAppStore((state) => state.selectedPackageId);
  const draft = useAppStore((state) => state.packageDraft);

  const occupancyQuery = useQuery({
    queryKey: ["occupancy", selectedPackageId, draft?.default_margin_percent, draft?.target_profit_total],
    queryFn: () => getOccupancy(selectedPackageId as number, {
      margin_percent: draft?.default_margin_percent,
      target_profit_total: draft?.target_profit_total,
    }),
    enabled: Boolean(selectedPackageId),
  });

  const bepQuery = useQuery({
    queryKey: ["bep", selectedPackageId, draft?.target_jamaah, draft?.default_margin_percent, draft?.target_profit_total],
    queryFn: () => getBep(selectedPackageId as number, {
      jamaah: draft?.target_jamaah,
      margin_percent: draft?.default_margin_percent,
      target_profit_total: draft?.target_profit_total,
    }),
    enabled: Boolean(selectedPackageId),
  });

  if (occupancyQuery.isLoading || bepQuery.isLoading) {
    return <div className="flex min-h-[40vh] items-center justify-center"><LoaderCircle className="h-8 w-8 animate-spin text-gold-500" /></div>;
  }

  const rows = occupancyQuery.data ?? [];
  const bep = bepQuery.data;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <h3 className="font-serif text-xl">Simulasi Okupansi</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Data HPP, harga jual, dan profit diambil dari endpoint simulasi backend.</p>
          <div className="mt-6 h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
                <XAxis dataKey="jumlah_jamaah" />
                <YAxis tickFormatter={(value) => `${Math.round(value / 1000000)} jt`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar dataKey="hpp_per_jamaah" fill="#4f72b6" radius={[8, 8, 0, 0]} />
                <Bar dataKey="harga_jual_per_jamaah" fill="#d4af37" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 className="font-serif text-xl">Break Even Point</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Minimal jamaah, target aman, dan target ideal dihitung oleh costing engine backend.</p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 p-4 text-center dark:border-white/10"><p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300">Minimal</p><p className="mt-3 font-serif text-4xl">{bep?.minimal_jamaah ?? "-"}</p></div>
            <div className="rounded-3xl border border-slate-200 p-4 text-center dark:border-white/10"><p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300">Target Aman</p><p className="mt-3 font-serif text-4xl">{bep?.target_aman ?? "-"}</p></div>
            <div className="rounded-3xl border border-slate-200 p-4 text-center dark:border-white/10"><p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300">Target Ideal</p><p className="mt-3 font-serif text-4xl">{bep?.target_ideal ?? "-"}</p></div>
          </div>
          <div className="mt-6 h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rows}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
                <XAxis dataKey="jumlah_jamaah" />
                <YAxis tickFormatter={(value) => `${Math.round(value / 1000000)} jt`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Line type="monotone" dataKey="profit_total" stroke="#d4af37" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <DataTable
        columns={[
          { header: "Jamaah", accessorKey: "jumlah_jamaah" },
          { header: "HPP", cell: ({ row }) => formatCurrency(row.original.hpp_per_jamaah) },
          { header: "Harga Jual", cell: ({ row }) => formatCurrency(row.original.harga_jual_per_jamaah) },
          { header: "Profit Total", cell: ({ row }) => formatCurrency(row.original.profit_total) },
        ]}
        data={rows}
        title="Occupancy Table"
        subtitle="Simulasi okupansi 10 hingga 50 jamaah langsung dari API Laravel."
      />
    </div>
  );
}
