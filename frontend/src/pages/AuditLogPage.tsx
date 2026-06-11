import type { ColumnDef } from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";
import { getAuditLogs } from "@/lib/api";
import type { AuditLog } from "@/types/domain";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/tables/DataTable";
import { Card } from "@/components/ui/card";

const columns: ColumnDef<AuditLog>[] = [
  { header: "Waktu", cell: ({ row }) => new Date(row.original.created_at).toLocaleString("id-ID") },
  { header: "User ID", cell: ({ row }) => row.original.user_id ?? "-" },
  { header: "Modul", accessorKey: "module" },
  { header: "Aksi", cell: ({ row }) => <Badge>{row.original.action}</Badge> },
  { header: "Deskripsi", cell: ({ row }) => row.original.description ?? "-" },
];

export default function AuditLogPage() {
  const auditQuery = useQuery({ queryKey: ["audit-logs"], queryFn: getAuditLogs });

  if (auditQuery.isLoading) {
    return <div className="flex min-h-[40vh] items-center justify-center"><LoaderCircle className="h-8 w-8 animate-spin text-gold-500" /></div>;
  }

  if (!auditQuery.data) {
    return <Card>Audit log belum tersedia dari backend.</Card>;
  }

  return <DataTable columns={columns} data={auditQuery.data} title="Audit Log" subtitle="Riwayat aktivitas sistem diambil langsung dari endpoint audit log Laravel." />;
}
