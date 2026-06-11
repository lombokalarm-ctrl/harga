import { useQuery } from "@tanstack/react-query";
import { Printer, FileText, Sheet } from "lucide-react";
import { LoaderCircle } from "lucide-react";
import { downloadProtectedFile, getCosting, getPackage } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { useAppStore } from "@/store/useAppStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ProposalPage() {
  const selectedPackageId = useAppStore((state) => state.selectedPackageId);

  const packageQuery = useQuery({
    queryKey: ["proposal-package", selectedPackageId],
    queryFn: () => getPackage(selectedPackageId as number),
    enabled: Boolean(selectedPackageId),
  });

  const costingQuery = useQuery({
    queryKey: ["proposal-costing", selectedPackageId],
    queryFn: () => getCosting(selectedPackageId as number),
    enabled: Boolean(selectedPackageId),
  });

  if (packageQuery.isLoading || costingQuery.isLoading) {
    return <div className="flex min-h-[40vh] items-center justify-center"><LoaderCircle className="h-8 w-8 animate-spin text-gold-500" /></div>;
  }

  const resource = packageQuery.data;
  const costing = costingQuery.data;
  if (!resource || !costing || !selectedPackageId) {
    return <Card>Proposal belum bisa dimuat dari backend.</Card>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => downloadProtectedFile(`/packages/${selectedPackageId}/proposal/pdf`, `proposal-${selectedPackageId}.pdf`)}><FileText className="h-4 w-4" /> Export PDF</Button>
        <Button variant="secondary" onClick={() => downloadProtectedFile(`/packages/${selectedPackageId}/proposal/xlsx`, `proposal-${selectedPackageId}.xlsx`)}><Sheet className="h-4 w-4" /> Export XLSX</Button>
        <Button variant="secondary" onClick={() => window.print()}><Printer className="h-4 w-4" /> Print</Button>
      </div>
      <Card className="overflow-hidden p-0">
        <div className="bg-mesh px-8 py-12 text-white">
          <p className="text-xs uppercase tracking-[0.35em] text-gold-300">Proposal Paket</p>
          <h2 className="mt-4 font-serif text-4xl">{resource.nama_paket}</h2>
          <p className="mt-4 max-w-2xl text-sm text-slate-200">Proposal ini menampilkan hotel, maskapai, itinerary, dan harga yang telah diambil dari data backend serta costing engine Laravel.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Badge>{resource.durasi_hari} Hari</Badge>
            <Badge>{resource.target_jamaah} Jamaah</Badge>
            <Badge>Harga {formatCurrency(costing.harga_jual_per_jamaah)}</Badge>
          </div>
        </div>
        <div className="grid gap-8 p-8 xl:grid-cols-[1.1fr_0.9fr]">
          <div>
            <h3 className="font-serif text-2xl">Fasilitas Utama</h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
              <li>Hotel Makkah: {resource.hotel_makkah.nama_hotel}</li>
              <li>Hotel Madinah: {resource.hotel_madinah.nama_hotel}</li>
              <li>Maskapai: {resource.airline.nama_maskapai}</li>
              <li>Visa: {resource.visa.nama_visa}</li>
              <li>Transportasi: {resource.transports.map((item) => item.nama_layanan).join(", ") || "-"}</li>
            </ul>

            <h3 className="mt-8 font-serif text-2xl">Itinerary</h3>
            <div className="mt-4 space-y-4">
              {resource.itinerary_days.map((item) => (
                <div key={`${item.hari_ke}-${item.judul}`} className="rounded-3xl border border-slate-200 p-4 dark:border-white/10">
                  <p className="text-xs uppercase tracking-[0.2em] text-gold-600 dark:text-gold-300">Hari {item.hari_ke}</p>
                  <p className="mt-2 font-medium">{item.judul}</p>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{item.deskripsi}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <Card className="bg-slate-100 dark:bg-white/5">
              <h3 className="font-serif text-2xl">Harga & Ketentuan</h3>
              <div className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between"><span>Harga Jual / Jamaah</span><strong>{formatCurrency(costing.harga_jual_per_jamaah)}</strong></div>
                <div className="flex justify-between"><span>Profit / Jamaah</span><strong>{formatCurrency(costing.profit_per_jamaah)}</strong></div>
                <div className="flex justify-between"><span>Total Profit</span><strong>{formatCurrency(costing.profit_total)}</strong></div>
              </div>
              <div className="mt-6 rounded-3xl border border-dashed border-gold-500/40 p-4 text-sm text-slate-600 dark:text-slate-300">
                Harga dapat berubah mengikuti kurs aktif, ketersediaan seat, dan kebijakan vendor. Semua angka pada halaman ini berasal dari backend yang sama dengan modul costing dan simulasi.
              </div>
            </Card>
          </div>
        </div>
      </Card>
    </div>
  );
}
