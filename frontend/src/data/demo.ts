import type { Role } from "@/types/domain";

export const roleCards: Array<{ label: string; value: Role; description: string; email: string }> = [
  { label: "Super Admin", value: "super_admin", description: "Kelola sistem, user, margin default, dan audit trail.", email: "admin@umrah.test" },
  { label: "Finance", value: "finance", description: "Kelola biaya, kurs, dan validasi komponen costing.", email: "finance@umrah.test" },
  { label: "Marketing", value: "marketing", description: "Bangun paket, hitung harga jual, dan buat proposal.", email: "marketing@umrah.test" },
  { label: "Director", value: "director", description: "Pantau profit, okupansi, dan analisa paket dari dashboard.", email: "director@umrah.test" },
];

export const packageTemplates = [
  "Umrah 9 Hari",
  "Umrah 12 Hari",
  "Umrah Plus Turki",
  "Umrah Plus Mesir",
  "Umrah Plus Dubai",
];
