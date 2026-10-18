import { Route, Routes } from "react-router-dom";
import {
  AuthProvider,
  PERMISSIONS,
  RequireAuth,
  RequirePermission,
} from "./auth";
import { SiteLayout } from "./components/layout/SiteLayout";
import { DashboardIndikatorPage } from "./pages/DashboardIndikatorPage";
import { DataStrategisPage } from "./pages/DataStrategisPage";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { PublikasiPage } from "./pages/PublikasiPage";
import { IndikatorInventoryPage } from "./pages/workspace/IndikatorInventoryPage";
import { PemutakhiranDataPage } from "./pages/workspace/PemutakhiranDataPage";
import { PengajuanSayaPage } from "./pages/workspace/PengajuanSayaPage";
import { ReviewPersetujuanPage } from "./pages/workspace/ReviewPersetujuanPage";
import { RiwayatAuditPage } from "./pages/workspace/RiwayatAuditPage";
import { WorkspaceHomePage } from "./pages/workspace/WorkspaceHomePage";
import { WorkspaceLayout } from "./pages/workspace/WorkspaceLayout";
import { WorkspacePlaceholderPage } from "./pages/workspace/WorkspacePlaceholderPage";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/workspace"
          element={
            <RequireAuth>
              <WorkspaceLayout />
            </RequireAuth>
          }
        >
          <Route index element={<WorkspaceHomePage />} />
          <Route
            path="pemutakhiran"
            element={
              <RequirePermission permission={PERMISSIONS.UPDATE_INDICATOR_VALUES}>
                <PemutakhiranDataPage />
              </RequirePermission>
            }
          />
          <Route
            path="indikator"
            element={
              <RequirePermission permission={PERMISSIONS.READ_INDICATOR_DATA}>
                <IndikatorInventoryPage />
              </RequirePermission>
            }
          />
          <Route
            path="pengajuan"
            element={
              <RequirePermission permission={PERMISSIONS.VIEW_OWN_SUBMISSIONS}>
                <PengajuanSayaPage />
              </RequirePermission>
            }
          />
          <Route
            path="review"
            element={
              <RequirePermission permission={PERMISSIONS.REVIEW_SUBMISSIONS}>
                <ReviewPersetujuanPage />
              </RequirePermission>
            }
          />
          <Route
            path="pengguna"
            element={
              <RequirePermission permission={PERMISSIONS.MANAGE_USERS}>
                <WorkspacePlaceholderPage
                  title="Pengguna"
                  description="Administrasi akun internal. Menunggu kontrak manajemen pengguna BPS."
                />
              </RequirePermission>
            }
          />
          <Route
            path="riwayat"
            element={
              <RequirePermission permission={PERMISSIONS.VIEW_AUDIT_HISTORY}>
                <RiwayatAuditPage />
              </RequirePermission>
            }
          />
          <Route
            path="pengaturan"
            element={
              <RequirePermission permission={PERMISSIONS.MANAGE_SETTINGS}>
                <WorkspacePlaceholderPage
                  title="Pengaturan"
                  description="Konfigurasi ruang kerja. Menunggu kontrak pengaturan BPS."
                />
              </RequirePermission>
            }
          />
        </Route>

        <Route element={<SiteLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/dashboard-indikator" element={<DashboardIndikatorPage />} />
          <Route path="/data-strategis" element={<DataStrategisPage />} />
          <Route path="/publikasi" element={<PublikasiPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
