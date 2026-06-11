import type { PropsWithChildren } from "react";
import { Navigate } from "react-router-dom";
import type { Role } from "@/types/domain";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function ProtectedRoute({ allowedRoles, children }: PropsWithChildren<{ allowedRoles: Role[] }>) {
  const role = useAppStore((state) => state.role);

  if (!role) {
    return <Navigate to="/" replace />;
  }

  if (!allowedRoles.includes(role)) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Card className="max-w-xl text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-rose-500">Access Restricted</p>
          <h3 className="mt-4 font-serif text-2xl">Role Anda tidak memiliki akses ke modul ini</h3>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-300">Silakan kembali ke dashboard atau masuk menggunakan role yang memiliki izin ke halaman tersebut.</p>
          <Button className="mt-6" onClick={() => window.location.assign("/")}>Kembali ke Dashboard</Button>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
