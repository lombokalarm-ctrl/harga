import type { PackageDraft, PackageResource } from "@/types/domain";

export function mapPackageToDraft(resource: PackageResource): PackageDraft {
  return {
    nama_paket: resource.nama_paket,
    tanggal_berangkat: resource.tanggal_berangkat,
    durasi_hari: resource.durasi_hari,
    target_jamaah: resource.target_jamaah,
    hotel_makkah_id: resource.hotel_makkah?.id ?? 0,
    hotel_madinah_id: resource.hotel_madinah?.id ?? 0,
    airline_id: resource.airline?.id ?? 0,
    visa_id: resource.visa?.id ?? 0,
    transport_ids: resource.transports?.map((item) => item.id) ?? [],
    guide_ids: resource.guides?.map((item) => item.id) ?? [],
    cost_component_ids: resource.cost_components?.map((item) => item.id) ?? [],
    status: resource.status,
    default_margin_percent: Number(resource.default_margin_percent ?? 0),
    target_profit_total: Number(resource.target_profit_total ?? 0),
    makkah_nights: resource.makkah_nights,
    madinah_nights: resource.madinah_nights,
    room_occupancy: resource.room_occupancy,
    itinerary_days: resource.itinerary_days?.map((item) => ({
      id: item.id,
      hari_ke: item.hari_ke,
      judul: item.judul,
      deskripsi: item.deskripsi,
    })) ?? [],
    agent_commissions: resource.agent_commissions?.map((item) => ({
      id: item.id,
      agent_id: item.agent_id,
      fee_per_jamaah: Number(item.fee_per_jamaah),
      persentase: Number(item.persentase),
    })) ?? [],
  };
}
