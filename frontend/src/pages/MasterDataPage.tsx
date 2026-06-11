import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Eye, FileUp, LoaderCircle, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import {
  createEntity,
  deleteEntity,
  downloadHotelImportTemplate,
  downloadMasterDataImportTemplate,
  getLookups,
  importHotelPrices,
  importMasterData,
  previewHotelImport,
  previewMasterDataImport,
  updateEntity,
} from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { DataTable } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useUiStore } from "@/store/useUiStore";
import type { HotelImportPreviewSummary, MasterDataImportPreviewSummary } from "@/types/domain";

const datasetConfigs = {
  hotels: {
    label: "Hotel",
    endpoint: "/hotels",
    emptyValue: {
      nama_hotel: "",
      kota: "Makkah",
      kategori_bintang: 5,
      alamat: "",
      jarak_ke_masjid: 0,
      harga_double: 0,
      harga_triple: 0,
      harga_quad: 0,
      mata_uang: "USD",
      valid_from: "",
      valid_until: "",
      status: "active",
      foto_url: "",
    },
    fields: [
      { name: "nama_hotel", label: "Nama Hotel", type: "text" },
      { name: "kota", label: "Kota", type: "select", options: ["Makkah", "Madinah"] },
      { name: "kategori_bintang", label: "Bintang", type: "select", options: [3, 4, 5] },
      { name: "alamat", label: "Alamat", type: "textarea" },
      { name: "jarak_ke_masjid", label: "Jarak ke Masjid (m)", type: "number" },
      { name: "harga_double", label: "Fare Double", type: "number" },
      { name: "harga_triple", label: "Fare Triple", type: "number" },
      { name: "harga_quad", label: "Fare Quad", type: "number" },
      { name: "mata_uang", label: "Mata Uang", type: "select", options: ["IDR", "USD", "SAR"] },
      { name: "valid_from", label: "Berlaku Dari", type: "date" },
      { name: "valid_until", label: "Berlaku Sampai", type: "date" },
      { name: "status", label: "Status", type: "select", options: ["active", "inactive"] },
      { name: "foto_url", label: "URL Foto", type: "text", nullable: true },
    ],
  },
  airlines: {
    label: "Maskapai",
    endpoint: "/airlines",
    emptyValue: { nama_maskapai: "", kode_maskapai: "", rute: "", harga_tiket: 0, mata_uang: "USD", bagasi: "", valid_from: "", valid_until: "", status: "active", logo_url: "", import_source_file: "" },
    fields: [
      { name: "nama_maskapai", label: "Nama Maskapai", type: "text" },
      { name: "kode_maskapai", label: "Kode", type: "text" },
      { name: "rute", label: "Rute", type: "text" },
      { name: "harga_tiket", label: "Harga Tiket", type: "number" },
      { name: "mata_uang", label: "Mata Uang", type: "select", options: ["IDR", "USD", "SAR"] },
      { name: "bagasi", label: "Bagasi", type: "text" },
      { name: "valid_from", label: "Berlaku Dari", type: "date" },
      { name: "valid_until", label: "Berlaku Sampai", type: "date" },
      { name: "status", label: "Status", type: "select", options: ["active", "inactive"] },
      { name: "logo_url", label: "URL Logo", type: "text", nullable: true },
      { name: "import_source_file", label: "Sumber Data", type: "text", nullable: true },
    ],
  },
  visas: {
    label: "Visa",
    endpoint: "/visas",
    emptyValue: { nama_visa: "", harga: 0, mata_uang: "USD", masa_berlaku: 30, valid_from: "", valid_until: "", status: "active", import_source_file: "" },
    fields: [
      { name: "nama_visa", label: "Nama Visa", type: "text" },
      { name: "harga", label: "Harga", type: "number" },
      { name: "mata_uang", label: "Mata Uang", type: "select", options: ["IDR", "USD", "SAR"] },
      { name: "masa_berlaku", label: "Masa Berlaku (hari)", type: "number" },
      { name: "valid_from", label: "Berlaku Dari", type: "date" },
      { name: "valid_until", label: "Berlaku Sampai", type: "date" },
      { name: "status", label: "Status", type: "select", options: ["active", "inactive"] },
      { name: "import_source_file", label: "Sumber Data", type: "text", nullable: true },
    ],
  },
  transports: {
    label: "Transportasi",
    endpoint: "/transports",
    emptyValue: { nama_layanan: "", kategori: "bus", harga: 0, mata_uang: "SAR", valid_from: "", valid_until: "", status: "active", import_source_file: "" },
    fields: [
      { name: "nama_layanan", label: "Nama Layanan", type: "text" },
      { name: "kategori", label: "Kategori", type: "select", options: ["bus", "kereta_haramain", "handling", "vip_service"] },
      { name: "harga", label: "Harga", type: "number" },
      { name: "mata_uang", label: "Mata Uang", type: "select", options: ["IDR", "USD", "SAR"] },
      { name: "valid_from", label: "Berlaku Dari", type: "date" },
      { name: "valid_until", label: "Berlaku Sampai", type: "date" },
      { name: "status", label: "Status", type: "select", options: ["active", "inactive"] },
      { name: "import_source_file", label: "Sumber Data", type: "text", nullable: true },
    ],
  },
  guides: {
    label: "Pembimbing",
    endpoint: "/guides",
    emptyValue: { nama: "", jabatan: "", jenis: "ustadz", fee: 0, mata_uang: "IDR", maksimal_jamaah: 45, valid_from: "", valid_until: "", status: "active", import_source_file: "" },
    fields: [
      { name: "nama", label: "Nama", type: "text" },
      { name: "jabatan", label: "Jabatan", type: "text" },
      { name: "jenis", label: "Jenis", type: "select", options: ["muthawwif", "tour_leader", "ustadz"] },
      { name: "fee", label: "Fee", type: "number" },
      { name: "mata_uang", label: "Mata Uang", type: "select", options: ["IDR", "USD", "SAR"] },
      { name: "maksimal_jamaah", label: "Maksimal Jamaah", type: "number" },
      { name: "valid_from", label: "Berlaku Dari", type: "date" },
      { name: "valid_until", label: "Berlaku Sampai", type: "date" },
      { name: "status", label: "Status", type: "select", options: ["active", "inactive"] },
      { name: "import_source_file", label: "Sumber Data", type: "text", nullable: true },
    ],
  },
  costComponents: {
    label: "Komponen Biaya",
    endpoint: "/cost-components",
    emptyValue: { nama: "", kategori: "per_jamaah", harga: 0, mata_uang: "IDR", is_default: false, valid_from: "", valid_until: "", status: "active", import_source_file: "" },
    fields: [
      { name: "nama", label: "Komponen", type: "text" },
      { name: "kategori", label: "Kategori", type: "select", options: ["per_jamaah", "per_grup"] },
      { name: "harga", label: "Harga", type: "number" },
      { name: "mata_uang", label: "Mata Uang", type: "select", options: ["IDR", "USD", "SAR"] },
      { name: "is_default", label: "Jadikan Default", type: "checkbox" },
      { name: "valid_from", label: "Berlaku Dari", type: "date" },
      { name: "valid_until", label: "Berlaku Sampai", type: "date" },
      { name: "status", label: "Status", type: "select", options: ["active", "inactive"] },
      { name: "import_source_file", label: "Sumber Data", type: "text", nullable: true },
    ],
  },
  agents: {
    label: "Agen",
    endpoint: "/agents",
    emptyValue: { nama_agen: "", fee_per_jamaah: 0, persentase: 0, status: "active" },
    fields: [
      { name: "nama_agen", label: "Nama Agen", type: "text" },
      { name: "fee_per_jamaah", label: "Fee per Jamaah", type: "number" },
      { name: "persentase", label: "Persentase", type: "number" },
      { name: "status", label: "Status", type: "select", options: ["active", "inactive"] },
    ],
  },
} as const;

