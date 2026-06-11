import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { useUiStore } from "@/store/useUiStore";

const styles = {
  success: "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200",
  error: "border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-200",
  info: "border-brand-500/25 bg-brand-500/10 text-brand-700 dark:text-brand-200",
} as const;

const icons = {
  success: CheckCircle2,
  error: TriangleAlert,
  info: Info,
} as const;

export function ToastViewport() {
  const toasts = useUiStore((state) => state.toasts);
  const removeToast = useUiStore((state) => state.removeToast);

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-full max-w-sm flex-col gap-3">
      {toasts.map((toast) => {
        const Icon = icons[toast.variant];
        return (
          <div key={toast.id} className={`pointer-events-auto rounded-3xl border p-4 shadow-glow backdrop-blur ${styles[toast.variant]}`}>
            <div className="flex items-start gap-3">
              <Icon className="mt-0.5 h-5 w-5 shrink-0" />
              <div className="flex-1">
                <p className="font-medium">{toast.title}</p>
                {toast.description ? <p className="mt-1 text-sm opacity-90">{toast.description}</p> : null}
              </div>
              <button onClick={() => removeToast(toast.id)} className="rounded-full p-1 opacity-70 transition hover:bg-black/5 hover:opacity-100 dark:hover:bg-white/10">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
