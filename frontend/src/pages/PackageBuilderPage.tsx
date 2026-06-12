import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LoaderCircle, Pencil, Save, Trash2, X } from "lucide-react";
import { packageTemplates } from "@/data/demo";
import {
  createCostingSnapshot,
  createPackage,
  deleteCostingSnapshot,
  duplicatePackage,
  getCostingSnapshots,
  getLookups,
  getPackage,
  getPackages,
  publishPackage,
  updateCostingSnapshot,
  updatePackage,
} from "@/lib/api";
import { calculateDraftCosting } from "@/lib/costing";
import { mapPackageToDraft } from "@/lib/mappers";
import { formatCurrency } from "@/lib/format";
import { useAppStore } from "@/store/useAppStore";
import { useUiStore } from "@/store/useUiStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ItineraryBoard } from "@/components/packages/ItineraryBoard";
import type { CostingSnapshot, PackageDraft } from "@/types/domain";

const schema = z.object({
  nama_paket: z.string().min(3),
  tanggal_berangkat: z.string().min(1, "Tanggal berangkat wajib diisi"),
  durasi_hari: z.coerce.number().min(1),
  target_jamaah: z.coerce.number().min(1),
  hotel_makkah_id: z.coerce.number(),
  hotel_madinah_id: z.coerce.number(),
  airline_id: z.coerce.number(),
  visa_id: z.coerce.number(),
  default_margin_percent: z.coerce.number().min(0),
  target_profit_total: z.coerce.number().min(0),
  makkah_nights: z.coerce.number().min(1),
  madinah_nights: z.coerce.number().min(1),
  room_occupancy: z.coerce.number().refine((value) => [2, 3, 4].includes(value), { message: "Room occupancy harus 2, 3, atau 4" }),
});

type FormValues = z.infer<typeof schema>;
type AdviceSeverity = "critical" | "warning" | "success";
type PackageListTab = "published" | "draft" | "all";

interface SeasonalRecord {
  id: number;
  valid_from: string;
  valid_until: string;
  status: "active" | "inactive";
}

interface AdviceItem {
  title: string;
  description: string;
  severity: AdviceSeverity;
}

interface SeasonalSelection {
  label: string;
  item: SeasonalRecord;
}

interface CoreRecommendation {
  field: "hotel_makkah_id" | "hotel_madinah_id" | "airline_id" | "visa_id";
  label: string;
  recommendedId: number;
  recommendedName: string;
}

type BuilderTab = "package" | "itinerary";

function roomLabel(occupancy: number) {
  if (occupancy === 2) return "Double";
  if (occupancy === 3) return "Triple";
  return "Quad";
}