type DatasetKey = keyof typeof datasetConfigs;
type FieldType = "text" | "number" | "textarea" | "select" | "checkbox" | "date";
type DatasetField = { name: string; label: string; type: FieldType; options?: Array<string | number>; nullable?: boolean };
type DatasetFormValue = Record<string, string | number | boolean | null>;

function cloneDefaultValue(key: DatasetKey): DatasetFormValue {
  return { ...datasetConfigs[key].emptyValue };
}

function toIdr(amount: number, currency: string, exchangeRate?: { usd_to_idr?: number; sar_to_idr?: number } | null) {
  if (currency === "USD") return amount * Number(exchangeRate?.usd_to_idr ?? 1);
  if (currency === "SAR") return amount * Number(exchangeRate?.sar_to_idr ?? 1);
  return amount;
}

function formatValidDate(value?: string | null) {
  if (!value) return "-";
  return value.slice(0, 10);
}

function actionLabel(action: "create" | "update" | "skip" | "error") {
  if (action === "create") return "Baru";
  if (action === "update") return "Update";
  if (action === "skip") return "Skip";
  return "Error";
}

function actionClassName(action: "create" | "update" | "skip" | "error") {
  if (action === "create") return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  if (action === "update") return "bg-amber-500/10 text-amber-700 dark:text-amber-300";
  if (action === "skip") return "bg-slate-500/10 text-slate-700 dark:text-slate-300";
  return "bg-rose-500/10 text-rose-700 dark:text-rose-300";
}

