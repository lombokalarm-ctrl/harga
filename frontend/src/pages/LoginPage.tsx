import { ArrowRight, LoaderCircle } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { roleCards } from "@/data/demo";
import { login } from "@/lib/api";
import { extractApiErrorMessage } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAppStore } from "@/store/useAppStore";
import { useUiStore } from "@/store/useUiStore";

export default function LoginPage() {
  const setSession = useAppStore((state) => state.setSession);
  const pushToast = useUiStore((state) => state.pushToast);

  const loginMutation = useMutation({
    mutationFn: async (email: string) => login(email, "password"),
    onSuccess: ({ token, user }) => {
      setSession(token, user);
      pushToast({ title: "Login berhasil", description: `Masuk sebagai ${user.name}.`, variant: "success" });
    },
    onError: (error) => {
      pushToast({ title: "Login gagal", description: extractApiErrorMessage(error), variant: "error" });
    },
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-mesh px-4 py-8 text-white">
      <Card className="w-full max-w-4xl border-white/10 bg-white/10 p-8 text-white shadow-glow backdrop-blur">
        <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-gold-300">Enterprise SaaS</p>
            <h1 className="mt-4 font-serif text-5xl leading-tight">Hubungkan frontend React ke REST API Laravel tanpa spreadsheet eksternal.</h1>
            <p className="mt-5 max-w-xl text-sm text-slate-200">Klik salah satu role demo untuk login menggunakan akun backend yang sudah terseed. Frontend akan mengambil session token, profil, paket, costing, simulasi, dashboard, dan proposal langsung dari API.</p>
          </div>
          <div className="space-y-4">
            {roleCards.map((role) => (
              <button
                key={role.value}
                onClick={() => loginMutation.mutate(role.email)}
                disabled={loginMutation.isPending}
                className="w-full rounded-[24px] border border-white/10 bg-white/10 p-4 text-left transition hover:border-gold-400/60 hover:bg-white/15 disabled:opacity-60"
              >
                <p className="font-medium text-gold-200">{role.label}</p>
                <p className="mt-2 text-sm text-slate-200">{role.description}</p>
                <p className="mt-3 text-xs text-slate-300">{role.email}</p>
              </button>
            ))}
            <Button className="w-full justify-between" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
              Demo Login
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
