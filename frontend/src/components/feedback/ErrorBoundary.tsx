import type { PropsWithChildren, ReactNode } from "react";
import { Component } from "react";

interface ErrorBoundaryState {
  hasError: boolean;
  message?: string;
}

export class ErrorBoundary extends Component<PropsWithChildren, ErrorBoundaryState> {
  constructor(props: PropsWithChildren) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error.message };
  }

  override componentDidCatch(error: Error) {
    console.error("Frontend error boundary caught an error", error);
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6 dark:bg-brand-900">
          <div className="max-w-xl rounded-[32px] border border-rose-500/20 bg-white p-8 shadow-glow dark:bg-white/5">
            <p className="text-xs uppercase tracking-[0.35em] text-rose-500">Application Error</p>
            <h1 className="mt-4 font-serif text-3xl text-slate-900 dark:text-white">Terjadi error pada antarmuka aplikasi</h1>
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">{this.state.message ?? "Komponen gagal dirender. Muat ulang halaman untuk mencoba kembali."}</p>
            <button onClick={() => window.location.reload()} className="mt-6 rounded-2xl bg-gold-500 px-4 py-2 text-sm font-medium text-brand-900 transition hover:bg-gold-400">
              Muat Ulang Halaman
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