function normalizePayload(active: DatasetKey, values: DatasetFormValue) {
  const config = datasetConfigs[active];
  return config.fields.reduce<Record<string, unknown>>((payload, field) => {
    const rawValue = values[field.name];

    if (field.type === "checkbox") {
      payload[field.name] = Boolean(rawValue);
      return payload;
    }

    if (field.type === "number") {
      payload[field.name] = rawValue === "" || rawValue === null ? 0 : Number(rawValue);
      return payload;
    }

    if ((field as { nullable?: boolean }).nullable && (rawValue === "" || rawValue === null)) {
      payload[field.name] = null;
      return payload;
    }

    payload[field.name] = String(rawValue ?? "");
    return payload;
  }, {});
}

export default function MasterDataPage() {
  const queryClient = useQueryClient();
  const pushToast = useUiStore((state) => state.pushToast);
  const [active, setActive] = useState<DatasetKey>("hotels");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<DatasetFormValue>(cloneDefaultValue("hotels"));
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<HotelImportPreviewSummary | null>(null);
  const [masterImportPreview, setMasterImportPreview] = useState<MasterDataImportPreviewSummary | null>(null);
  const lookupsQuery = useQuery({ queryKey: ["lookups"], queryFn: getLookups });
  const activeConfig = datasetConfigs[active];
  const supportsOfficialImport = active !== "agents";

  useEffect(() => {
    setEditingId(null);
    setFormData(cloneDefaultValue(active));
    setImportFile(null);
    setImportPreview(null);
    setMasterImportPreview(null);
  }, [active]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = normalizePayload(active, formData);
      const config = datasetConfigs[active];
      if (editingId) {
        return updateEntity(config.endpoint, editingId, payload);
      }
      return createEntity(config.endpoint, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lookups"] });
      pushToast({ title: editingId ? "Data berhasil diperbarui" : "Data berhasil ditambahkan", description: `${datasetConfigs[active].label} telah tersimpan ke backend.`, variant: "success" });
      setEditingId(null);
      setFormData(cloneDefaultValue(active));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => deleteEntity(datasetConfigs[active].endpoint, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lookups"] });
      pushToast({ title: "Data berhasil dihapus", description: `${datasetConfigs[active].label} telah dihapus dari backend.`, variant: "info" });
      setEditingId(null);
      setFormData(cloneDefaultValue(active));
    },
  });

  const importMutation = useMutation({
    mutationFn: async () => {
      if (!importFile) {
        throw new Error("Pilih file xlsx, csv, atau pdf terlebih dahulu.");
      }
      return importHotelPrices(importFile);
    },
    onSuccess: (summary) => {
      queryClient.invalidateQueries({ queryKey: ["lookups"] });
      pushToast({
        title: "Import hotel selesai",
        description: `${summary.created} dibuat, ${summary.updated} diperbarui, ${summary.skipped} dilewati dari ${summary.total_rows} baris.`,
        variant: "success",
      });
      if (summary.errors.length > 0) {
        pushToast({
          title: "Sebagian baris gagal diimport",
          description: summary.errors.slice(0, 2).join(" | "),
          variant: "info",
        });
      }
      setImportFile(null);
      setImportPreview(null);
    },
  });

  const masterImportMutation = useMutation({
    mutationFn: async () => {
      if (!importFile) {
        throw new Error("Pilih file xlsx, csv, atau pdf terlebih dahulu.");
      }
      return importMasterData(datasetConfigs[active].endpoint, importFile);
    },
    onSuccess: (summary) => {
      queryClient.invalidateQueries({ queryKey: ["lookups"] });
      pushToast({
        title: `Import ${datasetConfigs[active].label.toLowerCase()} selesai`,
        description: `${summary.created} dibuat, ${summary.updated} diperbarui, ${summary.skipped} dilewati dari ${summary.total_rows} baris.`,
        variant: "success",
      });
      if (summary.errors.length > 0) {
        pushToast({
          title: "Sebagian baris gagal diimport",
          description: summary.errors.slice(0, 2).join(" | "),
          variant: "info",
        });
      }
      setImportFile(null);
      setMasterImportPreview(null);
    },
  });

  const previewMutation = useMutation({
    mutationFn: async () => {
      if (!importFile) {
        throw new Error("Pilih file xlsx, csv, atau pdf terlebih dahulu.");
      }
      return previewHotelImport(importFile);
    },
    onSuccess: (summary) => {
      setImportPreview(summary);
      pushToast({
        title: "Preview import siap",
        description: `${summary.total_rows} baris berhasil dibaca. Tinjau hasil sebelum import final.`,
        variant: "success",
      });
    },
  });

  const masterPreviewMutation = useMutation({
    mutationFn: async () => {
      if (!importFile) {
        throw new Error("Pilih file xlsx, csv, atau pdf terlebih dahulu.");
      }
      return previewMasterDataImport(datasetConfigs[active].endpoint, importFile);
    },
    onSuccess: (summary) => {
      setMasterImportPreview(summary);
      pushToast({
        title: "Preview import siap",
        description: `${summary.total_rows} baris berhasil dibaca. Tinjau hasil sebelum import final.`,
        variant: "success",
      });
    },
  });

  const templateMutation = useMutation({
    mutationFn: async (format: "csv" | "xlsx" | "pdf") => downloadHotelImportTemplate(format),
    onSuccess: (_, format) => {
      pushToast({
        title: "Template berhasil diunduh",
        description: `Template import hotel format ${format.toUpperCase()} siap dibagikan ke tim operasional.`,
        variant: "success",
      });
    },
  });

  const masterTemplateMutation = useMutation({
    mutationFn: async (format: "csv" | "xlsx" | "pdf") => downloadMasterDataImportTemplate(datasetConfigs[active].endpoint, format),
    onSuccess: (_, format) => {
      pushToast({
        title: "Template berhasil diunduh",
        description: `Template import ${datasetConfigs[active].label.toLowerCase()} format ${format.toUpperCase()} siap dibagikan ke tim operasional.`,
        variant: "success",
      });
    },
  });

  const datasets = lookupsQuery.data;
  const currentRecords = datasets ? datasets[active] : [];
  const exchangeRate = datasets?.exchangeRate;

  const handleEdit = (row: Record<string, unknown>) => {
    setEditingId(Number(row.id));
    setFormData({ ...cloneDefaultValue(active), ...row } as DatasetFormValue);
  };

  const handleDelete = (id: number) => {
    if (!window.confirm("Yakin ingin menghapus data ini?")) {
      return;
    }
    deleteMutation.mutate(id);
  };

  const columns = useMemo<ColumnDef<any>[]>(() => {
    const baseColumns: ColumnDef<any>[] = (() => {
      switch (active) {
        case "hotels":
          return [
            { header: "Nama Hotel", accessorKey: "nama_hotel" },
            { header: "Kota", accessorKey: "kota" },
            { header: "Bintang", accessorKey: "kategori_bintang" },
            { header: "Double", cell: ({ row }) => formatCurrency(toIdr(Number(row.original.harga_double), row.original.mata_uang, exchangeRate)) },
            { header: "Triple", cell: ({ row }) => formatCurrency(toIdr(Number(row.original.harga_triple), row.original.mata_uang, exchangeRate)) },
            { header: "Quad", cell: ({ row }) => formatCurrency(toIdr(Number(row.original.harga_quad), row.original.mata_uang, exchangeRate)) },
            { header: "Valid Sampai", cell: ({ row }) => formatValidDate(row.original.valid_until) },
          ];
        case "airlines":
          return [
            { header: "Maskapai", accessorKey: "nama_maskapai" },
            { header: "Kode", accessorKey: "kode_maskapai" },
            { header: "Rute", accessorKey: "rute" },
            { header: "Harga", cell: ({ row }) => formatCurrency(toIdr(Number(row.original.harga_tiket), row.original.mata_uang, exchangeRate)) },
            { header: "Valid Sampai", cell: ({ row }) => formatValidDate(row.original.valid_until) },
          ];
        case "visas":
          return [
            { header: "Visa", accessorKey: "nama_visa" },
            { header: "Masa Berlaku", accessorKey: "masa_berlaku" },
            { header: "Harga", cell: ({ row }) => formatCurrency(toIdr(Number(row.original.harga), row.original.mata_uang, exchangeRate)) },
            { header: "Valid Sampai", cell: ({ row }) => formatValidDate(row.original.valid_until) },
          ];
        case "transports":
          return [
            { header: "Layanan", accessorKey: "nama_layanan" },
            { header: "Kategori", accessorKey: "kategori" },
            { header: "Harga", cell: ({ row }) => formatCurrency(toIdr(Number(row.original.harga), row.original.mata_uang, exchangeRate)) },
            { header: "Valid Sampai", cell: ({ row }) => formatValidDate(row.original.valid_until) },
          ];
        case "guides":
          return [
            { header: "Nama", accessorKey: "nama" },
            { header: "Jenis", accessorKey: "jenis" },
            { header: "Fee", cell: ({ row }) => formatCurrency(toIdr(Number(row.original.fee), row.original.mata_uang, exchangeRate)) },
            { header: "Max Jamaah", accessorKey: "maksimal_jamaah" },
            { header: "Valid Sampai", cell: ({ row }) => formatValidDate(row.original.valid_until) },
          ];
        case "costComponents":
          return [
            { header: "Komponen", accessorKey: "nama" },
            { header: "Kategori", accessorKey: "kategori" },
            { header: "Harga", cell: ({ row }) => formatCurrency(toIdr(Number(row.original.harga), row.original.mata_uang, exchangeRate)) },
            { header: "Default", cell: ({ row }) => (row.original.is_default ? "Ya" : "Tidak") },
            { header: "Valid Sampai", cell: ({ row }) => formatValidDate(row.original.valid_until) },
          ];
        default:
          return [
            { header: "Agen", accessorKey: "nama_agen" },
            { header: "Fee/Jamaah", cell: ({ row }) => formatCurrency(Number(row.original.fee_per_jamaah)) },
            { header: "Persentase", cell: ({ row }) => `${row.original.persentase}%` },
            { header: "Status", accessorKey: "status" },
          ];
      }
    })();

    return [
      ...baseColumns,
      {
        header: "Aksi",
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button variant="ghost" className="h-9 px-3" onClick={() => handleEdit(row.original)}>
              <Pencil className="h-4 w-4" /> Edit
            </Button>
            <Button variant="ghost" className="h-9 px-3 text-rose-500 hover:bg-rose-500/10 hover:text-rose-500" onClick={() => handleDelete(Number(row.original.id))}>
              <Trash2 className="h-4 w-4" /> Hapus
            </Button>
          </div>
        ),
      },
    ];
  }, [active, exchangeRate]);

  if (lookupsQuery.isLoading) {
    return <div className="flex min-h-[40vh] items-center justify-center"><LoaderCircle className="h-8 w-8 animate-spin text-gold-500" /></div>;
  }

  if (!datasets) {
    return <Card>Master data belum berhasil diambil dari backend.</Card>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        {(Object.keys(datasetConfigs) as DatasetKey[]).map((key) => (
          <Button key={key} variant={active === key ? "primary" : "secondary"} onClick={() => setActive(key)}>
            {datasetConfigs[key].label}
          </Button>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-serif text-xl">Form {datasetConfigs[active].label}</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">{editingId ? "Edit data yang sudah ada lalu simpan perubahan ke backend." : "Tambahkan record baru ke master data aktif."}</p>
            </div>
            <Button variant="ghost" className="px-3" onClick={() => { setEditingId(null); setFormData(cloneDefaultValue(active)); }}>
              <RotateCcw className="h-4 w-4" /> Reset
            </Button>
          </div>

          {active === "hotels" ? (
            <div className="mt-5 rounded-3xl border border-dashed border-gold-500/40 bg-gold-500/5 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium">Import Harga Hotel Musiman</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Unduh template resmi terlebih dahulu, isi format baku musim berjalan, lalu upload file `xlsx`, `csv`, atau `pdf` dengan header yang sama.</p>
                </div>
                <FileUp className="h-5 w-5 text-gold-600 dark:text-gold-300" />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {(["csv", "xlsx", "pdf"] as const).map((format) => (
                  <Button key={format} variant="secondary" className="px-3" onClick={() => templateMutation.mutate(format)} disabled={templateMutation.isPending}>
                    {templateMutation.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    Template {format.toUpperCase()}
                  </Button>
                ))}
              </div>
              <div className="mt-4 rounded-2xl border border-slate-200/70 bg-white/60 p-3 text-xs text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                Header resmi: `nama_hotel`, `kota`, `kategori_bintang`, `alamat`, `jarak_ke_masjid`, `harga_double`, `harga_triple`, `harga_quad`, `mata_uang`, `valid_from`, `valid_until`, `status`, `foto_url`.
                Format tanggal wajib `YYYY-MM-DD`.
              </div>
              <div className="mt-4 flex flex-col gap-3">
                <input
                  type="file"
                  accept=".xlsx,.csv,.pdf"
                  onChange={(event) => {
                    setImportFile(event.target.files?.[0] ?? null);
                    setImportPreview(null);
                  }}
                  className="w-full rounded-2xl border border-slate-200 bg-transparent px-4 py-3 text-sm dark:border-white/10"
                />
                <div className="flex flex-wrap gap-3">
                  <Button variant="secondary" onClick={() => previewMutation.mutate()} disabled={!importFile || previewMutation.isPending || importMutation.isPending}>
                    {previewMutation.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                    Preview Import
                  </Button>
                  <Button onClick={() => importMutation.mutate()} disabled={!importFile || !importPreview || importMutation.isPending || previewMutation.isPending}>
                    {importMutation.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
                    Import Harga Hotel
                  </Button>
                </div>
              </div>

              {importPreview ? (
                <div className="mt-5 rounded-2xl border border-slate-200/70 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">Preview Hasil Import</p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                        File `{importPreview.source_file}` berisi {importPreview.total_rows} baris.
                      </p>
                    </div>
                    <Button variant="ghost" className="px-3" onClick={() => setImportPreview(null)}>
                      Tutup Preview
                    </Button>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-4">
                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-sm">
                      <p className="text-slate-500 dark:text-slate-300">Baru</p>
                      <p className="mt-1 text-xl font-semibold">{importPreview.created}</p>
                    </div>
                    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3 text-sm">
                      <p className="text-slate-500 dark:text-slate-300">Update</p>
                      <p className="mt-1 text-xl font-semibold">{importPreview.updated}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-500/20 bg-slate-500/5 p-3 text-sm">
                      <p className="text-slate-500 dark:text-slate-300">Skip</p>
                      <p className="mt-1 text-xl font-semibold">{importPreview.skipped}</p>
                    </div>
                    <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-3 text-sm">
                      <p className="text-slate-500 dark:text-slate-300">Error</p>
                      <p className="mt-1 text-xl font-semibold">{importPreview.errors.length}</p>
                    </div>
                  </div>

                  {importPreview.errors.length > 0 ? (
                    <div className="mt-4 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-3 text-sm text-rose-700 dark:text-rose-300">
                      {importPreview.errors.slice(0, 5).map((error) => (
                        <p key={error}>{error}</p>
                      ))}
                    </div>
                  ) : null}

                  <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 dark:border-white/10">
                    <table className="min-w-full text-sm">
                      <thead className="bg-slate-50 dark:bg-white/5">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium">Baris</th>
                          <th className="px-3 py-2 text-left font-medium">Status</th>
                          <th className="px-3 py-2 text-left font-medium">Hotel</th>
                          <th className="px-3 py-2 text-left font-medium">Kota</th>
                          <th className="px-3 py-2 text-left font-medium">Fare</th>
                          <th className="px-3 py-2 text-left font-medium">Periode</th>
                          <th className="px-3 py-2 text-left font-medium">Catatan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importPreview.preview_rows.map((row) => (
                          <tr key={`${row.row_number}-${row.action}`} className="border-t border-slate-200 dark:border-white/10">
                            <td className="px-3 py-2">{row.row_number}</td>
                            <td className="px-3 py-2">
                              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${actionClassName(row.action)}`}>
                                {actionLabel(row.action)}
                              </span>
                            </td>
                            <td className="px-3 py-2">{row.nama_hotel ?? "-"}</td>
                            <td className="px-3 py-2">{row.kota ?? "-"}</td>
                            <td className="px-3 py-2">
                              {row.harga_double !== null && row.harga_double !== undefined
                                ? `D ${row.harga_double} | T ${row.harga_triple} | Q ${row.harga_quad}`
                                : "-"}
                            </td>
                            <td className="px-3 py-2">
                              {row.valid_from && row.valid_until ? `${formatValidDate(row.valid_from)} s/d ${formatValidDate(row.valid_until)}` : "-"}
                            </td>
                            <td className="px-3 py-2 text-slate-500 dark:text-slate-300">{row.message}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}
            </div>
          ) : supportsOfficialImport ? (
            <div className="mt-5 rounded-3xl border border-dashed border-brand-500/30 bg-brand-500/5 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium">Import Resmi {activeConfig.label}</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Unduh template resmi, isi data musiman sesuai header baku, lalu lakukan preview sebelum import final.</p>
                </div>
                <FileUp className="h-5 w-5 text-brand-600 dark:text-brand-300" />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {(["csv", "xlsx", "pdf"] as const).map((format) => (
                  <Button key={format} variant="secondary" className="px-3" onClick={() => masterTemplateMutation.mutate(format)} disabled={masterTemplateMutation.isPending}>
                    {masterTemplateMutation.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    Template {format.toUpperCase()}
                  </Button>
                ))}
              </div>
              <div className="mt-4 rounded-2xl border border-slate-200/70 bg-white/60 p-3 text-xs text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                Template mengikuti field resmi modul {activeConfig.label.toLowerCase()}. Format tanggal wajib `YYYY-MM-DD`, mata uang hanya `IDR`, `USD`, atau `SAR`, lalu lakukan preview sebelum import final.
              </div>
              <div className="mt-4 flex flex-col gap-3">
                <input
                  type="file"
                  accept=".xlsx,.csv,.pdf"
                  onChange={(event) => {
                    setImportFile(event.target.files?.[0] ?? null);
                    setMasterImportPreview(null);
                  }}
                  className="w-full rounded-2xl border border-slate-200 bg-transparent px-4 py-3 text-sm dark:border-white/10"
                />
                <div className="flex flex-wrap gap-3">
                  <Button variant="secondary" onClick={() => masterPreviewMutation.mutate()} disabled={!importFile || masterPreviewMutation.isPending || masterImportMutation.isPending}>
                    {masterPreviewMutation.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                    Preview Import
                  </Button>
                  <Button onClick={() => masterImportMutation.mutate()} disabled={!importFile || !masterImportPreview || masterImportMutation.isPending || masterPreviewMutation.isPending}>
                    {masterImportMutation.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
                    Import {activeConfig.label}
                  </Button>
                </div>
              </div>

              {masterImportPreview ? (
                <div className="mt-5 rounded-2xl border border-slate-200/70 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">Preview Hasil Import</p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                        File `{masterImportPreview.source_file}` berisi {masterImportPreview.total_rows} baris.
                      </p>
                    </div>
                    <Button variant="ghost" className="px-3" onClick={() => setMasterImportPreview(null)}>
                      Tutup Preview
                    </Button>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-4">
                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-sm">
                      <p className="text-slate-500 dark:text-slate-300">Baru</p>
                      <p className="mt-1 text-xl font-semibold">{masterImportPreview.created}</p>
                    </div>
                    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3 text-sm">
                      <p className="text-slate-500 dark:text-slate-300">Update</p>
                      <p className="mt-1 text-xl font-semibold">{masterImportPreview.updated}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-500/20 bg-slate-500/5 p-3 text-sm">
                      <p className="text-slate-500 dark:text-slate-300">Skip</p>
                      <p className="mt-1 text-xl font-semibold">{masterImportPreview.skipped}</p>
                    </div>
                    <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-3 text-sm">
                      <p className="text-slate-500 dark:text-slate-300">Error</p>
                      <p className="mt-1 text-xl font-semibold">{masterImportPreview.errors.length}</p>
                    </div>
                  </div>

                  {masterImportPreview.errors.length > 0 ? (
                    <div className="mt-4 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-3 text-sm text-rose-700 dark:text-rose-300">
                      {masterImportPreview.errors.slice(0, 5).map((error) => (
                        <p key={error}>{error}</p>
                      ))}
                    </div>
                  ) : null}

                  <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 dark:border-white/10">
                    <table className="min-w-full text-sm">
                      <thead className="bg-slate-50 dark:bg-white/5">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium">Baris</th>
                          <th className="px-3 py-2 text-left font-medium">Status</th>
                          <th className="px-3 py-2 text-left font-medium">Record</th>
                          <th className="px-3 py-2 text-left font-medium">Info</th>
                          <th className="px-3 py-2 text-left font-medium">Nominal</th>
                          <th className="px-3 py-2 text-left font-medium">Periode</th>
                          <th className="px-3 py-2 text-left font-medium">Catatan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {masterImportPreview.preview_rows.map((row) => (
                          <tr key={`${row.row_number}-${row.action}`} className="border-t border-slate-200 dark:border-white/10">
                            <td className="px-3 py-2">{row.row_number}</td>
                            <td className="px-3 py-2">
                              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${actionClassName(row.action)}`}>
                                {actionLabel(row.action)}
                              </span>
                            </td>
                            <td className="px-3 py-2">{row.record_name ?? "-"}</td>
                            <td className="px-3 py-2">{row.record_meta ?? "-"}</td>
                            <td className="px-3 py-2">
                              {row.amount !== null && row.amount !== undefined
                                ? `${row.amount_label}: ${row.currency ? formatCurrency(toIdr(Number(row.amount), row.currency, exchangeRate)) : row.amount}`
                                : "-"}
                            </td>
                            <td className="px-3 py-2">
                              {row.valid_from && row.valid_until ? `${formatValidDate(row.valid_from)} s/d ${formatValidDate(row.valid_until)}` : "-"}
                            </td>
                            <td className="px-3 py-2 text-slate-500 dark:text-slate-300">{row.message}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="mt-5 space-y-4">
            {(datasetConfigs[active].fields as readonly DatasetField[]).map((field) => (
              <label key={field.name} className="block space-y-2 text-sm">
                <span>{field.label}</span>
                {field.type === "select" ? (
                  <select
                    className="w-full rounded-2xl border border-slate-200 bg-transparent px-4 py-3 dark:border-white/10"
                    value={String(formData[field.name] ?? "")}
                    onChange={(event) => setFormData((state) => ({ ...state, [field.name]: event.target.value }))}
                  >
                    {field.options?.map((option) => (
                      <option key={String(option)} value={String(option)}>{String(option)}</option>
                    ))}
                  </select>
                ) : field.type === "textarea" ? (
                  <textarea
                    className="min-h-24 w-full rounded-2xl border border-slate-200 bg-transparent px-4 py-3 dark:border-white/10"
                    value={String(formData[field.name] ?? "")}
                    onChange={(event) => setFormData((state) => ({ ...state, [field.name]: event.target.value }))}
                  />
                ) : field.type === "checkbox" ? (
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 dark:border-white/10">
                    <input
                      type="checkbox"
                      checked={Boolean(formData[field.name])}
                      onChange={(event) => setFormData((state) => ({ ...state, [field.name]: event.target.checked }))}
                    />
                    <span>Aktifkan opsi ini</span>
                  </div>
                ) : (
                  <input
                    type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
                    className="w-full rounded-2xl border border-slate-200 bg-transparent px-4 py-3 dark:border-white/10"
                    value={String(formData[field.name] ?? "")}
                    onChange={(event) => setFormData((state) => ({ ...state, [field.name]: event.target.value }))}
                  />
                )}
              </label>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {editingId ? "Update Data" : "Tambah Data"}
            </Button>
            {editingId ? <Button variant="secondary" onClick={() => { setEditingId(null); setFormData(cloneDefaultValue(active)); }}>Batal Edit</Button> : null}
          </div>
        </Card>

        <DataTable
          columns={columns}
          data={currentRecords}
          title="Master Data"
          subtitle="Kelola seluruh master data inti secara langsung ke backend Laravel, termasuk import harga hotel berdasarkan musim dan masa berlaku tarif."
        />
      </div>
    </div>
  );
}
