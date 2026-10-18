import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  DATA_CHANGE_STATUSES,
  DATA_WORKFLOW_STEPS,
  getDataManagementMode,
  isDevelopmentDataStore,
  listDataChanges,
  type IndicatorValueChange,
} from "../../data-management";
import { useDataStoreRevision } from "../../hooks/useDataStoreRevision";
import { PERMISSIONS, ROLE_LABELS, useAuth } from "../../auth";

export function WorkspaceHomePage() {
  const { user, hasPermission, hasRole } = useAuth();
  const revision = useDataStoreRevision();
  const [all, setAll] = useState<IndicatorValueChange[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void listDataChanges()
      .then((list) => {
        if (!cancelled) {
          setAll(list);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAll([]);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [revision]);

  if (!user) return null;

  const scope = hasPermission(PERMISSIONS.VIEW_OWN_SUBMISSIONS)
    ? all.filter((c) => c.createdByUserId === user.id)
    : all;

  const counts = {
    draft: scope.filter((c) => c.status === DATA_CHANGE_STATUSES.DRAFT).length,
    pending: (hasPermission(PERMISSIONS.REVIEW_SUBMISSIONS) ? all : scope).filter(
      (c) => c.status === DATA_CHANGE_STATUSES.PENDING_REVIEW
    ).length,
    published: scope.filter((c) => c.status === DATA_CHANGE_STATUSES.PUBLISHED)
      .length,
    rejected: scope.filter((c) => c.status === DATA_CHANGE_STATUSES.REJECTED)
      .length,
  };

  const canPublish = hasPermission(PERMISSIONS.PUBLISH_DATA);
  const canViewOwn = hasPermission(PERMISSIONS.VIEW_OWN_SUBMISSIONS);
  const dataMode = getDataManagementMode();
  const actionable =
    counts.draft +
    counts.rejected +
    (canPublish ? counts.pending : 0);

  return (
    <section className="workspace-panel">
      <p className="eyebrow">Ringkasan</p>
      <h1>Selamat datang, {user.name}</h1>
      <p className="workspace-lede">
        Anda masuk sebagai {ROLE_LABELS[user.role]}. Alur resmi: Draft → Review →
        Publish. Dashboard publik hanya menampilkan data PUBLISHED.
      </p>

      {isDevelopmentDataStore() ? (
        <p className="workspace-dev-banner" role="note">
          Mode pengembangan: perubahan publish disimpan di sesi browser, bukan
          database BPS. File indicators.json tidak diubah.
        </p>
      ) : null}

      {canPublish && counts.pending > 0 ? (
        <p className="ws-pending-banner" role="status">
          Ada <strong>{counts.pending}</strong> pengajuan menunggu review.{" "}
          <Link to="/workspace/review">Buka pusat review</Link>
        </p>
      ) : null}

      {canViewOwn && counts.rejected > 0 ? (
        <p className="ws-pending-banner" role="status">
          Ada <strong>{counts.rejected}</strong> pengajuan ditolak yang perlu
          direvisi. <Link to="/workspace/pengajuan">Buka Pengajuan Saya</Link>
        </p>
      ) : null}

      <div className="workspace-summary-grid">
        <article className="workspace-summary-card">
          <h2>Draft</h2>
          <p className="ws-stat">{loading ? "…" : counts.draft}</p>
        </article>
        <article
          className={
            canPublish && counts.pending > 0
              ? "workspace-summary-card ws-card-emphasis"
              : "workspace-summary-card"
          }
        >
          <h2>Menunggu review</h2>
          <p className="ws-stat">{loading ? "…" : counts.pending}</p>
        </article>
        <article className="workspace-summary-card">
          <h2>Ditolak</h2>
          <p className="ws-stat">{loading ? "…" : counts.rejected}</p>
        </article>
        <article className="workspace-summary-card">
          <h2>Dipublikasikan</h2>
          <p className="ws-stat">{loading ? "…" : counts.published}</p>
        </article>
      </div>

      <p className="muted">
        Item yang perlu tindakan: {loading ? "…" : actionable}
        {canViewOwn ? " (cakupan pengajuan Anda)" : " (seluruh antrian sesi)"}.
      </p>

      <div className="home-cta-row" style={{ marginTop: "0.5rem" }}>
        <Link to="/workspace/pemutakhiran" className="btn btn-primary">
          Pemutakhiran Data
        </Link>
        {canViewOwn ? (
          <Link to="/workspace/pengajuan" className="btn btn-secondary">
            Pengajuan Saya
          </Link>
        ) : null}
        {canPublish ? (
          <Link to="/workspace/review" className="btn btn-secondary">
            Review / Persetujuan
          </Link>
        ) : null}
      </div>

      <div className="workspace-placeholder-box" role="note">
        <p>
          Alur: {DATA_WORKFLOW_STEPS.join(" → ")}. Mode penyimpanan: {dataMode}.
          {hasRole("ADMIN")
            ? " Modul Pengguna dan Pengaturan menunggu kontrak BPS."
            : ""}
        </p>
      </div>
    </section>
  );
}
