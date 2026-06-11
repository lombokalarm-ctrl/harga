import axios from "axios";
import type {
  Agent,
  Airline,
  ApiResponse,
  AuditLog,
  CostComponent,
  CostingSummary,
  DashboardData,
  ExchangeRate,
  Guide,
  Hotel,
  HotelImportPreviewSummary,
  LookupBundle,
  MasterDataImportPreviewSummary,
  OccupancyRow,
  PackageDraft,
  PackageResource,
  Transport,
  User,
  Visa,
} from "@/types/domain";
import { extractApiErrorMessage } from "@/lib/errors";
import { useUiStore } from "@/store/useUiStore";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";
const STORAGE_TOKEN_KEY = "umrah-auth-token";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(STORAGE_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const skipGlobalErrorToast = error.config?.headers?.["X-Skip-Global-Error"] === "true";
    if (!skipGlobalErrorToast) {
      useUiStore.getState().pushToast({
        title: "Request gagal",
        description: extractApiErrorMessage(error),
        variant: "error",
      });
    }

    return Promise.reject(error);
  }
);

function unwrap<T>(response: { data: ApiResponse<T> }) {
  return response.data.data;
}

export async function login(email: string, password: string) {
  const response = await api.post<ApiResponse<{ token: string; user: User }>>(
    "/auth/login",
    {
      email,
      password,
      device_name: "frontend-web",
    },
    {
      headers: {
        "X-Skip-Global-Error": "true",
      },
    }
  );

  return unwrap(response);
}

export async function getMe() {
  const response = await api.get<ApiResponse<User>>("/auth/me", {
    headers: {
      "X-Skip-Global-Error": "true",
    },
  });
  return unwrap(response);
}

export async function logout() {
  await api.post(
    "/auth/logout",
    {},
    {
      headers: {
        "X-Skip-Global-Error": "true",
      },
    }
  );
}

export async function getDashboardSummary() {
  const response = await api.get<ApiResponse<DashboardData>>("/dashboard/summary");
  return unwrap(response);
}

async function getList<T>(path: string) {
  const response = await api.get<ApiResponse<T[]>>(path);
  return unwrap(response);
}

export async function getLookups(): Promise<LookupBundle> {
  const [hotels, airlines, visas, transports, guides, costComponents, agents, exchangeRate] = await Promise.all([
    getList<Hotel>("/hotels?per_page=100"),
    getList<Airline>("/airlines?per_page=100"),
    getList<Visa>("/visas?per_page=100"),
    getList<Transport>("/transports?per_page=100"),
    getList<Guide>("/guides?per_page=100"),
    getList<CostComponent>("/cost-components?per_page=100"),
    getList<Agent>("/agents?per_page=100"),
    getCurrentExchangeRate(),
  ]);

  return { hotels, airlines, visas, transports, guides, costComponents, agents, exchangeRate };
}

export async function createEntity<T>(path: string, payload: Record<string, unknown>) {
  const response = await api.post<ApiResponse<T>>(path, payload);
  return unwrap(response);
}

export async function updateEntity<T>(path: string, id: number, payload: Record<string, unknown>) {
  const response = await api.put<ApiResponse<T>>(`${path}/${id}`, payload);
  return unwrap(response);
}

export async function deleteEntity(path: string, id: number) {
  const response = await api.delete<ApiResponse<null>>(`${path}/${id}`);
  return response.data;
}

export async function importHotelPrices(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post<
    ApiResponse<{
      source_file: string;
      total_rows: number;
      created: number;
      updated: number;
      skipped: number;
      errors: string[];
    }>
  >("/hotels/import", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return unwrap(response);
}

export async function importMasterData(path: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post<
    ApiResponse<{
      source_file: string;
      total_rows: number;
      created: number;
      updated: number;
      skipped: number;
      errors: string[];
    }>
  >(`${path}/import`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return unwrap(response);
}

export async function previewHotelImport(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post<ApiResponse<HotelImportPreviewSummary>>("/hotels/import-preview", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return unwrap(response);
}

export async function previewMasterDataImport(path: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post<ApiResponse<MasterDataImportPreviewSummary>>(`${path}/import-preview`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return unwrap(response);
}

export async function downloadHotelImportTemplate(format: "csv" | "xlsx" | "pdf") {
  const response = await api.get(`/hotels/import-template/${format}`, {
    responseType: "blob",
  });
  const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = blobUrl;
  link.setAttribute("download", `template-import-hotel.${format}`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
}

export async function downloadMasterDataImportTemplate(path: string, format: "csv" | "xlsx" | "pdf") {
  const response = await api.get(`${path}/import-template/${format}`, {
    responseType: "blob",
  });
  const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
  const filenameBase = path.replace(/^\//, "");
  const link = document.createElement("a");
  link.href = blobUrl;
  link.setAttribute("download", `template-import-${filenameBase}.${format}`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
}

export async function getPackages() {
  const response = await api.get<ApiResponse<PackageResource[]>>("/packages?per_page=100");
  return unwrap(response);
}

export async function getPackage(id: number) {
  const response = await api.get<ApiResponse<PackageResource>>(`/packages/${id}`);
  return unwrap(response);
}

export async function createPackage(payload: PackageDraft) {
  const response = await api.post<ApiResponse<PackageResource>>("/packages", payload);
  return unwrap(response);
}

export async function updatePackage(id: number, payload: PackageDraft) {
  const response = await api.put<ApiResponse<PackageResource>>(`/packages/${id}`, payload);
  return unwrap(response);
}

export async function publishPackage(id: number) {
  const response = await api.post<ApiResponse<PackageResource>>(`/packages/${id}/publish`);
  return unwrap(response);
}

export async function duplicatePackage(id: number) {
  const response = await api.post<ApiResponse<PackageResource>>(`/packages/${id}/duplicate`);
  return unwrap(response);
}

export async function getCosting(id: number, params?: { jamaah?: number; margin_percent?: number; target_profit_total?: number }) {
  const response = await api.get<ApiResponse<CostingSummary>>(`/packages/${id}/costing`, { params });
  return unwrap(response);
}

export async function getOccupancy(id: number, payload?: { margin_percent?: number; target_profit_total?: number }) {
  const response = await api.post<ApiResponse<OccupancyRow[]>>(`/packages/${id}/simulations/occupancy`, payload ?? {});
  return unwrap(response);
}

export async function getBep(id: number, payload?: { jamaah?: number; margin_percent?: number; target_profit_total?: number }) {
  const response = await api.post<
    ApiResponse<{
      minimal_jamaah: number | null;
      target_aman: number | null;
      target_ideal: number | null;
      profit_per_jamaah: number;
    }>
  >(`/packages/${id}/simulations/bep`, payload ?? {});
  return unwrap(response);
}

export async function getAuditLogs() {
  const response = await api.get<ApiResponse<AuditLog[]>>("/audit-logs?per_page=100");
  return unwrap(response);
}

export async function getCurrentExchangeRate() {
  const response = await api.get<ApiResponse<ExchangeRate | null>>("/exchange-rates/current");
  return unwrap(response);
}

export async function downloadProtectedFile(path: string, filename: string) {
  const response = await api.post(path, {}, { responseType: "blob" });
  const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = blobUrl;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
}

export function setStoredToken(token: string | null) {
  if (!token) {
    localStorage.removeItem(STORAGE_TOKEN_KEY);
    return;
  }
  localStorage.setItem(STORAGE_TOKEN_KEY, token);
}

export function getStoredToken() {
  return localStorage.getItem(STORAGE_TOKEN_KEY);
}
