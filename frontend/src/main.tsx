import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "./index.css";
import { ErrorBoundary } from "@/components/feedback/ErrorBoundary";
import { ToastViewport } from "@/components/feedback/ToastViewport";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <App />
        <ToastViewport />
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>
);
