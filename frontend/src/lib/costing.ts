import type { CurrencyCode, LookupBundle, PackageDraft } from "@/types/domain";

function convertToIdr(value: number, currency: CurrencyCode, rates: LookupBundle["exchangeRate"]) {
  if (currency === "IDR") return value;
  if (!rates) return value;
  if (currency === "USD") return value * rates.usd_to_idr;
  return value * rates.sar_to_idr;
}

function resolveHotelRate(occupancy: number, hotel: LookupBundle["hotels"][number]) {
  if (occupancy === 2) return Number(hotel.harga_double);
  if (occupancy === 3) return Number(hotel.harga_triple);
  return Number(hotel.harga_quad);
}

export function calculateDraftCosting(draft: PackageDraft, lookups: LookupBundle) {
  const hotelMakkah = lookups.hotels.find((item) => item.id === draft.hotel_makkah_id);
  const hotelMadinah = lookups.hotels.find((item) => item.id === draft.hotel_madinah_id);
  const airline = lookups.airlines.find((item) => item.id === draft.airline_id);
  const visa = lookups.visas.find((item) => item.id === draft.visa_id);
  const selectedTransports = lookups.transports.filter((item) => draft.transport_ids.includes(item.id));
  const selectedGuides = lookups.guides.filter((item) => draft.guide_ids.includes(item.id));
  const selectedCostComponents = lookups.costComponents.filter((item) => draft.cost_component_ids.includes(item.id));
  const selectedAgents = draft.agent_commissions;

  if (!hotelMakkah || !hotelMadinah || !airline || !visa) {
    return null;
  }

  const jamaah = Math.max(1, draft.target_jamaah);
  const occupancy = [2, 3, 4].includes(draft.room_occupancy) ? draft.room_occupancy : 4;
  const roomCount = Math.ceil(jamaah / Math.max(1, occupancy));
  const totalHotel =
    convertToIdr(resolveHotelRate(occupancy, hotelMakkah), hotelMakkah.mata_uang, lookups.exchangeRate) * draft.makkah_nights * roomCount +
    convertToIdr(resolveHotelRate(occupancy, hotelMadinah), hotelMadinah.mata_uang, lookups.exchangeRate) * draft.madinah_nights * roomCount;
  const totalTiket = convertToIdr(Number(airline.harga_tiket), airline.mata_uang, lookups.exchangeRate) * jamaah;
  const totalVisa = convertToIdr(Number(visa.harga), visa.mata_uang, lookups.exchangeRate) * jamaah;
  const totalBiayaJamaah = selectedCostComponents
    .filter((item) => item.kategori === "per_jamaah")
    .reduce((sum, item) => sum + convertToIdr(Number(item.harga), item.mata_uang, lookups.exchangeRate), 0) * jamaah;
  const totalBiayaGrup =
    selectedCostComponents
      .filter((item) => item.kategori === "per_grup")
      .reduce((sum, item) => sum + convertToIdr(Number(item.harga), item.mata_uang, lookups.exchangeRate), 0) +
    selectedTransports.reduce((sum, item) => sum + convertToIdr(Number(item.harga), item.mata_uang, lookups.exchangeRate), 0) +
    selectedGuides.reduce((sum, item) => sum + convertToIdr(Number(item.fee), item.mata_uang, lookups.exchangeRate), 0);
  const totalKomisiFlat = selectedAgents.reduce((sum, item) => sum + Number(item.fee_per_jamaah) * jamaah, 0);
  const baseCost = totalHotel + totalTiket + totalVisa + totalBiayaJamaah + totalBiayaGrup + totalKomisiFlat;
  const hppBase = baseCost / jamaah;
  const hargaJualBase = hppBase * (1 + draft.default_margin_percent / 100);
  const revenueBase = hargaJualBase * jamaah;
  const totalKomisiPercent = selectedAgents.reduce((sum, item) => sum + (revenueBase * Number(item.persentase)) / 100, 0);
  const totalCost = baseCost + totalKomisiPercent;
  const hpp = totalCost / jamaah;
  const hargaJual = hpp * (1 + draft.default_margin_percent / 100);
  const profitTotal = hargaJual * jamaah - totalCost;

  return {
    totalHotel,
    totalTiket,
    totalVisa,
    totalBiayaJamaah,
    totalBiayaGrup,
    totalKomisi: totalKomisiFlat + totalKomisiPercent,
    totalCost,
    hpp,
    hargaJual,
    profitTotal,
    profitPerJamaah: hargaJual - hpp,
    basisFare: occupancy === 2 ? "double" : occupancy === 3 ? "triple" : "quad",
  };
}
