import type { PropsWithChildren } from "react";
import { useEffect } from "react";
import { Moon, Sun, LogOut } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { NavLink } from "react-router-dom";
import { getMe, logout as logoutRequest } from "@/lib/api";
import { canAccessRoute } from "@/lib/permissions";
import { useTheme } from "@/hooks/useTheme";
import { useAppStore } from "@/store/useAppStore";
import { useUiStore } from "@/store/useUiStore";
import { Button } from "@/components/ui/button";

const navigation = [
  { label: "Dashboard", path: "/" },
  { label: "Master Data", path: "/master-data" },
  { label: "Paket Umrah", path: "/packages" },
  { label: "Simulasi", path: "/simulations" },
  { label: "Proposal", path: "/proposal" },
  { label: "Audit Log", path: "/audit-logs" },
];

export function AppShell({ children }: PropsWithChildren) {
  const { toggleTheme, isDark } = useTheme();
  const user = useAppStore((state) => state.user);
  const setUser = useAppStore((state) => state.setUser);
  const doLogout = useAppStore((state) => state.logout);
  const pushToast = useUiStore((state) => state.pushToast);

  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    retry: false,
  });

  useEffect(() => {
    if (meQuery.data) {
      setUser(meQuery.data);
    }
  }, [meQuery.data, setUser]);

  useEffect(() => {
    if (meQuery.isError) {
      doLogout();
    }
  }, [doLogout, meQuery.isError]);

  const handleLogout = async () => {
    try {
      await logoutRequest();
    } catch {
      // Tetap lanjut bersihkan session lokal.
    }
    doLogout();
    pushToast({ title: "Logout berhasil", description: "Session frontend telah dibersihkan.", variant: "info" });
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 transition-colors dark:bg-brand-900 dark:text-white">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="relative overflow-hidden border-b border-white/10 bg-mesh px-6 py-8 text-white lg:border-b-0 lg:border-r">
          <div className="mb-8">
            <p className="text-xs uppercase tracking-[0.35em] text-gold-300">SaaS Travel Umrah</p>
            <h1 className="mt-3 font-serif text-3xl font-semibold">Umrah Costing Engine</h1>
            <p className="mt-3 text-sm text-slate-200">Platform costing, profit simulation, proposal generator, dan analisa paket untuk travel umrah dan haji.</p>
          </div>

          <nav className="space-y-2">
            {navigation.filter((item) => canAccessRoute(user?.role ?? null, item.path)).map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `block rounded-2xl px-4 py-3 text-sm transition ${isActive ? "bg-white/14 text-white shadow-glow" : "text-slate-200 hover:bg-white/8 hover:text-white"}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-8 rounded-3xl border border-white/10 bg-white/10 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-gold-300">Akun Aktif</p>
            <p className="mt-2 font-medium">{user?.name ?? "Memuat profil..."}</p>
            <p className="mt-1 text-xs text-slate-300">{user?.email ?? "-"}</p>
            <p className="mt-3 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-gold-200">{user?.role ?? "unknown"}</p>
          </div>
        </aside>

        <main className="p-4 md:p-6 xl:p-8">
          <div className="mb-6 flex flex-col gap-4 rounded-[28px] border border-slate-200 bg-white/90 p-4 shadow-xl shadow-brand-900/5 dark:border-white/10 dark:bg-white/5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-gold-600 dark:text-gold-300">Modern Premium Islamic Travel</p>
              <h2 className="mt-2 font-serif text-2xl">Kontrol biaya, margin, proposal, dan profit dalam satu cockpit</h2>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="secondary" onClick={toggleTheme}>
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {isDark ? "Light Mode" : "Dark Mode"}
              </Button>
              <Button variant="secondary" onClick={handleLogout}>
                <LogOut className="h-4 w-4" /> Logout
              </Button>
            </div>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
