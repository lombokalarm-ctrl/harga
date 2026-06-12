import { useState } from "react";
import { ArrowRight, LoaderCircle, LockKeyhole, Mail } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { login } from "@/lib/api";
import { extractApiErrorMessage } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAppStore } from "@/store/useAppStore";
import { useUiStore } from "@/store/useUiStore";

export default function LoginPage() {
  const setSession = useAppStore((state) => state.setSession);
  const pushToast = useUiStore((state) => state.pushToast);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => login(email, password),
    onSuccess: ({ token, user }) => {
      setSession(token, user);
      pushToast({ title: "Login berhasil", description: `Masuk sebagai ${user.name}.`, variant: "success" });
    },
    onError: (error) => {
      pushToast({ title: "Login gagal", description: extractApiErrorMessage(error), variant: "error" });
    },
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-mesh px-4 py-8 text-white">
      <Card className="w-full max-w-4xl border-white/10 bg-white/10 p-8 text-white shadow-glow backdrop-blur">
        <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-gold-300">Enterprise SaaS</p>
            <h1 className="mt-4 font-serif text-5xl leading-tight">Hubungkan frontend React ke REST API Laravel tanpa spreadsheet eksternal.</h1>
            <p className="mt-5 max-w-xl text-sm text-slate-200">Masuk dengan akun yang sudah didaftarkan oleh administrator. Frontend akan mengambil session token, profil, paket, costing, simulasi, dashboard, dan proposal langsung dari API.</p>
          </div>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="rounded-[24px] border border-white/10 bg-white/10 p-5">
              <p className="text-lg font-medium text-gold-200">Masuk ke aplikasi</p>
              <p className="mt-2 text-sm text-slate-200">Gunakan email dan password Anda. Kredensial demo tidak ditampilkan di halaman ini.</p>
            </div>

            <label className="block space-y-2 text-sm">
              <span className="text-slate-200">Email</span>
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 focus-within:border-gold-400/60">
                <Mail className="h-4 w-4 text-slate-300" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="nama@perusahaan.com"
                  autoComplete="email"
                  required
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-400"
                />
              </div>
            </label>

            <label className="block space-y-2 text-sm">
              <span className="text-slate-200">Password</span>
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 focus-within:border-gold-400/60">
                <LockKeyhole className="h-4 w-4 text-slate-300" />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Masukkan password"
                  autoComplete="current-password"
                  required
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-400"
                />
              </div>
            </label>

            <Button type="submit" className="w-full justify-between" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
              Masuk
              <ArrowRight className="h-4 w-4" />
            </Button>

            <p className="text-xs text-slate-300">Jika belum memiliki akun, hubungi administrator untuk mendapatkan akses.</p>
          </form>
        </div>
      </Card>
    </div>
  );
}
