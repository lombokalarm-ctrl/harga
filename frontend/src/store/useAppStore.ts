import { create } from "zustand";
import type { ItineraryDay, PackageDraft, Role, User } from "@/types/domain";
import { setStoredToken } from "@/lib/api";

const STORAGE_USER_KEY = "umrah-auth-user";
const STORAGE_PACKAGE_KEY = "umrah-selected-package";

function readUser(): User | null {
  const raw = localStorage.getItem(STORAGE_USER_KEY);
  return raw ? (JSON.parse(raw) as User) : null;
}

function readSelectedPackageId() {
  const raw = localStorage.getItem(STORAGE_PACKAGE_KEY);
  return raw ? Number(raw) : null;
}

interface AppState {
  user: User | null;
  role: Role | null;
  selectedPackageId: number | null;
  packageDraft: PackageDraft | null;
  setSession: (token: string, user: User) => void;
  setUser: (user: User | null) => void;
  logout: () => void;
  setSelectedPackageId: (id: number | null) => void;
  setPackageDraft: (draft: PackageDraft | null) => void;
  updateDraft: (patch: Partial<PackageDraft>) => void;
  setItinerary: (items: ItineraryDay[]) => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: readUser(),
  role: readUser()?.role ?? null,
  selectedPackageId: readSelectedPackageId(),
  packageDraft: null,
  setSession: (token, user) => {
    setStoredToken(token);
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
    set({ user, role: user.role });
  },
  setUser: (user) => {
    if (user) {
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_USER_KEY);
    }
    set({ user, role: user?.role ?? null });
  },
  logout: () => {
    setStoredToken(null);
    localStorage.removeItem(STORAGE_USER_KEY);
    localStorage.removeItem(STORAGE_PACKAGE_KEY);
    set({ user: null, role: null, selectedPackageId: null, packageDraft: null });
  },
  setSelectedPackageId: (id) => {
    if (id === null) {
      localStorage.removeItem(STORAGE_PACKAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_PACKAGE_KEY, String(id));
    }
    set({ selectedPackageId: id });
  },
  setPackageDraft: (draft) => set({ packageDraft: draft }),
  updateDraft: (patch) => set((state) => ({ packageDraft: state.packageDraft ? { ...state.packageDraft, ...patch } : null })),
  setItinerary: (items) =>
    set((state) => ({
      packageDraft: state.packageDraft ? { ...state.packageDraft, itinerary_days: items } : null,
    })),
}));
