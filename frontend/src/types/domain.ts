export type CurrencyCode = "IDR" | "USD" | "SAR";
export type Role = "super_admin" | "finance" | "marketing" | "director";
export type PackageStatus = "draft" | "published" | "archived";
export type CostCategory = "per_jamaah" | "per_grup";

export interface ApiMeta {
  page?: number;
  per_page?: number;
  total?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: ApiMeta;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  is_active: boolean;
}

export interface Hotel {
  id: number;
  nama_hotel: string;
  kota: string;
  kategori_bintang: number;
  alamat: string;
  jarak_ke_masjid: number;
  harga_double: number;
  harga_triple: number;
  harga_quad: number;
  mata_uang: CurrencyCode;
  valid_from: string;
  valid_until: string;
  status: "active" | "inactive";
  foto_url?: string | null;
  import_source_file?: string | null;
}

export interface HotelImportPreviewRow {
  row_number: number;
  action: "create" | "update" | "skip" | "error";
  message: string;
  nama_hotel?: string | null;
  kota?: string | null;
  kategori_bintang?: number | null;
  harga_double?: number | null;
  harga_triple?: number | null;
  harga_quad?: number | null;
  mata_uang?: CurrencyCode | null;
  valid_from?: string | null;
  valid_until?: string | null;
  status?: "active" | "inactive" | null;
}

export interface HotelImportPreviewSummary {
  source_file: string;
  total_rows: number;
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
  preview_rows: HotelImportPreviewRow[];
}

export interface MasterDataImportPreviewRow {
  row_number: number;
  action: "create" | "update" | "skip" | "error";
  message: string;
  record_name?: string | null;
  record_meta?: string | null;
  amount_label: string;
  amount?: number | null;
  currency?: CurrencyCode | null;
  valid_from?: string | null;
  valid_until?: string | null;
  status?: "active" | "inactive" | null;
}

export interface MasterDataImportPreviewSummary {
  source_file: string;
  total_rows: number;
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
  preview_rows: MasterDataImportPreviewRow[];
}

export interface Airline {
  id: number;
  nama_maskapai: string;
  kode_maskapai: string;
  rute: string;
  harga_tiket: number;
  mata_uang: CurrencyCode;
  bagasi: string;
  valid_from: string;
  valid_until: string;
  status: "active" | "inactive";
  logo_url?: string | null;
  import_source_file?: string | null;
}

export interface Visa {
  id: number;
  nama_visa: string;
  harga: number;
  mata_uang: CurrencyCode;
  masa_berlaku: number;
  valid_from: string;
  valid_until: string;
  status: "active" | "inactive";
  import_source_file?: string | null;
}

export interface Transport {
  id: number;
  nama_layanan: string;
  kategori: string;
  harga: number;
  mata_uang: CurrencyCode;
  valid_from: string;
  valid_until: string;
  status: "active" | "inactive";
  import_source_file?: string | null;
}

export interface Guide {
  id: number;
  nama: string;
  jabatan: string;
  jenis: string;
  fee: number;
  mata_uang: CurrencyCode;
  maksimal_jamaah: number;
  valid_from: string;
  valid_until: string;
  status: "active" | "inactive";
  import_source_file?: string | null;
}

export interface CostComponent {
  id: number;
  nama: string;
  kategori: CostCategory;
  harga: number;
  mata_uang: CurrencyCode;
  is_default: boolean;
  valid_from: string;
  valid_until: string;
  status: "active" | "inactive";
  import_source_file?: string | null;
}

export interface Agent {
  id: number;
  nama_agen: string;
  fee_per_jamaah: number;
  persentase: number;
  status: "active" | "inactive";
}

export interface ExchangeRate {
  id?: number;
  usd_to_idr: number;
  sar_to_idr: number;
}

export interface ItineraryDay {
  id?: number;
  hari_ke: number;
  judul: string;
  deskripsi: string;
}

export interface AgentCommission {
  id?: number;
  agent_id: number;
  fee_per_jamaah: number;
  persentase: number;
}

export interface PackageDraft {
  nama_paket: string;
  tanggal_berangkat: string;
  durasi_hari: number;
  target_jamaah: number;
  hotel_makkah_id: number;
  hotel_madinah_id: number;
  airline_id: number;
  visa_id: number;
  transport_ids: number[];
  guide_ids: number[];
  cost_component_ids: number[];
  status: PackageStatus;
  default_margin_percent: number;
  target_profit_total: number;
  makkah_nights: number;
  madinah_nights: number;
  room_occupancy: number;
  itinerary_days: ItineraryDay[];
  agent_commissions: AgentCommission[];
}

export interface PackageResource {
  id: number;
  nama_paket: string;
  tanggal_berangkat: string;
  durasi_hari: number;
  target_jamaah: number;
  status: PackageStatus;
  default_margin_percent: number;
  target_profit_total: number;
  makkah_nights: number;
  madinah_nights: number;
  room_occupancy: number;
  hotel_makkah: Hotel;
  hotel_madinah: Hotel;
  airline: Airline;
  visa: Visa;
  transports: Transport[];
  guides: Guide[];
  cost_components: CostComponent[];
  itinerary_days: ItineraryDay[];
  agent_commissions: AgentCommission[];
  latest_snapshot?: CostingSummary | null;
  created_at: string;
  updated_at: string;
}

export interface CostingSummary {
  jumlah_jamaah: number;
  jumlah_kamar: number;
  basis_fare?: string;
  kurs_aktif?: {
    usd_to_idr?: number | null;
    sar_to_idr?: number | null;
  };
  total_hotel: number;
  total_tiket: number;
  total_visa: number;
  total_biaya_jamaah: number;
  total_biaya_grup: number;
  total_komisi: number;
  total_cost: number;
  hpp_per_jamaah: number;
  harga_jual_per_jamaah: number;
  profit_total: number;
  profit_per_jamaah: number;
  break_even_jamaah: number | null;
  target_aman: number | null;
  target_ideal: number | null;
  margin_percent: number;
  target_profit_total: number;
}

export interface OccupancyRow extends CostingSummary {}

export interface CostingSnapshot {
  id: number;
  label: string | null;
  notes: string | null;
  is_manual: boolean;
  generated_jamaah: number | null;
  generated_margin_percent: number | null;
  generated_target_profit_total: number | null;
  total_cost: number;
  hpp_per_jamaah: number;
  harga_jual_per_jamaah: number | null;
  profit_total: number | null;
  payload_json: CostingSummary;
  created_at: string;
  updated_at: string;
}

export interface DashboardData {
  cards: {
    total_cost: number;
    total_revenue: number;
    total_profit: number;
    profit_margin: number;
    hpp: number;
  };
  profit_projection: Array<{ package: string; profit: number }>;
  occupancy_analysis: Array<{ package: string; jamaah: number }>;
  cost_composition: Array<{ package: string; cost: number }>;
}

export interface AuditLog {
  id: number;
  user_id?: number | null;
  module: string;
  action: string;
  auditable_type?: string | null;
  auditable_id?: number | null;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
}

export interface LookupBundle {
  hotels: Hotel[];
  airlines: Airline[];
  visas: Visa[];
  transports: Transport[];
  guides: Guide[];
  costComponents: CostComponent[];
  agents: Agent[];
  exchangeRate: ExchangeRate | null;
}
