import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import MasterDataPage from "@/pages/MasterDataPage";
import PackageBuilderPage from "@/pages/PackageBuilderPage";
import SimulationPage from "@/pages/SimulationPage";
import ProposalPage from "@/pages/ProposalPage";
import AuditLogPage from "@/pages/AuditLogPage";
import { useAppStore } from "@/store/useAppStore";

export default function App() {
  const user = useAppStore((state) => state.user);

  return (
    <BrowserRouter>
      {!user ? (
        <Routes>
          <Route path="*" element={<LoginPage />} />
        </Routes>
      ) : (
        <AppShell>
          <Routes>
            <Route path="/" element={<ProtectedRoute allowedRoles={["super_admin", "finance", "marketing", "director"]}><DashboardPage /></ProtectedRoute>} />
            <Route path="/master-data" element={<ProtectedRoute allowedRoles={["super_admin", "finance"]}><MasterDataPage /></ProtectedRoute>} />
            <Route path="/packages" element={<ProtectedRoute allowedRoles={["super_admin", "finance", "marketing"]}><PackageBuilderPage /></ProtectedRoute>} />
            <Route path="/simulations" element={<ProtectedRoute allowedRoles={["super_admin", "finance", "marketing", "director"]}><SimulationPage /></ProtectedRoute>} />
            <Route path="/proposal" element={<ProtectedRoute allowedRoles={["super_admin", "marketing", "director"]}><ProposalPage /></ProtectedRoute>} />
            <Route path="/audit-logs" element={<ProtectedRoute allowedRoles={["super_admin"]}><AuditLogPage /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppShell>
      )}
    </BrowserRouter>
  );
}