function formatValidDate(value?: string | null) {
  if (!value) return "-";
  return value.slice(0, 10);
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function normalizeDate(value?: string | null) {
  return value ? value.slice(0, 10) : "";
}

function addDays(date: string, days: number) {
  if (!date) return "";

  const value = new Date(`${date}T00:00:00`);
  value.setDate(value.getDate() + days);

  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function resolveTripEndDate(departureDate: string, durationDays: number) {
  if (!departureDate || durationDays < 1) return "";
  return addDays(departureDate, durationDays - 1);
}

function dateDiffInDays(startDate: string, endDate: string) {
  if (!startDate || !endDate) return 0;

  const start = new Date(`${startDate}T00:00:00`).getTime();
  const end = new Date(`${endDate}T00:00:00`).getTime();

  return Math.round((end - start) / 86400000);
}

function isOperationallyValid(item: { status: "active" | "inactive"; valid_from: string; valid_until: string }, departureDate: string, tripEndDate: string) {
  if (item.status !== "active") return false;
  if (!departureDate || !tripEndDate) return true;

  const validFrom = normalizeDate(item.valid_from);
  const validUntil = normalizeDate(item.valid_until);

  return validFrom <= departureDate && validUntil >= tripEndDate;
}

function convertToIdr(amount: number, currency: string, exchangeRate?: { usd_to_idr?: number; sar_to_idr?: number } | null) {
  if (currency === "USD") return amount * Number(exchangeRate?.usd_to_idr ?? 1);
  if (currency === "SAR") return amount * Number(exchangeRate?.sar_to_idr ?? 1);
  return amount;
}

function resolveHotelFare(occupancy: number, hotel: { harga_double: number; harga_triple: number; harga_quad: number }) {
  if (occupancy === 2) return Number(hotel.harga_double);
  if (occupancy === 3) return Number(hotel.harga_triple);
  return Number(hotel.harga_quad);
}

function pickBestCoverageOption<T extends SeasonalRecord>(items: T[]) {
  return [...items].sort((left, right) => {
    const validityDiff = normalizeDate(right.valid_until).localeCompare(normalizeDate(left.valid_until));

    if (validityDiff !== 0) {
      return validityDiff;
    }

    return normalizeDate(left.valid_from).localeCompare(normalizeDate(right.valid_from));
  })[0];
}

function adviceTone(severity: AdviceSeverity) {
  if (severity === "critical") {
    return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200";
  }

  if (severity === "warning") {
    return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200";
  }

  return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200";
}

function buildDefaultItineraryDay(dayNumber: number) {
  return {
    hari_ke: dayNumber,
    judul: `Hari ${dayNumber}`,
    deskripsi: `Agenda operasional untuk hari ${dayNumber}.`,
  };
}

function syncItineraryWithDuration(items: PackageDraft["itinerary_days"], durationDays: number) {
  if (durationDays < 1) return [];

  return Array.from({ length: durationDays }, (_, index) => {
    const dayNumber = index + 1;
    const existing = items[index];

    if (!existing) {
      return buildDefaultItineraryDay(dayNumber);
    }

    return {
      ...existing,
      hari_ke: dayNumber,
      judul: existing.judul?.trim() ? existing.judul : `Hari ${dayNumber}`,
      deskripsi: existing.deskripsi?.trim() ? existing.deskripsi : `Agenda operasional untuk hari ${dayNumber}.`,
    };
  });
}

export default function PackageBuilderPage() {
  const queryClient = useQueryClient();
  const pushToast = useUiStore((state) => state.pushToast);
  const [activeTab, setActiveTab] = useState<BuilderTab>("package");
  const [packageListTab, setPackageListTab] = useState<PackageListTab>("published");
  const [snapshotForm, setSnapshotForm] = useState({ label: "", notes: "" });
  const [editingSnapshotId, setEditingSnapshotId] = useState<number | null>(null);
  const selectedPackageId = useAppStore((state) => state.selectedPackageId);
  const setSelectedPackageId = useAppStore((state) => state.setSelectedPackageId);
  const draft = useAppStore((state) => state.packageDraft);
  const setPackageDraft = useAppStore((state) => state.setPackageDraft);
  const updateDraft = useAppStore((state) => state.updateDraft);
  const setItinerary = useAppStore((state) => state.setItinerary);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: draft ?? undefined,
  });

  const lookupsQuery = useQuery({ queryKey: ["lookups"], queryFn: getLookups });
  const packagesQuery = useQuery({ queryKey: ["packages"], queryFn: getPackages });
  const packageQuery = useQuery({
    queryKey: ["package", selectedPackageId],
    queryFn: () => getPackage(selectedPackageId as number),
    enabled: Boolean(selectedPackageId),
  });
  const snapshotsQuery = useQuery({
    queryKey: ["package-snapshots", selectedPackageId],
    queryFn: () => getCostingSnapshots(selectedPackageId as number),
    enabled: Boolean(selectedPackageId),
  });

  useEffect(() => {
    if (!selectedPackageId && packagesQuery.data?.length) {
      setSelectedPackageId(packagesQuery.data[0].id);
    }
  }, [packagesQuery.data, selectedPackageId, setSelectedPackageId]);

  useEffect(() => {
    if (packageQuery.data) {
      const mapped = mapPackageToDraft(packageQuery.data);
      setPackageDraft(mapped);
      form.reset(mapped);
    }
  }, [form, packageQuery.data, setPackageDraft]);

  const values = form.watch();
  const packageRecords = packagesQuery.data ?? [];
  const publishedPackages = useMemo(() => packageRecords.filter((item) => item.status === "published"), [packageRecords]);
  const draftPackages = useMemo(() => packageRecords.filter((item) => item.status === "draft"), [packageRecords]);
  const visiblePackageList = useMemo(() => {
    if (packageListTab === "published") return publishedPackages;
    if (packageListTab === "draft") return draftPackages;
    return packageRecords;
  }, [draftPackages, packageListTab, packageRecords, publishedPackages]);
  const lookups = lookupsQuery.data;
  const departureDate = normalizeDate(values.tanggal_berangkat ?? draft?.tanggal_berangkat);
  const tripDurationDays = Number(values.durasi_hari ?? draft?.durasi_hari ?? 0);
  const tripEndDate = resolveTripEndDate(departureDate, tripDurationDays);
  const hotels = lookups?.hotels ?? [];
  const airlines = lookups?.airlines ?? [];
  const visas = lookups?.visas ?? [];
  const transports = lookups?.transports ?? [];
  const guides = lookups?.guides ?? [];
  const costComponents = lookups?.costComponents ?? [];
  const agents = lookups?.agents ?? [];
  const filteredHotels = hotels.filter((item) => isOperationallyValid(item, departureDate, tripEndDate));
  const filteredHotelMakkahOptions = filteredHotels.filter((item) => item.kota === "Makkah");
  const filteredHotelMadinahOptions = filteredHotels.filter((item) => item.kota === "Madinah");
  const filteredAirlines = airlines.filter((item) => isOperationallyValid(item, departureDate, tripEndDate));
  const filteredVisas = visas.filter((item) => isOperationallyValid(item, departureDate, tripEndDate));
  const filteredTransports = transports.filter((item) => isOperationallyValid(item, departureDate, tripEndDate));
  const filteredGuides = guides.filter((item) => isOperationallyValid(item, departureDate, tripEndDate));
  const filteredCostComponents = costComponents.filter((item) => isOperationallyValid(item, departureDate, tripEndDate));
  const scopedLookups = useMemo(() => {
    if (!lookups) return null;

    return {
      ...lookups,
      hotels: filteredHotels,
      airlines: filteredAirlines,
      visas: filteredVisas,
      transports: filteredTransports,
      guides: filteredGuides,
      costComponents: filteredCostComponents,
    };
  }, [filteredAirlines, filteredCostComponents, filteredGuides, filteredHotels, filteredTransports, filteredVisas, lookups]);
  const liveDraft = draft ? ({ ...draft, ...values } as PackageDraft) : null;
  const localCosting = useMemo(() => {
    if (!liveDraft || !scopedLookups) return null;
    return calculateDraftCosting(liveDraft, scopedLookups);
  }, [liveDraft, scopedLookups]);

  useEffect(() => {
    if (!draft || !lookups) return;

    const currentDraft = { ...draft, ...form.getValues() } as PackageDraft;
    const nextPatch: Partial<PackageDraft> = {};

    const syncSingleSelection = (
      key: "hotel_makkah_id" | "hotel_madinah_id" | "airline_id" | "visa_id",
      options: Array<{ id: number }>
    ) => {
      const currentId = Number(currentDraft[key]);

      if (!currentId || options.some((item) => item.id === currentId) || !options.length) {
        return;
      }

      nextPatch[key] = options[0].id;
      form.setValue(key, options[0].id);
    };

    syncSingleSelection("hotel_makkah_id", filteredHotelMakkahOptions);
    syncSingleSelection("hotel_madinah_id", filteredHotelMadinahOptions);
    syncSingleSelection("airline_id", filteredAirlines);
    syncSingleSelection("visa_id", filteredVisas);

    const nextTransportIds = currentDraft.transport_ids.filter((id) => filteredTransports.some((item) => item.id === id));
    const nextGuideIds = currentDraft.guide_ids.filter((id) => filteredGuides.some((item) => item.id === id));
    const nextCostComponentIds = currentDraft.cost_component_ids.filter((id) => filteredCostComponents.some((item) => item.id === id));

    if (nextTransportIds.length !== currentDraft.transport_ids.length) {
      nextPatch.transport_ids = nextTransportIds;
    }

    if (nextGuideIds.length !== currentDraft.guide_ids.length) {
      nextPatch.guide_ids = nextGuideIds;
    }

    if (nextCostComponentIds.length !== currentDraft.cost_component_ids.length) {
      nextPatch.cost_component_ids = nextCostComponentIds;
    }

    if (Object.keys(nextPatch).length > 0) {
      updateDraft(nextPatch);
    }
  }, [
    draft,
    filteredAirlines,
    filteredCostComponents,
    filteredGuides,
    filteredHotelMadinahOptions,
    filteredHotelMakkahOptions,
    filteredTransports,
    filteredVisas,
    form,
    lookups,
    updateDraft,
  ]);

  useEffect(() => {
    if (!draft) return;

    const syncedItinerary = syncItineraryWithDuration(draft.itinerary_days, tripDurationDays);

    if (syncedItinerary.length !== draft.itinerary_days.length) {
      setItinerary(syncedItinerary);
      return;
    }

    const hasDiff = syncedItinerary.some((item, index) => {
      const current = draft.itinerary_days[index];

      return !current
        || current.hari_ke !== item.hari_ke
        || current.judul !== item.judul
        || current.deskripsi !== item.deskripsi;
    });

    if (hasDiff) {
      setItinerary(syncedItinerary);
    }
  }, [draft, setItinerary, tripDurationDays]);

  const saveMutation = useMutation({
    mutationFn: async (payload: PackageDraft) => {
      if (selectedPackageId) {
        return updatePackage(selectedPackageId, payload);
      }
      return createPackage(payload);
    },
    onSuccess: (resource) => {
      queryClient.invalidateQueries({ queryKey: ["packages"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      setSelectedPackageId(resource.id);
      setPackageDraft(mapPackageToDraft(resource));
      pushToast({ title: "Draft paket tersimpan", description: `${resource.nama_paket} telah disimpan ke backend.`, variant: "success" });
    },
  });

  const publishMutation = useMutation({
    mutationFn: async () => publishPackage(selectedPackageId as number),
    onSuccess: (resource) => {
      queryClient.invalidateQueries({ queryKey: ["package", selectedPackageId] });
      queryClient.invalidateQueries({ queryKey: ["packages"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      setPackageDraft(mapPackageToDraft(resource));
      pushToast({ title: "Paket dipublish", description: `${resource.nama_paket} sekarang berstatus published.`, variant: "success" });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async () => duplicatePackage(selectedPackageId as number),
    onSuccess: (resource) => {
      queryClient.invalidateQueries({ queryKey: ["packages"] });
      setSelectedPackageId(resource.id);
      pushToast({ title: "Paket diduplikasi", description: `${resource.nama_paket} siap diedit sebagai paket baru.`, variant: "info" });
    },
  });
  const createSnapshotMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPackageId) {
        throw new Error("Simpan draft paket terlebih dahulu sebelum membuat snapshot costing.");
      }

      return createCostingSnapshot(selectedPackageId, {
        label: snapshotForm.label.trim() || undefined,
        notes: snapshotForm.notes.trim() || undefined,
        jamaah: Number(values.target_jamaah ?? draft?.target_jamaah ?? 0) || undefined,
        margin_percent: Number(values.default_margin_percent ?? draft?.default_margin_percent ?? 0),
        target_profit_total: Number(values.target_profit_total ?? draft?.target_profit_total ?? 0),
      });
    },
    onSuccess: (snapshot) => {
      queryClient.invalidateQueries({ queryKey: ["package-snapshots", selectedPackageId] });
      setSnapshotForm({ label: "", notes: "" });
      pushToast({ title: "Snapshot costing tersimpan", description: `${snapshot.label ?? "Snapshot manual"} berhasil dibuat.`, variant: "success" });
    },
    onError: (error) => {
      pushToast({ title: "Snapshot gagal dibuat", description: error instanceof Error ? error.message : "Terjadi kendala saat membuat snapshot costing.", variant: "error" });
    },
  });
  const updateSnapshotMutation = useMutation({
    mutationFn: async (payload: { snapshotId: number; label: string; notes: string }) => {
      if (!selectedPackageId) {
        throw new Error("Paket belum dipilih.");
      }

      return updateCostingSnapshot(selectedPackageId, payload.snapshotId, {
        label: payload.label,
        notes: payload.notes || undefined,
      });
    },
    onSuccess: (snapshot) => {
      queryClient.invalidateQueries({ queryKey: ["package-snapshots", selectedPackageId] });
      setEditingSnapshotId(null);
      setSnapshotForm({ label: "", notes: "" });
      pushToast({ title: "Snapshot costing diperbarui", description: `${snapshot.label ?? "Snapshot manual"} berhasil diperbarui.`, variant: "success" });
    },
  });
  const deleteSnapshotMutation = useMutation({
    mutationFn: async (snapshotId: number) => {
      if (!selectedPackageId) {
        throw new Error("Paket belum dipilih.");
      }

      return deleteCostingSnapshot(selectedPackageId, snapshotId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["package-snapshots", selectedPackageId] });
      if (editingSnapshotId) {
        setEditingSnapshotId(null);
        setSnapshotForm({ label: "", notes: "" });
      }
      pushToast({ title: "Snapshot costing dihapus", description: "Versi costing manual berhasil dihapus.", variant: "success" });
    },
  });

  useEffect(() => {
    setEditingSnapshotId(null);
    setSnapshotForm({ label: "", notes: "" });
  }, [selectedPackageId]);

  const startEditingSnapshot = (snapshot: CostingSnapshot) => {
    setEditingSnapshotId(snapshot.id);
    setSnapshotForm({
      label: snapshot.label ?? "",
      notes: snapshot.notes ?? "",
    });
  };

  const cancelSnapshotEditing = () => {
    setEditingSnapshotId(null);
    setSnapshotForm({ label: "", notes: "" });
  };

  const submitSnapshot = () => {
    const label = snapshotForm.label.trim();
    const notes = snapshotForm.notes.trim();

    if (editingSnapshotId) {
      updateSnapshotMutation.mutate({
        snapshotId: editingSnapshotId,
        label: label || "Snapshot manual",
        notes,
      });
      return;
    }

    createSnapshotMutation.mutate();
  };

  const toggleSelection = (key: "transport_ids" | "guide_ids" | "cost_component_ids", id: number) => {
    if (!draft) return;
    const current = draft[key];
    updateDraft({ [key]: current.includes(id) ? current.filter((value) => value !== id) : [...current, id] } as Partial<PackageDraft>);
  };

  const moveItem = (from: number, to: number) => {
    if (!draft) return;
    const next = [...draft.itinerary_days];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setItinerary(next.map((item, index) => ({ ...item, hari_ke: index + 1 })));
  };

  const updateItineraryDay = (index: number, patch: Partial<PackageDraft["itinerary_days"][number]>) => {
    if (!draft) return;

    const next = draft.itinerary_days.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item));
    setItinerary(next);
  };

  if (lookupsQuery.isLoading || packagesQuery.isLoading || packageQuery.isLoading) {
    return <div className="flex min-h-[40vh] items-center justify-center"><LoaderCircle className="h-8 w-8 animate-spin text-gold-500" /></div>;
  }

  if (!lookups || !draft) {
    return <Card>Data paket belum tersedia dari backend.</Card>;
  }

  const manualSnapshots = snapshotsQuery.data ?? [];
  const snapshotMutationPending = createSnapshotMutation.isPending || updateSnapshotMutation.isPending;

  const activeHotelMakkah = filteredHotelMakkahOptions.find((item) => item.id === Number(values.hotel_makkah_id ?? draft.hotel_makkah_id));
  const activeHotelMadinah = filteredHotelMadinahOptions.find((item) => item.id === Number(values.hotel_madinah_id ?? draft.hotel_madinah_id));
  const activeAirline = filteredAirlines.find((item) => item.id === Number(values.airline_id ?? draft.airline_id));
  const activeVisa = filteredVisas.find((item) => item.id === Number(values.visa_id ?? draft.visa_id));
  const activeOccupancy = Number(values.room_occupancy ?? draft.room_occupancy);
  const selectedTransports = filteredTransports.filter((item) => draft.transport_ids.includes(item.id));
  const selectedGuides = filteredGuides.filter((item) => draft.guide_ids.includes(item.id));
  const selectedCostComponents = filteredCostComponents.filter((item) => draft.cost_component_ids.includes(item.id));
  const selectedSeasonalItems: SeasonalSelection[] = [];

  if (activeHotelMakkah) selectedSeasonalItems.push({ label: "Hotel Makkah", item: activeHotelMakkah });
  if (activeHotelMadinah) selectedSeasonalItems.push({ label: "Hotel Madinah", item: activeHotelMadinah });
  if (activeAirline) selectedSeasonalItems.push({ label: "Maskapai", item: activeAirline });
  if (activeVisa) selectedSeasonalItems.push({ label: "Visa", item: activeVisa });

  selectedTransports.forEach((item) => selectedSeasonalItems.push({ label: `Transport ${item.nama_layanan}`, item }));
  selectedGuides.forEach((item) => selectedSeasonalItems.push({ label: `Pembimbing ${item.nama}`, item }));
  selectedCostComponents.forEach((item) => selectedSeasonalItems.push({ label: `Komponen ${item.nama}`, item }));
  const missingSeasonalWarnings: AdviceItem[] = [];

  if (!activeHotelMakkah) {
    missingSeasonalWarnings.push({
      title: "Hotel Makkah belum aman",
      description: `Tidak ada hotel Makkah aktif yang menutup perjalanan ${departureDate || "-"} s/d ${tripEndDate || "-"}.`,
      severity: "critical",
    });
  }

  if (!activeHotelMadinah) {
    missingSeasonalWarnings.push({
      title: "Hotel Madinah belum aman",
      description: `Tidak ada hotel Madinah aktif yang menutup perjalanan ${departureDate || "-"} s/d ${tripEndDate || "-"}.`,
      severity: "critical",
    });
  }

  if (!activeAirline) {
    missingSeasonalWarnings.push({
      title: "Maskapai belum aman",
      description: `Tidak ada maskapai aktif yang menutup perjalanan ${departureDate || "-"} s/d ${tripEndDate || "-"}.`,
      severity: "critical",
    });
  }

  if (!activeVisa) {
    missingSeasonalWarnings.push({
      title: "Visa belum aman",
      description: `Tidak ada visa aktif yang menutup perjalanan ${departureDate || "-"} s/d ${tripEndDate || "-"}.`,
      severity: "critical",
    });
  }

  const seasonalWarnings: AdviceItem[] = [...missingSeasonalWarnings];

  selectedSeasonalItems.forEach(({ label, item }) => {
    const bufferDays = dateDiffInDays(tripEndDate, normalizeDate(item.valid_until));

    if (bufferDays <= 3) {
      seasonalWarnings.push({
        title: `${label} sangat mepet`,
        description: `${label} hanya menyisakan buffer ${Math.max(bufferDays, 0)} hari setelah paket berakhir. Sebaiknya ganti sebelum publish.`,
        severity: "critical",
      });

      return;
    }

    if (bufferDays <= 14) {
      seasonalWarnings.push({
        title: `${label} perlu perhatian`,
        description: `${label} masih valid, tetapi hanya punya buffer ${bufferDays} hari setelah paket selesai.`,
        severity: "warning",
      });
    }
  });
  const seasonalRecommendations: AdviceItem[] = [];
  const hotelMakkahRecommendation = pickBestCoverageOption(filteredHotelMakkahOptions);
  const hotelMadinahRecommendation = pickBestCoverageOption(filteredHotelMadinahOptions);
  const airlineRecommendation = pickBestCoverageOption(filteredAirlines);
  const visaRecommendation = pickBestCoverageOption(filteredVisas);

  if (activeHotelMakkah && hotelMakkahRecommendation && activeHotelMakkah.id !== hotelMakkahRecommendation.id) {
    seasonalRecommendations.push({
      title: "Rekomendasi Hotel Makkah",
      description: `Pertimbangkan ${hotelMakkahRecommendation.nama_hotel} karena coverage musiman lebih panjang sampai ${formatValidDate(hotelMakkahRecommendation.valid_until)}.`,
      severity: "warning",
    });
  }

  if (activeHotelMadinah && hotelMadinahRecommendation && activeHotelMadinah.id !== hotelMadinahRecommendation.id) {
    seasonalRecommendations.push({
      title: "Rekomendasi Hotel Madinah",
      description: `Pertimbangkan ${hotelMadinahRecommendation.nama_hotel} karena coverage musiman lebih panjang sampai ${formatValidDate(hotelMadinahRecommendation.valid_until)}.`,
      severity: "warning",
    });
  }

  if (activeAirline && airlineRecommendation && activeAirline.id !== airlineRecommendation.id) {
    seasonalRecommendations.push({
      title: "Rekomendasi Maskapai",
      description: `Pertimbangkan ${airlineRecommendation.nama_maskapai} karena coverage musiman lebih panjang sampai ${formatValidDate(airlineRecommendation.valid_until)}.`,
      severity: "warning",
    });
  }

  if (activeVisa && visaRecommendation && activeVisa.id !== visaRecommendation.id) {
    seasonalRecommendations.push({
      title: "Rekomendasi Visa",
      description: `Pertimbangkan ${visaRecommendation.nama_visa} karena coverage musiman lebih panjang sampai ${formatValidDate(visaRecommendation.valid_until)}.`,
      severity: "warning",
    });
  }
  const coreRecommendations: CoreRecommendation[] = [];

  if (activeHotelMakkah && hotelMakkahRecommendation && activeHotelMakkah.id !== hotelMakkahRecommendation.id) {
    coreRecommendations.push({
      field: "hotel_makkah_id",
      label: "Hotel Makkah",
      recommendedId: hotelMakkahRecommendation.id,
      recommendedName: hotelMakkahRecommendation.nama_hotel,
    });
  }

  if (activeHotelMadinah && hotelMadinahRecommendation && activeHotelMadinah.id !== hotelMadinahRecommendation.id) {
    coreRecommendations.push({
      field: "hotel_madinah_id",
      label: "Hotel Madinah",
      recommendedId: hotelMadinahRecommendation.id,
      recommendedName: hotelMadinahRecommendation.nama_hotel,
    });
  }

  if (activeAirline && airlineRecommendation && activeAirline.id !== airlineRecommendation.id) {
    coreRecommendations.push({
      field: "airline_id",
      label: "Maskapai",
      recommendedId: airlineRecommendation.id,
      recommendedName: airlineRecommendation.nama_maskapai,
    });
  }

  if (activeVisa && visaRecommendation && activeVisa.id !== visaRecommendation.id) {
    coreRecommendations.push({
      field: "visa_id",
      label: "Visa",
      recommendedId: visaRecommendation.id,
      recommendedName: visaRecommendation.nama_visa,
    });
  }

  const riskyTransportIds = selectedTransports
    .filter((item) => dateDiffInDays(tripEndDate, normalizeDate(item.valid_until)) <= 14)
    .map((item) => item.id);
  const riskyGuideIds = selectedGuides
    .filter((item) => dateDiffInDays(tripEndDate, normalizeDate(item.valid_until)) <= 14)
    .map((item) => item.id);
  const riskyCostComponentIds = selectedCostComponents
    .filter((item) => dateDiffInDays(tripEndDate, normalizeDate(item.valid_until)) <= 14)
    .map((item) => item.id);
  const publishBlockers = seasonalWarnings.filter((item) => item.severity === "critical");
  const minimumBufferDays = selectedSeasonalItems.length
    ? Math.min(...selectedSeasonalItems.map(({ item }) => dateDiffInDays(tripEndDate, normalizeDate(item.valid_until))))
    : 0;
  const seasonalHealthSummary: AdviceItem = publishBlockers.length > 0
    ? {
      title: "Publish diblok sementara",
      description: "Masih ada master musiman yang terlalu mepet atau tidak menutup seluruh perjalanan. Selesaikan blocker sebelum publish paket.",
      severity: "critical",
    }
    : seasonalWarnings.length > 0
      ? {
        title: "Komposisi seasonal perlu perhatian",
        description: "Semua master masih valid, tetapi beberapa item memiliki buffer masa berlaku yang mepet setelah perjalanan selesai.",
        severity: "warning",
      }
      : {
        title: "Komposisi seasonal aman",
        description: `Seluruh master terpilih menutup perjalanan penuh dengan buffer minimum ${minimumBufferDays} hari setelah paket selesai.`,
        severity: "success",
      };

  const applyCoreRecommendations = () => {
    if (!coreRecommendations.length) return;

    const nextPatch: Partial<PackageDraft> = {};

    coreRecommendations.forEach((item) => {
      nextPatch[item.field] = item.recommendedId;
      form.setValue(item.field, item.recommendedId);
    });

    updateDraft(nextPatch);
    pushToast({
      title: "Rekomendasi inti diterapkan",
      description: coreRecommendations.map((item) => `${item.label}: ${item.recommendedName}`).join(" | "),
      variant: "success",
    });
  };

  const clearRiskySelections = () => {
    const nextTransportIds = draft.transport_ids.filter((id) => !riskyTransportIds.includes(id));
    const nextGuideIds = draft.guide_ids.filter((id) => !riskyGuideIds.includes(id));
    const nextCostComponentIds = draft.cost_component_ids.filter((id) => !riskyCostComponentIds.includes(id));

    if (
      nextTransportIds.length === draft.transport_ids.length
      && nextGuideIds.length === draft.guide_ids.length
      && nextCostComponentIds.length === draft.cost_component_ids.length
    ) {
      return;
    }

    updateDraft({
      transport_ids: nextTransportIds,
      guide_ids: nextGuideIds,
      cost_component_ids: nextCostComponentIds,
    });
    pushToast({
      title: "Pilihan mepet dibersihkan",
      description: "Transportasi, pembimbing, dan komponen biaya dengan buffer seasonal mepet telah dilepas dari draft.",
      variant: "info",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap gap-3">
          <Button variant={activeTab === "package" ? "primary" : "secondary"} onClick={() => setActiveTab("package")}>
            Paket & Costing
          </Button>
          <Button variant={activeTab === "itinerary" ? "primary" : "secondary"} onClick={() => setActiveTab("itinerary")}>
            Itinerary
          </Button>
        </div>
      </Card>

      {activeTab === "package" ? (
        <div className="grid gap-6 xl:grid-cols-[1.35fr_420px]">
      <div className="space-y-6">
        <Card>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="font-serif text-xl">Builder Paket</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Costing hotel sekarang menggunakan basis fare `double`, `triple`, atau `quad` sesuai komposisi kamar.</p>
            </div>
            <Badge>{draft.status}</Badge>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm md:col-span-2">
              <span>Paket Tersimpan</span>
              <select className="w-full rounded-2xl border border-slate-200 bg-transparent px-4 py-3 dark:border-white/10" value={selectedPackageId ?? ""} onChange={(event) => setSelectedPackageId(Number(event.target.value))}>
                {(packagesQuery.data ?? []).map((item) => <option key={item.id} value={item.id}>{item.nama_paket}</option>)}
              </select>
            </label>
            <label className="space-y-2 text-sm"><span>Template Paket</span><select className="w-full rounded-2xl border border-slate-200 bg-transparent px-4 py-3 dark:border-white/10" onChange={(event) => form.setValue("nama_paket", event.target.value)}>{packageTemplates.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="space-y-2 text-sm"><span>Nama Paket</span><input className="w-full rounded-2xl border border-slate-200 bg-transparent px-4 py-3 dark:border-white/10" {...form.register("nama_paket")} /></label>
            <label className="space-y-2 text-sm"><span>Tanggal Berangkat</span><input type="date" className="w-full rounded-2xl border border-slate-200 bg-transparent px-4 py-3 dark:border-white/10" {...form.register("tanggal_berangkat")} /></label>
            <label className="space-y-2 text-sm"><span>Durasi</span><input type="number" className="w-full rounded-2xl border border-slate-200 bg-transparent px-4 py-3 dark:border-white/10" {...form.register("durasi_hari")} /></label>
            <label className="space-y-2 text-sm"><span>Target Jamaah</span><input type="number" className="w-full rounded-2xl border border-slate-200 bg-transparent px-4 py-3 dark:border-white/10" {...form.register("target_jamaah")} /></label>
            <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-500 dark:border-white/10 dark:text-slate-300 md:col-span-2">
              Hanya master `active` yang berlaku untuk seluruh perjalanan {departureDate || "-"} s/d {tripEndDate || "-"} yang ditampilkan dan boleh disimpan ke paket.
            </div>
            <label className="space-y-2 text-sm"><span>Hotel Makkah</span><select className="w-full rounded-2xl border border-slate-200 bg-transparent px-4 py-3 dark:border-white/10" {...form.register("hotel_makkah_id")}>{filteredHotelMakkahOptions.map((item) => <option key={item.id} value={item.id}>{item.nama_hotel} | s/d {formatValidDate(item.valid_until)}</option>)}</select></label>
            <label className="space-y-2 text-sm"><span>Hotel Madinah</span><select className="w-full rounded-2xl border border-slate-200 bg-transparent px-4 py-3 dark:border-white/10" {...form.register("hotel_madinah_id")}>{filteredHotelMadinahOptions.map((item) => <option key={item.id} value={item.id}>{item.nama_hotel} | s/d {formatValidDate(item.valid_until)}</option>)}</select></label>
            <label className="space-y-2 text-sm"><span>Maskapai</span><select className="w-full rounded-2xl border border-slate-200 bg-transparent px-4 py-3 dark:border-white/10" {...form.register("airline_id")}>{filteredAirlines.map((item) => <option key={item.id} value={item.id}>{item.nama_maskapai} | s/d {formatValidDate(item.valid_until)}</option>)}</select></label>
            <label className="space-y-2 text-sm"><span>Visa</span><select className="w-full rounded-2xl border border-slate-200 bg-transparent px-4 py-3 dark:border-white/10" {...form.register("visa_id")}>{filteredVisas.map((item) => <option key={item.id} value={item.id}>{item.nama_visa} | s/d {formatValidDate(item.valid_until)}</option>)}</select></label>
            <label className="space-y-2 text-sm"><span>Margin %</span><input type="number" className="w-full rounded-2xl border border-slate-200 bg-transparent px-4 py-3 dark:border-white/10" {...form.register("default_margin_percent")} /></label>
            <label className="space-y-2 text-sm"><span>Target Profit</span><input type="number" className="w-full rounded-2xl border border-slate-200 bg-transparent px-4 py-3 dark:border-white/10" {...form.register("target_profit_total")} /></label>
            <label className="space-y-2 text-sm"><span>Malam Makkah</span><input type="number" className="w-full rounded-2xl border border-slate-200 bg-transparent px-4 py-3 dark:border-white/10" {...form.register("makkah_nights")} /></label>
            <label className="space-y-2 text-sm"><span>Malam Madinah</span><input type="number" className="w-full rounded-2xl border border-slate-200 bg-transparent px-4 py-3 dark:border-white/10" {...form.register("madinah_nights")} /></label>
            <label className="space-y-2 text-sm md:col-span-2"><span>Basis Fare Kamar</span><select className="w-full rounded-2xl border border-slate-200 bg-transparent px-4 py-3 dark:border-white/10" {...form.register("room_occupancy")}>{[2, 3, 4].map((value) => <option key={value} value={value}>{roomLabel(value)} ({value} pax/kamar)</option>)}</select></label>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {activeHotelMakkah ? <div className="rounded-3xl border border-slate-200 p-4 text-sm dark:border-white/10"><p className="font-medium">Fare {roomLabel(activeOccupancy)} Makkah</p><p className="mt-2 text-slate-500 dark:text-slate-300">{activeHotelMakkah.nama_hotel} berlaku {formatValidDate(activeHotelMakkah.valid_from)} s/d {formatValidDate(activeHotelMakkah.valid_until)}</p><p className="mt-3 font-serif text-xl">{formatCurrency(convertToIdr(resolveHotelFare(activeOccupancy, activeHotelMakkah), activeHotelMakkah.mata_uang, lookupsQuery.data.exchangeRate))}</p></div> : null}
            {activeHotelMadinah ? <div className="rounded-3xl border border-slate-200 p-4 text-sm dark:border-white/10"><p className="font-medium">Fare {roomLabel(activeOccupancy)} Madinah</p><p className="mt-2 text-slate-500 dark:text-slate-300">{activeHotelMadinah.nama_hotel} berlaku {formatValidDate(activeHotelMadinah.valid_from)} s/d {formatValidDate(activeHotelMadinah.valid_until)}</p><p className="mt-3 font-serif text-xl">{formatCurrency(convertToIdr(resolveHotelFare(activeOccupancy, activeHotelMadinah), activeHotelMadinah.mata_uang, lookupsQuery.data.exchangeRate))}</p></div> : null}
            {activeAirline ? <div className="rounded-3xl border border-slate-200 p-4 text-sm dark:border-white/10"><p className="font-medium">Tarif Tiket</p><p className="mt-2 text-slate-500 dark:text-slate-300">{activeAirline.nama_maskapai} berlaku {formatValidDate(activeAirline.valid_from)} s/d {formatValidDate(activeAirline.valid_until)}</p><p className="mt-3 font-serif text-xl">{formatCurrency(convertToIdr(Number(activeAirline.harga_tiket), activeAirline.mata_uang, lookupsQuery.data.exchangeRate))}</p></div> : null}
            {activeVisa ? <div className="rounded-3xl border border-slate-200 p-4 text-sm dark:border-white/10"><p className="font-medium">Tarif Visa</p><p className="mt-2 text-slate-500 dark:text-slate-300">{activeVisa.nama_visa} berlaku {formatValidDate(activeVisa.valid_from)} s/d {formatValidDate(activeVisa.valid_until)}</p><p className="mt-3 font-serif text-xl">{formatCurrency(convertToIdr(Number(activeVisa.harga), activeVisa.mata_uang, lookupsQuery.data.exchangeRate))}</p></div> : null}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={form.handleSubmit((data) => saveMutation.mutate({ ...draft, ...data }))} disabled={saveMutation.isPending}>{saveMutation.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}Simpan Draft</Button>
            <Button variant="secondary" onClick={() => publishMutation.mutate()} disabled={!selectedPackageId || publishMutation.isPending || publishBlockers.length > 0}>Publish Paket</Button>
            <Button variant="secondary" onClick={() => duplicateMutation.mutate()} disabled={!selectedPackageId || duplicateMutation.isPending}>Duplikasi Paket</Button>
          </div>
          {publishBlockers.length > 0 ? (
            <p className="mt-3 text-sm text-rose-600 dark:text-rose-300">
              Publish dikunci sampai seluruh blocker seasonal terselesaikan.
            </p>
          ) : null}
        </Card>

        <Card>
          <h3 className="font-serif text-xl">Komponen Costing</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div>
              <p className="mb-3 text-sm font-medium">Transportasi</p>
              <div className="space-y-2">{filteredTransports.map((item) => <label key={item.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 px-3 py-2 dark:border-white/10"><input type="checkbox" checked={draft.transport_ids.includes(item.id)} onChange={() => toggleSelection("transport_ids", item.id)} /><span>{item.nama_layanan} | s/d {formatValidDate(item.valid_until)}</span></label>)}</div>
            </div>
            <div>
              <p className="mb-3 text-sm font-medium">Pembimbing</p>
              <div className="space-y-2">{filteredGuides.map((item) => <label key={item.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 px-3 py-2 dark:border-white/10"><input type="checkbox" checked={draft.guide_ids.includes(item.id)} onChange={() => toggleSelection("guide_ids", item.id)} /><span>{item.nama} | s/d {formatValidDate(item.valid_until)}</span></label>)}</div>
            </div>
            <div>
              <p className="mb-3 text-sm font-medium">Komponen Biaya</p>
              <div className="space-y-2">{filteredCostComponents.map((item) => <label key={item.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 px-3 py-2 dark:border-white/10"><input type="checkbox" checked={draft.cost_component_ids.includes(item.id)} onChange={() => toggleSelection("cost_component_ids", item.id)} /><span>{item.nama} | s/d {formatValidDate(item.valid_until)}</span></label>)}</div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-serif text-xl">Itinerary Paket</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                Editor itinerary dipisah ke tab khusus agar halaman paket tetap fokus ke builder dan costing.
              </p>
            </div>
            <Badge>{draft.itinerary_days.length} Hari</Badge>
          </div>
          <div className="mt-4 rounded-2xl border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-500 dark:border-white/10 dark:text-slate-300">
            Durasi paket saat ini {tripDurationDays} hari, dan jumlah hari itinerary selalu mengikuti durasi tersebut secara otomatis.
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => setActiveTab("itinerary")}>
              Buka Tab Itinerary
            </Button>
          </div>
        </Card>
      </div>

      <div className="space-y-6 xl:sticky xl:top-8 xl:self-start">
        <Card>
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-serif text-xl">Daftar Paket Published</h3>
            <Badge>{publishedPackages.length} Published</Badge>
          </div>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
            Hasil publish terkumpul di sini agar mudah dicari dan dibuka kembali.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant={packageListTab === "published" ? "primary" : "secondary"} className="px-3" onClick={() => setPackageListTab("published")}>
              Published ({publishedPackages.length})
            </Button>
            <Button variant={packageListTab === "draft" ? "primary" : "secondary"} className="px-3" onClick={() => setPackageListTab("draft")}>
              Draft ({draftPackages.length})
            </Button>
            <Button variant={packageListTab === "all" ? "primary" : "secondary"} className="px-3" onClick={() => setPackageListTab("all")}>
              Semua ({packageRecords.length})
            </Button>
          </div>

          {visiblePackageList.length > 0 ? (
            <div className="mt-4 space-y-3">
              {visiblePackageList.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedPackageId(item.id)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                    selectedPackageId === item.id
                      ? "border-gold-400 bg-gold-500/10"
                      : "border-slate-200 bg-white hover:border-gold-300 dark:border-white/10 dark:bg-white/5"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{item.nama_paket}</p>
                    <Badge
                      className={
                        item.status === "published"
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                          : item.status === "draft"
                            ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                            : "border-slate-500/30 bg-slate-500/10 text-slate-700 dark:text-slate-300"
                      }
                    >
                      {item.status}
                    </Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-300">
                    <span>Berangkat: {formatValidDate(item.tanggal_berangkat)}</span>
                    <span>Durasi: {item.durasi_hari} hari</span>
                    <span>Target: {item.target_jamaah} jamaah</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-500 dark:border-white/10 dark:text-slate-300">
              Belum ada paket pada filter ini.
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-serif text-xl">Seasonal Advisor</h3>
            <Badge className={adviceTone(seasonalHealthSummary.severity)}>
              {seasonalHealthSummary.severity === "critical" ? "Critical" : seasonalHealthSummary.severity === "warning" ? "Warning" : "Aman"}
            </Badge>
          </div>
          <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${adviceTone(seasonalHealthSummary.severity)}`}>
            <p className="font-medium">{seasonalHealthSummary.title}</p>
            <p className="mt-1">{seasonalHealthSummary.description}</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button variant="secondary" onClick={applyCoreRecommendations} disabled={coreRecommendations.length === 0}>
              Gunakan Rekomendasi Inti
            </Button>
            <Button variant="secondary" onClick={clearRiskySelections} disabled={riskyTransportIds.length + riskyGuideIds.length + riskyCostComponentIds.length === 0}>
              Bersihkan Pilihan Mepet
            </Button>
          </div>
          {(coreRecommendations.length > 0 || riskyTransportIds.length + riskyGuideIds.length + riskyCostComponentIds.length > 0) ? (
            <div className="mt-3 space-y-2 text-sm text-slate-500 dark:text-slate-300">
              {coreRecommendations.length > 0 ? (
                <p>Rekomendasi inti siap diterapkan: {coreRecommendations.map((item) => `${item.label} -> ${item.recommendedName}`).join(" | ")}</p>
              ) : null}
              {riskyTransportIds.length + riskyGuideIds.length + riskyCostComponentIds.length > 0 ? (
                <p>Pembersihan cepat akan melepas pilihan multi-select dengan buffer seasonal 14 hari atau kurang setelah paket selesai.</p>
              ) : null}
            </div>
          ) : null}
          {seasonalWarnings.length > 0 ? (
            <div className="mt-4 space-y-3">
              {seasonalWarnings.map((item) => (
                <div key={`${item.title}-${item.description}`} className={`rounded-2xl border px-4 py-3 text-sm ${adviceTone(item.severity)}`}>
                  <p className="font-medium">{item.title}</p>
                  <p className="mt-1">{item.description}</p>
                </div>
              ))}
            </div>
          ) : null}
          {seasonalRecommendations.length > 0 ? (
            <div className="mt-4 space-y-3">
              {seasonalRecommendations.map((item) => (
                <div key={`${item.title}-${item.description}`} className={`rounded-2xl border px-4 py-3 text-sm ${adviceTone(item.severity)}`}>
                  <p className="font-medium">{item.title}</p>
                  <p className="mt-1">{item.description}</p>
                </div>
              ))}
            </div>
          ) : null}
        </Card>
        <Card className="bg-mesh text-white shadow-glow">
          <h3 className="font-serif text-2xl">Costing Summary</h3>
          <p className="mt-2 text-sm text-slate-200">Ringkasan realtime menggunakan basis fare hotel dan masa berlaku tarif dari backend.</p>
          {localCosting ? (
            <div className="mt-6 space-y-5 text-sm">
              <div className="space-y-3">
                <div className="flex justify-between"><span>Basis Fare</span><strong>{localCosting.basisFare}</strong></div>
                <div className="flex justify-between"><span>Total Hotel</span><strong>{formatCurrency(localCosting.totalHotel)}</strong></div>
                <div className="flex justify-between"><span>Total Tiket</span><strong>{formatCurrency(localCosting.totalTiket)}</strong></div>
                <div className="flex justify-between"><span>Total Visa</span><strong>{formatCurrency(localCosting.totalVisa)}</strong></div>
                <div className="flex justify-between"><span>Biaya Jamaah</span><strong>{formatCurrency(localCosting.totalBiayaJamaah)}</strong></div>
                <div className="flex justify-between"><span>Biaya Grup</span><strong>{formatCurrency(localCosting.totalBiayaGrup)}</strong></div>
                <div className="flex justify-between"><span>Komisi Agen</span><strong>{formatCurrency(localCosting.totalKomisi)}</strong></div>
                <div className="mt-4 border-t border-white/10 pt-4">
                  <div className="flex justify-between"><span>Total Cost</span><strong>{formatCurrency(localCosting.totalCost)}</strong></div>
                  <div className="mt-2 flex justify-between"><span>HPP / Jamaah</span><strong>{formatCurrency(localCosting.hpp)}</strong></div>
                  <div className="mt-2 flex justify-between"><span>Harga Jual</span><strong>{formatCurrency(localCosting.hargaJual)}</strong></div>
                  <div className="mt-2 flex justify-between"><span>Profit Total</span><strong>{formatCurrency(localCosting.profitTotal)}</strong></div>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-medium text-gold-200">Snapshot Costing Manual</h4>
                    <p className="mt-1 text-xs text-slate-200">
                      Simpan versi costing yang sudah jadi sebagai arsip. Gunakan setelah draft paket tersimpan agar angka snapshot konsisten dengan data backend.
                    </p>
                  </div>
                  <Badge>{manualSnapshots.length} Snapshot</Badge>
                </div>

                <div className="mt-4 space-y-3">
                  <label className="block space-y-2 text-xs uppercase tracking-[0.2em] text-slate-300">
                    <span>Label Snapshot</span>
                    <input
                      value={snapshotForm.label}
                      onChange={(event) => setSnapshotForm((current) => ({ ...current, label: event.target.value }))}
                      placeholder="Contoh: Versi margin 15% - Juni"
                      className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm normal-case tracking-normal text-white outline-none placeholder:text-slate-400"
                    />
                  </label>
                  <label className="block space-y-2 text-xs uppercase tracking-[0.2em] text-slate-300">
                    <span>Catatan</span>
                    <textarea
                      value={snapshotForm.notes}
                      onChange={(event) => setSnapshotForm((current) => ({ ...current, notes: event.target.value }))}
                      placeholder="Catatan internal untuk membedakan versi costing ini."
                      rows={3}
                      className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm normal-case tracking-normal text-white outline-none placeholder:text-slate-400"
                    />
                  </label>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <Button type="button" onClick={submitSnapshot} disabled={!selectedPackageId || snapshotMutationPending}>
                    {snapshotMutationPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {editingSnapshotId ? "Perbarui Snapshot" : "Simpan Snapshot"}
                  </Button>
                  {editingSnapshotId ? (
                    <Button type="button" variant="secondary" onClick={cancelSnapshotEditing}>
                      <X className="h-4 w-4" />
                      Batal Edit
                    </Button>
                  ) : null}
                </div>

                {snapshotsQuery.isLoading ? (
                  <div className="mt-4 flex items-center gap-2 text-xs text-slate-300">
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Memuat snapshot costing...
                  </div>
                ) : manualSnapshots.length > 0 ? (
                  <div className="mt-4 space-y-3">
                    {manualSnapshots.map((snapshot) => (
                      <div key={snapshot.id} className="rounded-2xl border border-white/10 bg-white/10 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium text-gold-100">{snapshot.label || "Snapshot manual"}</p>
                            <p className="mt-1 text-xs text-slate-300">{formatDateTime(snapshot.created_at)}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button type="button" variant="secondary" className="px-3" onClick={() => startEditingSnapshot(snapshot)}>
                              <Pencil className="h-4 w-4" />
                              Edit
                            </Button>
                            <Button
                              type="button"
                              variant="secondary"
                              className="px-3"
                              onClick={() => deleteSnapshotMutation.mutate(snapshot.id)}
                              disabled={deleteSnapshotMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                              Hapus
                            </Button>
                          </div>
                        </div>
                        {snapshot.notes ? <p className="mt-2 text-sm text-slate-200">{snapshot.notes}</p> : null}
                        <div className="mt-3 grid gap-2 text-xs text-slate-200 md:grid-cols-2">
                          <div className="flex justify-between gap-3"><span>Jamaah</span><strong>{snapshot.generated_jamaah ?? "-"}</strong></div>
                          <div className="flex justify-between gap-3"><span>Margin</span><strong>{snapshot.generated_margin_percent ?? 0}%</strong></div>
                          <div className="flex justify-between gap-3"><span>HPP / Jamaah</span><strong>{formatCurrency(snapshot.hpp_per_jamaah)}</strong></div>
                          <div className="flex justify-between gap-3"><span>Harga Jual</span><strong>{formatCurrency(snapshot.harga_jual_per_jamaah ?? 0)}</strong></div>
                          <div className="flex justify-between gap-3 md:col-span-2"><span>Profit Total</span><strong>{formatCurrency(snapshot.profit_total ?? 0)}</strong></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl border border-dashed border-white/10 px-4 py-3 text-xs text-slate-300">
                    Belum ada snapshot manual. Simpan versi costing yang sudah stabil untuk arsip, review, atau perbandingan.
                  </div>
                )}
              </div>
            </div>
          ) : <p className="mt-4 text-sm text-slate-200">Pilih paket lengkap untuk melihat ringkasan costing.</p>}
        </Card>

        <Card>
          <h3 className="font-serif text-xl">Komisi Agen</h3>
          <div className="mt-4 space-y-3">
            {agents.map((agent) => (
              <div key={agent.id} className="rounded-2xl border border-slate-200 p-3 dark:border-white/10">
                <p className="font-medium">{agent.nama_agen}</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Fee {formatCurrency(Number(agent.fee_per_jamaah))} | {agent.persentase}% revenue</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-6">
            <Card>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-serif text-xl">Tab Itinerary</h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Jumlah hari otomatis mengikuti durasi paket. Judul dan agenda tiap hari bisa diedit langsung dari tab ini.</p>
                </div>
                <Badge>{draft.itinerary_days.length} Hari</Badge>
              </div>
              <div className="mt-4 rounded-2xl border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-500 dark:border-white/10 dark:text-slate-300">
                Itinerary tersinkron otomatis dengan durasi paket {tripDurationDays} hari. Jika durasi berubah, hari itinerary akan ditambah atau dipangkas menyesuaikan paket.
              </div>
              <div className="mt-5">
                <ItineraryBoard items={draft.itinerary_days} onMove={moveItem} onChange={updateItineraryDay} />
              </div>
            </Card>
          </div>

          <div className="space-y-6 xl:sticky xl:top-8 xl:self-start">
            <Card>
              <h3 className="font-serif text-xl">Ringkasan Itinerary</h3>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between"><span>Nama Paket</span><strong>{draft.nama_paket}</strong></div>
                <div className="flex justify-between"><span>Tanggal Berangkat</span><strong>{departureDate || "-"}</strong></div>
                <div className="flex justify-between"><span>Tanggal Selesai</span><strong>{tripEndDate || "-"}</strong></div>
                <div className="flex justify-between"><span>Durasi Paket</span><strong>{tripDurationDays} hari</strong></div>
                <div className="flex justify-between"><span>Total Hari Itinerary</span><strong>{draft.itinerary_days.length} hari</strong></div>
              </div>
            </Card>

            <Card>
              <h3 className="font-serif text-xl">Aksi Cepat</h3>
              <div className="mt-4 flex flex-col gap-3">
                <Button onClick={() => setActiveTab("package")}>Kembali ke Paket & Costing</Button>
                <Button variant="secondary" onClick={form.handleSubmit((data) => saveMutation.mutate({ ...draft, ...data }))} disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                  Simpan Draft
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
